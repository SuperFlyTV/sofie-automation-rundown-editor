import { BrowserWindow, ipcMain } from 'electron'
import {
	DBRundown,
	IpcOperation,
	IpcOperationType,
	MutationRundownCreate,
	MutationRundownDelete,
	MutationRundownRead,
	MutationRundownUpdate,
	MutatedRundown,
	Rundown
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedSegmentsFromRundown } from './segments'
import { stringifyError } from '../util'

export async function mutateRundown(rundown: Rundown): Promise<MutatedRundown> {
	return {
		externalId: rundown.id,
		name: rundown.name,
		type: 'sofie-rundown-editor', // ?
		segments: await getMutatedSegmentsFromRundown(rundown.id),
		payload: {
			name: rundown.name,
			expectedStart: rundown.expectedStartTime,
			expectedEnd: rundown.expectedEndTime,
			...(rundown.metaData || {})
		}
	}
}

async function sendRundownDiffToCore(oldDocument: Rundown, newDocument: Rundown) {
	if (oldDocument.sync && !newDocument.sync) {
		console.log('delete rundown', oldDocument, newDocument)
		return coreHandler.core.coreMethods.dataRundownDelete(oldDocument.id)
	} else if (!oldDocument.sync && newDocument.sync) {
		console.log('create rundown', oldDocument, newDocument)
		return coreHandler.core.coreMethods.dataRundownCreate(await mutateRundown(newDocument))
	} else if (oldDocument.sync && newDocument.sync) {
		console.log('update rundown', oldDocument, newDocument)
		return coreHandler.core.coreMethods.dataRundownUpdate(await mutateRundown(newDocument))
	}
}

export const mutations = {
	async create(payload: MutationRundownCreate): Promise<{ result?: Rundown; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationRundownCreate> = {
			...payload
		}
		delete document.id
		delete document.playlistId

		try {
			const stmt = db.prepare(`
				INSERT INTO rundowns (id,playlistId,document)
				VALUES (?,?,json(?));
			`)

			const result = stmt.run(id, payload.playlistId || null, JSON.stringify(document))
			if (result.changes === 0) throw new Error('No rows were inserted')

			console.log(result)

			return this.readOne(id)
		} catch (e) {
			return { error: e as Error }
		}
	},
	async readOne(id: string): Promise<{ result?: Rundown; error?: Error }> {
		try {
			const stmt = db.prepare(`
					SELECT *
					FROM rundowns
					WHERE id = ?
					LIMIT 1;
				`)

			const document = stmt.get() as DBRundown | undefined
			if (!document) {
				return { error: new Error(`Rundown with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId
				}
			}
		} catch (e) {
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationRundownRead>
	): Promise<{ result?: Rundown | Rundown[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		} else {
			try {
				const stmt = db.prepare(`
							SELECT *
							FROM rundowns
						`)

				const documents = stmt.all() as unknown as DBRundown[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id,
						playlistId: d.playlistId
					}))
				}
			} catch (e) {
				return { error: e as Error }
			}
		}
	},
	async update(payload: MutationRundownUpdate): Promise<{ result?: Rundown; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE rundowns
				SET playlistId = ?, document = (SELECT json_patch(rundowns.document, json(?)) FROM rundowns WHERE id = ?)
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
	async delete(payload: MutationRundownDelete): Promise<{ error?: Error }> {
		try {
			const stmt = db.prepare(`
				BEGIN TRANSACTION;
				DELETE FROM rundowns
				WHERE id = ?;
				DELETE FROM segments
				WHERE rundownId = ?;
				DELETE FROM parts
				WHERE rundownId = ?;
				DELETE FROM pieces
				WHERE rundownId = ?;
				COMMIT;
			`)

			stmt.run(payload.id, payload.id, payload.id, payload.id)
			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
}

export async function init(window: BrowserWindow): Promise<void> {
	ipcMain.handle('rundowns', async (_, operation: IpcOperation) => {
		if (operation.type === IpcOperationType.Create) {
			const { result, error } = await mutations.create(operation.payload)
			if (result && result.sync) {
				console.log('create rundown', result, error)
				try {
					await coreHandler.core.coreMethods.dataRundownCreate(await mutateRundown(result))
				} catch (error) {
					console.error(error)
					window.webContents.send('error', stringifyError(error, true))
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
				try {
					await sendRundownDiffToCore(document, result)
				} catch (error) {
					console.error(error)
					window.webContents.send('error', stringifyError(error, true))
				}
			}

			return result || error
		} else if (operation.type === IpcOperationType.Delete) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { error } = await mutations.delete(operation.payload)

			if (document && 'id' in document && !error && document.sync) {
				try {
					await coreHandler.core.coreMethods.dataRundownDelete(document.id)
				} catch (error) {
					console.error(error)
					window.webContents.send('error', stringifyError(error, true))
				}
			}

			return error || true
		}
	})
}
