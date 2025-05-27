import { BrowserWindow, ipcMain } from 'electron'
import {
	DBPart,
	IpcOperation,
	IpcOperationType,
	MutationPartCreate,
	MutationPartDelete,
	MutationPartRead,
	MutationPartUpdate,
	MutatedPart,
	Part
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPiecesFromPart } from './pieces'
import { mutations as rundownMutations } from './rundowns'
import { mutations as segmentsMutations } from './segments'
import { stringifyError } from '../util'

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
			type: (part.payload || {}).type,
			float: part.float,
			script: (part.payload || {}).script,
			duration: (part.payload || {}).duration,

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
		const id = payload.id || uuid()
		const document: Partial<MutationPartCreate> = {
			...payload
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
		const args: string[] = []
		if (payload.id) {
			query += `\nWHERE id = ?`
			args.push(payload.id)
		}
		if (payload.rundownId) {
			query += `\nWHERE rundownId = ?`
			args.push(payload.rundownId)
		}
		if (payload.segmentId) {
			query += `\nWHERE segmentId = ?`
			args.push(payload.segmentId)
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
			return { error: e as Error }
		}
	},
	async delete(payload: MutationPartDelete): Promise<{ error?: Error }> {
		try {
			const stmt = db.prepare(`
				BEGIN TRANSACTION;
				DELETE FROM parts
				WHERE id = ?;
				DELETE FROM pieces
				WHERE partId = ?;
				COMMIT;
			`)

			stmt.run(payload.id, payload.id)
			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
}

export async function init(): Promise<void> {
	ipcMain.handle('parts', async (event, operation: IpcOperation) => {
		if (operation.type === IpcOperationType.Create) {
			const { result, error } = await mutations.create(operation.payload)

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
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return error || result
		} else if (operation.type === IpcOperationType.Read) {
			const { result, error } = await mutations.read(operation.payload)

			return error || result
		} else if (operation.type === IpcOperationType.Update) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { result, error } = await mutations.update(operation.payload)

			if (document && 'id' in document && result) {
				try {
					await sendPartDiffToCore(document, result)
				} catch (error) {
					console.error(error)
					event.sender.send('error', stringifyError(error, true))
				}
			}

			return error || result
		} else if (operation.type === IpcOperationType.Delete) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { error } = await mutations.delete(operation.payload)

			if (!error && document && !Array.isArray(document) && !document.float) {
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
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return error || true
		}
	})
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
