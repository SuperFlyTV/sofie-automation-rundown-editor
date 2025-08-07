import {
	DBSegment,
	IpcOperationType,
	MutationSegmentCreate,
	MutationSegmentDelete,
	MutationSegmentRead,
	MutationSegmentUpdate,
	MutatedSegment,
	Segment,
	Rundown,
	MutationReorder
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPartsFromSegment } from './parts'
import { mutations as rundownMutations, sendRundownDiffToCore } from './rundowns'
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

export function registerSegmentsHandlers(socket: Socket, _io: Server) {
	socket.on('segments', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await handleCreateSegment(payload)
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
