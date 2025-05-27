import { BrowserWindow, ipcMain } from 'electron'
import {
	DBSegment,
	IpcOperation,
	IpcOperationType,
	MutationSegmentCreate,
	MutationSegmentDelete,
	MutationSegmentRead,
	MutationSegmentUpdate,
	MutatedSegment,
	Segment
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPartsFromSegment } from './parts'
import { mutations as rundownMutations } from './rundowns'
import { stringifyError } from '../util'

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

async function sendSegmentDiffToCore(oldSegment: Segment, newSegment: Segment) {
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
		const document: Partial<MutationSegmentCreate> = {
			...payload
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
			return { error: e as Error }
		}
	},
	async delete(payload: MutationSegmentDelete): Promise<{ error?: Error }> {
		try {
			const stmt = db.prepare(`
				BEGIN TRANSACTION;
				DELETE FROM segments
				WHERE id = ?;
				DELETE FROM parts
				WHERE segmentId = ?;
				DELETE FROM pieces
				WHERE segmentId = ?;
				COMMIT;
			`)

			stmt.run(payload.id, payload.id, payload.id)
			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
}

export async function init(): Promise<void> {
	ipcMain.handle('segments', async (event, operation: IpcOperation) => {
		if (operation.type === IpcOperationType.Create) {
			const { result, error } = await mutations.create(operation.payload)

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
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return result || error
		} else if (operation.type === IpcOperationType.Read) {
			const { result, error } = await mutations.read(operation.payload)

			return result || error
		} else if (operation.type === IpcOperationType.Update) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { result, error } = await mutations.update(operation.payload)

			if (document && 'id' in document && result) {
				const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await sendSegmentDiffToCore(document, result)
					} catch (error) {
						console.error(error)
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return result || error
		} else if (operation.type === IpcOperationType.Delete) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { error } = await mutations.delete(operation.payload)

			if (document && 'id' in document) {
				const { result: rundown } = await rundownMutations.read({ id: document.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await coreHandler.core.coreMethods.dataSegmentDelete(document.rundownId, document.id)
					} catch (error) {
						console.error(error)
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return error || true
		}
	})
}

export async function getMutatedSegmentsFromRundown(rundownId: string): Promise<MutatedSegment[]> {
	const { result: segments } = await mutations.read({ rundownId })

	if (segments && Array.isArray(segments)) {
		return await Promise.all(segments.map(mutateSegment))
	}

	return []
}
