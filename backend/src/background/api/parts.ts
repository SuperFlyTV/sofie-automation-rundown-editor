import {
	DBPart,
	IpcOperationType,
	MutationPartCreate,
	MutationPartDelete,
	MutationPartRead,
	MutationPartUpdate,
	MutatedPart,
	Part,
	MutationPartMove,
	MutationReorder,
	MutationRundownDelete,
	MutationPartCopy,
	MutationPartCopyResult,
	MutationPartCloneFromSegmentToSegment
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPiecesFromPart } from './pieces'
import { mutations as rundownMutations } from './rundowns'
import { mutations as segmentsMutations, sendSegmentDiffToCore } from './segments'
import { spliceReorder } from '../util'
import { mutations as settingsMutations } from './settings'
import { mutations as piecesMutations } from './pieces'
import { Server, Socket } from 'socket.io'

async function mutatePart(part: Part): Promise<MutatedPart> {
	return {
		externalId: part.id,
		name: part.name,
		rank: part.rank,
		payload: {
			segmentId: part.segmentId,
			externalId: part.id,
			rank: part.rank,
			name: part.name,
			type: part.payload.type ? String(part.payload.type) : undefined,
			float: part.float,
			script: part.payload.script ? String(part.payload.script) : undefined,
			duration:
				part.payload.duration && !isNaN(part.payload.durations as any)
					? Number(part.payload.duration)
					: undefined,

			pieces: await getMutatedPiecesFromPart(part.id)
		}
	}
}

async function sendPartDiffToCore(oldPart: Part, newPart: Part) {
	const rd = await rundownMutations.read({ id: newPart.rundownId })
	if (rd.result && !Array.isArray(rd.result) && rd.result.sync === false) {
		return
	}
	const segment = await segmentsMutations.read({ id: newPart.segmentId })
	if (segment.result && !Array.isArray(segment.result) && segment.result.float === true) {
		return
	}

	if (oldPart.float && !newPart.float) {
		await coreHandler.core.coreMethods.dataPartDelete(
			oldPart.rundownId,
			oldPart.segmentId,
			oldPart.id
		)
	} else if (!oldPart.float && newPart.float) {
		coreHandler.core.coreMethods.dataPartDelete(newPart.rundownId, newPart.segmentId, newPart.id)
	} else if (!oldPart.float && !newPart.float) {
		coreHandler.core.coreMethods.dataPartUpdate(
			newPart.rundownId,
			newPart.segmentId,
			await mutatePart(newPart)
		)
	}
}

export const mutations = {
	async create(payload: MutationPartCreate): Promise<{ result?: Part; error?: Error }> {
		const partTypes: string[] | undefined = (await settingsMutations.read()).result?.partTypes
		const segmentParts: Part | Part[] | undefined = (
			await mutations.read({ segmentId: payload.segmentId })
		).result

		const partsLength: number = Array.isArray(segmentParts)
			? segmentParts.length
			: segmentParts
				? 1
				: 0

		const id = payload.id || uuid()
		const document: Partial<MutationPartCreate> = {
			...payload,
			payload: {
				// fallback Type to avoid errors in core
				type: partTypes?.[0],
				...payload.payload
			},
			rank: payload.rank ?? partsLength
		}
		delete document.playlistId
		delete document.rundownId
		delete document.segmentId

		if (!payload.rundownId || !payload.segmentId)
			return { error: new Error('Missing rundown or segment id') }

		try {
			const stmt = db.prepare(`
				INSERT INTO parts (id,playlistId,rundownId,segmentId,document)
				VALUES (?,?,?,?,json(?));
			`)

			const result = stmt.run(
				id,
				payload.playlistId || null,
				payload.rundownId,
				payload.segmentId,
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
	 * Copy an existing Part.
	 *
	 * This function creates a new `Part` record by duplicating the data of an existing one.
	 * If a `segmentId` is provided, the cloned part will be created inside that target segment.
	 * If no `segmentId` is given, the cloned part will be created within the same segment
	 * as the source part.
	 *
	 * @async
	 * @param {Object} payload - The clone parameters.
	 * @param {string} payload.id - The ID of the source part to clone.
	 * @param {string} [payload.segmentId] - Optional target segment ID where the cloned part should be placed.
	 * @returns {Promise<{ result?: MutationPartCopyResult; error?: Error }>}
	 * Returns an object containing either the newly cloned `Part` and it's newly cloned `Piece`s (`result`)
	 * or an `Error` (`error`) if the operation fails.
	 */
	async createPartCopy(payload: MutationPartCopy) {
		{
			let returnedError: unknown | Error | undefined
			let result: MutationPartCopyResult | undefined

			const { result: sourcePart, error: partReadError } = await mutations.readOne(payload.id)

			if (partReadError || !sourcePart) returnedError = partReadError
			else {
				let targetSegmentId = payload.segmentId || sourcePart.segmentId
				let targetPlaylistId = sourcePart.playlistId
				let targetRundownId = sourcePart.rundownId

				try {
					// If a segmentId was passed, read its metadata for the new part
					if (payload.segmentId && payload.segmentId !== sourcePart.segmentId) {
						const { result: targetSegment, error: partError } = await segmentsMutations.readOne(
							payload.segmentId
						)
						if (partError || !targetSegment)
							throw partError || new Error('Target segment not found')

						targetPlaylistId = targetSegment.playlistId
						targetRundownId = targetSegment.rundownId
					}

					const { result: newPart, error: createError } = await mutations.create({
						...sourcePart,
						playlistId: targetPlaylistId,
						rundownId: targetRundownId,
						segmentId: targetSegmentId,
						name: `${sourcePart.name}${!payload.preserveName ? ' Copy' : ''}`,
						id: undefined
					})

					if (!newPart) {
						console.error(createError)
						throw new Error('Could not create new part while copying.')
					}
					const copiedPieces = await piecesMutations.cloneFromPartToPart({
						fromPartId: sourcePart.id,
						toPartId: newPart.id
					})

					if (copiedPieces.error) {
						throw new Error('Copying the pieces into the part failed')
					}
					const { result: newPartResult, error: _resultReadError } = await mutations.readOne(
						newPart.id
					)

					if (createError) returnedError = createError
					else
						result =
							copiedPieces.result && newPartResult
								? { part: newPartResult, pieces: copiedPieces.result }
								: undefined
				} catch (e) {
					returnedError = e
				}
			}

			return { result: !returnedError ? result : undefined, error: returnedError }
		}
	},
	// TODO: add an optional argument to keep the original name
	async cloneFromSegmentToSegment({
		fromSegmentId,
		toSegmentId
	}: MutationPartCloneFromSegmentToSegment): Promise<{ result?: Part[]; error?: Error }> {
		try {
			const { result: fromSegment } = await segmentsMutations.readOne(fromSegmentId)
			const { result: toSegment } = await segmentsMutations.readOne(toSegmentId)

			if (!fromSegment || !toSegment) {
				throw new Error('Either the source or target Part was not found')
			}

			const { result: sourcePartsResult } = await mutations.read({ segmentId: fromSegmentId })
			const sourceParts = Array.isArray(sourcePartsResult)
				? sourcePartsResult
				: sourcePartsResult
					? [sourcePartsResult]
					: []
			if (sourceParts) {
				return {
					result: (
						await Promise.all(
							sourceParts.map(async (part) => {
								return await mutations.createPartCopy({
									id: part.id,
									segmentId: toSegment.id,
									rundownId: toSegment.rundownId,
									preserveName: true
								})
							})
						)
					).map((p) => {
						if (p.error) throw p.error
						return p.result?.part as Part
					})
				}
			} else {
				throw new Error(`Couldn't find source parts`)
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async move(
		sourcePart: Part,
		targetPart: Part,
		targetIndex: number
	): Promise<{ result?: Part; error?: Error }> {
		try {
			const { result: targetPartsResult } = await mutations.read({
				segmentId: targetPart.segmentId
			})

			const targetParts = Array.isArray(targetPartsResult)
				? targetPartsResult
				: targetPartsResult
					? [targetPartsResult]
					: []

			const sortedTargetParts = [...targetParts].sort((a, b) => a.rank - b.rank)

			const prev = sortedTargetParts[targetIndex - 1]
			const next = sortedTargetParts[targetIndex]

			let rank: number

			if (prev && next) rank = (prev.rank + next.rank) / 2
			else if (prev) rank = prev.rank + 1
			else if (next) rank = next.rank / 2
			else rank = 1

			const addNewPart = await mutations.create({
				...sourcePart,
				rundownId: targetPart.rundownId,
				playlistId: targetPart.playlistId,
				segmentId: targetPart.segmentId,
				rank,
				id: uuid(),
				payload: {
					script: sourcePart.payload.script,
					type: sourcePart.payload.type,
					duration: sourcePart.payload.duration
				}
			})

			if (!addNewPart.result) {
				throw new Error('Could not create new part while cloning.')
			}

			await piecesMutations.cloneFromPartToPart({
				fromPartId: sourcePart.id,
				toPartId: addNewPart.result.id
			})

			await mutations.delete({ id: sourcePart.id })

			return mutations.readOne(addNewPart.result.id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async readOne(id: string): Promise<{ result?: Part; error?: Error }> {
		try {
			const stmt = db.prepare(`
					SELECT *
					FROM parts
					WHERE id = ?
					LIMIT 1;
				`)

			const document = stmt.get(id) as DBPart | undefined
			if (!document) {
				return { error: new Error(`Part with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId,
					rundownId: document.rundownId,
					segmentId: document.segmentId
				}
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationPartRead>
	): Promise<{ result?: Part | Part[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		}

		let query = `
    SELECT *
    FROM parts
  `
		const args: (string | number)[] = []
		const conditions: string[] = []

		if (payload.id) {
			conditions.push(`id = ?`)
			args.push(payload.id)
		}
		if (payload.rundownId) {
			conditions.push(`rundownId = ?`)
			args.push(payload.rundownId)
		}
		if (payload.segmentId) {
			conditions.push(`segmentId = ?`)
			args.push(payload.segmentId)
		}
		if (payload.rank !== null && payload.rank !== undefined) {
			conditions.push(`JSON_EXTRACT(document, '$.rank') = ?`)
			args.push(payload.rank)
		}

		if (conditions.length > 0) {
			query += `\nWHERE ${conditions.join(' AND ')}` // Join conditions with AND
		}

		try {
			const stmt = db.prepare(query)

			const documents = stmt.all(...args) as unknown as DBPart[]

			return {
				result: documents.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					playlistId: d.playlistId,
					rundownId: d.rundownId,
					segmentId: d.segmentId
				}))
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async update(payload: MutationPartUpdate): Promise<{ result?: Part; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null,
			rundownId: null,
			segmentId: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE parts
				SET playlistId = ?, segmentId = ?, document = (SELECT json_patch(parts.document, json(?)) FROM parts WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(
				payload.playlistId || null,
				payload.segmentId || null,
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
	}: MutationReorder<MutationPartUpdate>): Promise<{ result?: Part | Part[]; error?: Error }> {
		try {
			const { result, error } = await this.read({
				segmentId: element.segmentId,
				rundownId: element.rundownId
			})

			if (error) throw error
			if (result && (!('length' in result) || result?.length < 2))
				throw new Error('An error occurred when getting parts from the database during reorder.')

			const safeTargetIndex: number = Math.max(
				0,
				Math.min((result as Part[]).length - 1, targetIndex)
			)

			const partsInRankOrder = (result as Part[]).sort((partA, partB) => partA.rank - partB.rank)
			const reorderedParts = spliceReorder(partsInRankOrder, sourceIndex, safeTargetIndex)

			db.exec('BEGIN;')
			try {
				const updateStmt = db.prepare(`
				UPDATE parts
				SET playlistId = ?, segmentId = ?, document = (SELECT json_patch(parts.document, json(?)) FROM parts WHERE id = ?)
				WHERE id = ?;
			`)

				reorderedParts.forEach((part, index) => {
					updateStmt.run(
						part.playlistId || null,
						part.segmentId || null,
						// update rank based on array order
						JSON.stringify({ ...part, rank: index }),
						part.id,
						part.id
					)
				})

				db.exec('COMMIT;')
			} catch (transactionError) {
				console.error(transactionError)
				db.exec('ROLLBACK;')
				throw transactionError
			}

			const { result: updatedParts, error: updatedPartserror } = await this.read({
				segmentId: element.segmentId,
				rundownId: element.rundownId
			})

			if (updatedPartserror) throw updatedPartserror

			return { result: updatedParts }
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async delete(payload: MutationPartDelete): Promise<{ error?: Error }> {
		try {
			db.exec('BEGIN TRANSACTION')

			db.prepare('DELETE FROM pieces WHERE partId = ?').run(payload.id)
			db.prepare('DELETE FROM parts WHERE id = ?').run(payload.id)

			db.exec('COMMIT')

			return {}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	}
}

export function registerPartsHandlers(socket: Socket, io: Server) {
	socket.on('parts', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await handlePartCreate(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Copy:
				{
					const { result, error } = await handleCopyPart(payload)
					io.emit('pieces:update', {
						action: 'update',
						pieces: result?.pieces
					})
					callback(result?.part || error)
				}
				break
			case IpcOperationType.Move:
				{
					const { result, error } = await handlePartMove(payload)
					callback(result || error)
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
					const { result, error } = await handlePartUpdate(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Reorder:
				{
					const { result, error } = await handlePartReorder(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Delete:
				{
					const { result, error } = await handlePartDelete(payload)
					callback(result || error)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}

async function handlePartCreate(payload: MutationPartCreate) {
	{
		let returnedError: unknown | Error | undefined

		const { result, error: createError } = await mutations.create(payload)

		if (createError) returnedError = createError

		if (result && !result.float) {
			const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
			if (rundown && !Array.isArray(rundown) && rundown.sync) {
				try {
					await coreHandler.core.coreMethods.dataPartCreate(
						result.rundownId,
						result.segmentId,
						await mutatePart(result)
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
async function handleCopyPart(payload: MutationPartCopy) {
	let returnedError: unknown | Error | undefined

	const { result, error: cloneError } = await mutations.createPartCopy(payload)

	if (cloneError) returnedError = cloneError

	if (result) {
		try {
			const { result: targetSegment } = await segmentsMutations.readOne(result.part.segmentId)

			if (targetSegment) {
				await sendSegmentDiffToCore(targetSegment, targetSegment)
			} else throw new Error('Cannot find the target segment to send to Core while copying part.')
		} catch (error) {
			console.error(error)
			returnedError = error
		}
	}

	return { result, error: returnedError }
}
async function handlePartUpdate(payload: MutationPartUpdate) {
	{
		let returnedError: unknown | Error | undefined

		const { result: document } = await mutations.read({ id: payload.id })
		const { result, error: updateError } = await mutations.update(payload)

		if (updateError) returnedError = updateError

		if (document && 'id' in document && result) {
			try {
				await sendPartDiffToCore(document, result)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result, error: returnedError }
	}
}
async function handlePartMove(payload: MutationPartMove) {
	// TODO: Maybe this should be handled inside Sofie?
	let returnedError: unknown | Error | undefined
	let returnedResult: Part | undefined

	try {
		const { sourcePart, targetPart, targetIndex } = payload
		const { result: document, error: sourceError } = await mutations.readOne(sourcePart.id)
		if (sourceError) throw sourceError
		const { result: target, error: targetError } = await mutations.readOne(targetPart.id)
		if (targetError) throw targetError

		if (document && target) {
			const { result, error } = await mutations.move(sourcePart, targetPart, targetIndex)
			if (error) throw error

			const { result: sourceSegment } = await segmentsMutations.readOne(document.segmentId)
			const { result: targetSegment } = await segmentsMutations.readOne(target.segmentId)

			if (result && sourceSegment && targetSegment) {
				await sendSegmentDiffToCore(sourceSegment, sourceSegment)
				await sendSegmentDiffToCore(targetSegment, targetSegment)
			} else throw new Error('Cannot find segments while cloning')
			returnedResult = result
		}
	} catch (e) {
		console.error(e)
		returnedError = e
	}

	return { result: returnedResult, error: returnedError }
}
async function handlePartReorder(payload: MutationReorder<MutationPartUpdate>) {
	let returnedError: unknown | Error | undefined

	const { result: sourceDocument } = await mutations.read({ id: payload.element.id })
	const { result: reorderedParts, error: reorderError } = await mutations.reorder(payload)

	if (reorderError) returnedError = reorderError

	if (
		!reorderError &&
		sourceDocument &&
		!Array.isArray(sourceDocument) &&
		Array.isArray(reorderedParts)
	) {
		const { result: rundown } = await rundownMutations.read({ id: sourceDocument.rundownId })
		if (rundown && !Array.isArray(rundown) && rundown.sync) {
			try {
				const { result: segment, error: segmentError } = await segmentsMutations.readOne(
					sourceDocument.segmentId
				)
				// We need to update the entire segment, because otherwise core also reorders the parts in some cases.
				if (segment && !segmentError) {
					await sendSegmentDiffToCore(segment, segment)
				}
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}
	}

	return { result: returnedError === undefined ? reorderedParts : undefined, error: returnedError }
}
async function handlePartDelete(payload: MutationRundownDelete) {
	let returnedError: unknown | Error | undefined

	const { result: document } = await mutations.read({ id: payload.id })
	const { error: deleteError } = await mutations.delete(payload)

	if (deleteError) returnedError = deleteError

	if (!deleteError && document && !Array.isArray(document) && !document.float) {
		const { result: rundown } = await rundownMutations.read({ id: document.rundownId })
		if (rundown && !Array.isArray(rundown) && rundown.sync) {
			try {
				await coreHandler.core.coreMethods.dataPartDelete(
					document.rundownId,
					document.segmentId,
					document.id
				)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}
	}

	return { result: returnedError === undefined, error: returnedError }
}

export async function sendPartUpdateToCore(partId: string) {
	const { result } = await mutations.read({ id: partId })

	if (result && !Array.isArray(result) && !result.float) {
		const rd = await rundownMutations.read({ id: result.rundownId })
		if (rd.result && !Array.isArray(rd.result) && rd.result.sync === false) {
			return
		}
		const segment = await segmentsMutations.read({ id: result.segmentId })
		if (segment.result && !Array.isArray(segment.result) && segment.result.float === true) {
			return
		}

		await coreHandler.core.coreMethods.dataPartUpdate(
			result.rundownId,
			result.segmentId,
			await mutatePart(result)
		)
	}
}

export async function getMutatedPartsFromSegment(segmentId: string): Promise<MutatedPart[]> {
	const { result: parts } = await mutations.read({ segmentId })

	if (parts && Array.isArray(parts)) {
		return await Promise.all(parts.map(mutatePart))
	}

	return []
}
