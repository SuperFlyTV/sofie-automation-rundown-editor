import {
	DBSegment,
	IpcOperationType,
	MutationSegmentCreate,
	MutationSegmentDelete,
	MutationSegmentRead,
	MutationSegmentUpdate,
	MutatedSegment,
	Segment,
	MutationReorder,
	MutationSegmentCopy,
	MutationSegmentCopyResult,
	MutationSegmentCloneFromRundownToRundown
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPartsFromSegment } from './parts'
import { mutations as rundownMutations, sendRundownDiffToCore } from './rundowns'
import { mutations as partMutations } from './parts'
import { mutations as piecesMutations } from './pieces'
import { spliceReorder } from '../util'
import { Server, Socket } from 'socket.io'

async function mutateSegment(segment: Segment): Promise<MutatedSegment> {
	return {
		externalId: segment.id,
		name: segment.name,
		rank: segment.rank,
		payload: {
			name: segment.name,
			rank: segment.rank
		},
		parts: await getMutatedPartsFromSegment(segment.id)
	}
}

export async function sendSegmentDiffToCore(oldSegment: Segment, newSegment: Segment) {
	const rd = await rundownMutations.read({ id: newSegment.rundownId })
	if (rd.result && !Array.isArray(rd.result) && rd.result.sync === false) {
		return
	}

	if (oldSegment.float && !newSegment.float) {
		await coreHandler.core.coreMethods.dataSegmentCreate(
			newSegment.rundownId,
			await mutateSegment(newSegment)
		)
	} else if (!oldSegment.float && newSegment.float) {
		await coreHandler.core.coreMethods.dataSegmentDelete(newSegment.rundownId, newSegment.id)
	} else if (!oldSegment.float && !newSegment.float) {
		await coreHandler.core.coreMethods.dataSegmentUpdate(
			newSegment.rundownId,
			await mutateSegment(newSegment)
		)
	}
}

export const mutations = {
	async create(payload: MutationSegmentCreate): Promise<{ result?: Segment; error?: Error }> {
		const id = payload.id || uuid()
		const rundownSegments: Segment | Segment[] | undefined = (
			await mutations.read({ rundownId: payload.rundownId })
		).result

		const segmentsLength: number = Array.isArray(rundownSegments)
			? rundownSegments.length
			: rundownSegments
				? 1
				: 0

		const document: Partial<MutationSegmentCreate> = {
			...payload,
			rank: payload.rank ?? segmentsLength
		}
		delete document.playlistId
		delete document.rundownId

		if (!payload.rundownId)
			return {
				error: new Error('Missing rundownId')
			}

		try {
			const stmt = db.prepare(`
				INSERT INTO segments (id,playlistId,rundownId,document)
				VALUES (?,?,?,json(?));
			`)

			const result = stmt.run(
				id,
				payload.playlistId || null,
				payload.rundownId,
				JSON.stringify(document)
			)
			if (result.changes === 0) throw new Error('No rows were inserted')

			return this.readOne(id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	/**
	 * Copy an existing Segment.
	 *
	 * This function creates a new `Segment` record by duplicating the data of an existing one.
	 * If a `rundownId` is provided, the cloned segment will be created inside that target rundown.
	 * If no `segmentId` is given, the cloned segment will be created within the same rundown
	 * as the source segment.
	 *
	 * @async
	 * @param {Object} payload - The clone parameters.
	 * @param {string} payload.id - The ID of the source segment to clone.
	 * @param {string} [payload.rundownId] - Optional target rundown ID where the cloned segment should be placed.
	 * @returns {Promise<{ result?: MutationSegmentCopyResult; error?: Error }>}
	 * Returns an object containing either the newly cloned `Segment`, it's `Part`s and `Piece`s (`result`)
	 * or an `Error` (`error`) if the operation fails.
	 */
	async createSegmentCopy(payload: MutationSegmentCopy) {
		{
			let returnedError: unknown | Error | undefined
			let result: MutationSegmentCopyResult | undefined

			const { result: sourceSegment, error: segmentReadError } = await mutations.readOne(payload.id)

			if (segmentReadError || !sourceSegment) returnedError = segmentReadError
			else {
				let targetPlaylistId = sourceSegment.playlistId
				let targetRundownId = payload.rundownId

				try {
					// If a segmentId was passed, read its metadata for the new part
					if (payload.rundownId !== sourceSegment.rundownId) {
						const { result: targetRundown, error: rundownError } = await rundownMutations.readOne(
							payload.rundownId
						)
						if (rundownError || !targetRundown)
							throw rundownError || new Error('Target segment not found')

						targetPlaylistId = targetRundown.playlistId
					}

					const { result: newSegment, error: createError } = await mutations.create({
						...sourceSegment,
						playlistId: targetPlaylistId,
						rundownId: targetRundownId,
						name: `${sourceSegment.name}${!payload.preserveName ? ' Copy' : ''}`,
						id: undefined
					})

					if (!newSegment) {
						console.error(createError)
						throw new Error('Could not create new part while copying.')
					}
					const copiedParts = await partMutations.cloneFromSegmentToSegment({
						fromSegmentId: sourceSegment.id,
						toSegmentId: newSegment.id
					})

					if (copiedParts.error) {
						throw new Error('Copying the parts into the segment failed')
					}

					const { result: newSegmentResult, error: _resultReadError } = await mutations.readOne(
						newSegment.id
					)
					const { result: piecesResult, error: piecesResultReadError } = await piecesMutations.read(
						{
							segmentId: newSegment.id
						}
					)

					if (createError || piecesResultReadError)
						returnedError = createError || piecesResultReadError
					else
						result =
							copiedParts.result && newSegmentResult && piecesResult
								? {
										segment: newSegmentResult,
										parts: copiedParts.result,
										pieces: Array.isArray(piecesResult) ? piecesResult : [piecesResult]
									}
								: undefined
				} catch (e) {
					returnedError = e
				}
			}

			return { result: !returnedError ? result : undefined, error: returnedError }
		}
	},
	async readOne(id: string): Promise<{ result?: Segment; error?: Error }> {
		try {
			const stmt = db.prepare(`
				SELECT *
				FROM segments
				WHERE id = ?
				LIMIT 1;
			`)

			const document = stmt.get(id) as DBSegment | undefined
			if (!document) {
				return { error: new Error(`Segment with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					rundownId: document.rundownId,
					playlistId: document.playlistId
				}
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	// TODO: add an optional argument to keep the original name
	async cloneFromRundownToRundown({
		fromRundownId,
		toRundownId
	}: MutationSegmentCloneFromRundownToRundown): Promise<{ result?: Segment[]; error?: Error }> {
		try {
			const { result: fromRundown } = await rundownMutations.readOne(fromRundownId)
			const { result: toRundown } = await rundownMutations.readOne(toRundownId)

			if (!fromRundown || !toRundown) {
				throw new Error('Either the source or target Part was not found')
			}

			const { result: sourceSegmentsResult } = await mutations.read({ rundownId: fromRundownId })
			const sourceSegments = Array.isArray(sourceSegmentsResult)
				? sourceSegmentsResult
				: sourceSegmentsResult
					? [sourceSegmentsResult]
					: []
			if (sourceSegments) {
				return {
					result: (
						await Promise.all(
							sourceSegments.map(async (segment) => {
								return await mutations.createSegmentCopy({
									id: segment.id,
									rundownId: toRundown.id,
									preserveName: true
								})
							})
						)
					).map((r) => {
						if (r.error) throw r.error
						return r.result?.segment as Segment
					})
				}
			} else {
				throw new Error(`Couldn't find source segments`)
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationSegmentRead>
	): Promise<{ result?: Segment | Segment[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		} else if (payload && payload.rundownId) {
			try {
				const stmt = db.prepare(`
					SELECT *
					FROM segments
					WHERE rundownId = ?
				`)

				const documents = stmt.all(payload.rundownId) as unknown as DBSegment[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id,
						rundownId: d.rundownId,
						playlistId: d.playlistId
					}))
				}
			} catch (e) {
				console.error(e)
				return { error: e as Error }
			}
		} else {
			try {
				const stmt = db.prepare(`
					SELECT *
					FROM segments
				`)

				const documents = stmt.all() as unknown as DBSegment[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id,
						rundownId: d.rundownId,
						playlistId: d.playlistId
					}))
				}
			} catch (e) {
				console.error(e)
				return { error: e as Error }
			}
		}
	},
	async update(payload: MutationSegmentUpdate): Promise<{ result?: Segment; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null,
			rundownId: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE segments
				SET playlistId = ?, document = (SELECT json_patch(segments.document, json(?)) FROM segments WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(
				payload.playlistId || null,
				JSON.stringify(update),
				payload.id,
				payload.id
			)
			if (result.changes === 0) {
				throw new Error('No rows were updated')
			}

			return this.readOne(payload.id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async reorder({
		element,
		sourceIndex,
		targetIndex
	}: MutationReorder<MutationSegmentUpdate>): Promise<{
		result?: Segment | Segment[]
		error?: Error
	}> {
		try {
			const { result, error } = await this.read({
				rundownId: element.rundownId
			})

			if (error) throw error
			if (result && (!('length' in result) || result?.length < 2))
				throw new Error('An error occurred when getting segments from the database during reorder.')

			const safeTargetIndex: number = Math.max(
				0,
				Math.min((result as Segment[]).length - 1, targetIndex)
			)

			const segmentsInRankOrder = (result as Segment[]).sort(
				(partA, partB) => partA.rank - partB.rank
			)
			const reorderedSegments = spliceReorder(segmentsInRankOrder, sourceIndex, safeTargetIndex)

			db.exec('BEGIN;')
			try {
				const updateStmt = db.prepare(`
					UPDATE segments
					SET playlistId = ?, document = (SELECT json_patch(segments.document, json(?)) FROM segments WHERE id = ?)
					WHERE id = ?;
				`)

				reorderedSegments.forEach((segment, index) => {
					updateStmt.run(
						segment.playlistId || null,
						// update rank based on array order
						JSON.stringify({ ...segment, rank: index }),
						segment.id,
						segment.id
					)
				})

				db.exec('COMMIT;')
			} catch (transactionError) {
				console.error(transactionError)
				db.exec('ROLLBACK;')
				throw transactionError
			}

			const { result: updatedSegments, error: updatedSegmentsError } = await this.read({
				rundownId: element.rundownId
			})

			if (updatedSegmentsError) throw updatedSegmentsError

			return { result: updatedSegments }
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async delete(payload: MutationSegmentDelete): Promise<{ error?: Error }> {
		try {
			db.exec('BEGIN TRANSACTION')

			db.prepare('DELETE FROM pieces WHERE segmentId = ?').run(payload.id)
			db.prepare('DELETE FROM parts WHERE segmentId = ?').run(payload.id)
			db.prepare('DELETE FROM segments WHERE id = ?').run(payload.id)

			db.exec('COMMIT')

			return {}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	}
}

export function registerSegmentsHandlers(socket: Socket, io: Server) {
	socket.on('segments', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await handleCreateSegment(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Copy:
				{
					const { result, error } = await handleCopySegment(payload)
					io.emit('parts:update', {
						action: 'update',
						pieces: result?.parts
					})
					io.emit('pieces:update', {
						action: 'update',
						pieces: result?.pieces
					})
					callback(result?.segment || error)
				}
				break
			case IpcOperationType.Read:
				{
					const { result, error } = await mutations.read(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Update:
				{
					const { result, error } = await handleUpdateSegment(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Reorder:
				{
					const { result, error } = await handleReorderSegments(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Delete:
				{
					const { result, error } = await handleDeleteSegment(payload)
					callback(result || error)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}

async function handleCreateSegment(payload: MutationSegmentCreate) {
	{
		let returnedError: unknown | Error | undefined

		const { result, error: createError } = await mutations.create(payload)

		if (createError) returnedError = createError

		if (result && !result.float) {
			const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
			if (rundown && !Array.isArray(rundown) && rundown.sync) {
				try {
					await coreHandler.core.coreMethods.dataSegmentCreate(
						result.rundownId,
						await mutateSegment(result)
					)
				} catch (error) {
					console.error(error)
					returnedError = error
				}
			}
		}

		return { result, error: returnedError }
	}
}
async function handleCopySegment(payload: MutationSegmentCopy) {
	let returnedError: unknown | Error | undefined

	const { result, error: cloneError } = await mutations.createSegmentCopy(payload)

	if (cloneError) returnedError = cloneError

	if (result) {
		try {
			const { result: targetRundown } = await rundownMutations.readOne(result.segment.rundownId)

			if (targetRundown) {
				await sendRundownDiffToCore(targetRundown, targetRundown)
			} else
				throw new Error('Cannot find the target rundown to send to Core while copying segment.')
		} catch (error) {
			console.error(error)
			returnedError = error
		}
	}

	return { result, error: returnedError }
}
async function handleUpdateSegment(payload: MutationSegmentUpdate) {
	{
		let returnedError: unknown | Error | undefined

		const { result: document } = await mutations.read({ id: payload.id })
		const { result, error: updateError } = await mutations.update(payload)

		if (document && 'id' in document && result && !updateError) {
			const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
			if (rundown && !Array.isArray(rundown) && rundown.sync) {
				try {
					await sendSegmentDiffToCore(document, result)
				} catch (error) {
					console.error(error)
					returnedError = error
				}
			}
		} else returnedError = updateError

		// TODO: handle core errors better
		return { result, error: returnedError }
	}
}

async function handleReorderSegments(payload: MutationReorder<MutationSegmentUpdate>) {
	{
		let returnedError: unknown | Error | undefined

		const { result: sourceDocument } = await mutations.read({ id: payload.element.id })
		const { result: reorderedSegments, error: reorderError } = await mutations.reorder(payload)

		if (
			!reorderError &&
			sourceDocument &&
			!Array.isArray(sourceDocument) &&
			Array.isArray(reorderedSegments)
		) {
			const { result: rundown, error: rundownError } = await rundownMutations.read({
				id: sourceDocument.rundownId
			})
			if (rundown && !Array.isArray(rundown) && rundown.sync) {
				try {
					if (rundown && !rundownError) {
						await sendRundownDiffToCore(rundown, rundown)
					}
				} catch (error) {
					console.error(error)
					returnedError = error
				}
			}
		} else returnedError = reorderError

		return { result: reorderedSegments, error: returnedError }
	}
}
async function handleDeleteSegment(payload: MutationSegmentDelete) {
	{
		let returnedError: unknown | Error | undefined

		const { result: document } = await mutations.read({ id: payload.id })
		const { error: deleteError } = await mutations.delete(payload)

		if (deleteError) returnedError = deleteError

		if (document && 'id' in document) {
			const { result: rundown } = await rundownMutations.read({ id: document.rundownId })
			if (rundown && !Array.isArray(rundown) && rundown.sync) {
				try {
					await coreHandler.core.coreMethods.dataSegmentDelete(document.rundownId, document.id)
				} catch (error) {
					console.error(error)
					returnedError = error
				}
			}
		}

		return { result: returnedError === undefined ? true : undefined, error: returnedError }
	}
}

export async function getMutatedSegmentsFromRundown(rundownId: string): Promise<MutatedSegment[]> {
	const { result: segments } = await mutations.read({ rundownId })

	if (segments && Array.isArray(segments)) {
		return await Promise.all(segments.map(mutateSegment))
	}

	return []
}
