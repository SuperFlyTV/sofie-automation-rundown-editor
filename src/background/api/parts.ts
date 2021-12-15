import { ipcMain } from 'electron'
import {
	DBPart,
	IpcOperation,
	IpcOperationType,
	MutationPartCreate,
	MutationPartDelete,
	MutationPartRead,
	MutationPartUpdate,
	Part
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { PeripheralDeviceAPI } from '@sofie-automation/server-core-integration'
import { getMutatedPiecesFromPart } from './pieces'
import { mutations as rundownMutations } from './rundowns'
import { mutations as segmentsMutations } from './segments'

async function mutatePart(part: Part) {
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
		coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartCreate, [
			newPart.rundownId,
			newPart.segmentId,
			await mutatePart(newPart)
		])
	} else if (!oldPart.float && newPart.float) {
		coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartDelete, [
			newPart.rundownId,
			newPart.segmentId,
			newPart.id
		])
	} else if (!oldPart.float && !newPart.float) {
		coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartUpdate, [
			newPart.rundownId,
			newPart.segmentId,
			await mutatePart(newPart)
		])
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

		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			INSERT INTO parts (id,playlistId,rundownId,segmentId,document)
			VALUES (?,?,?,?,json(?));
		`,
				[
					id,
					payload.playlistId || null,
					payload.rundownId,
					payload.segmentId,
					JSON.stringify(document)
				],
				function(e: Error | null) {
					if (e) {
						resolve({ result: undefined, error: e })
					} else if (this) {
						resolve({ result: this.lastID, error: undefined })
					}
				}
			)
		)

		if (result) {
			const document = await new Promise<DBPart>((resolve, reject) =>
				db.get(
					`
				SELECT *
				FROM parts
				WHERE id = ?
				LIMIT 1;
			`,
					[id],
					(e, r) => {
						if (e) {
							reject(e)
						} else {
							resolve(r)
						}
					}
				)
			)

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId,
					rundownId: document.rundownId,
					segmentId: document.segmentId
				}
			}
		}

		return { error }
	},
	async read(
		payload: Partial<MutationPartRead>
	): Promise<{ result?: Part | Part[]; error?: Error }> {
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

		if (payload.id) {
			query += `\nLIMIT 1`

			const { result, error } = await new Promise<{ result?: DBPart; error?: Error }>((resolve) =>
				db.get(query, args, (e, r: DBPart) =>
					e ? resolve({ error: e, result: undefined }) : resolve({ result: r, error: undefined })
				)
			)

			if (!result) {
				return { error }
			}

			return {
				result: {
					...JSON.parse(result.document),
					id: result.id,
					playlistId: result.playlistId,
					rundownId: result.rundownId,
					segmentId: result.segmentId
				}
			}
		} else {
			const { result, error } = await new Promise<{ result?: DBPart[]; error?: Error }>((resolve) =>
				db.all(query, args, (e, r: DBPart[]) =>
					e ? resolve({ error: e, result: undefined }) : resolve({ result: r, error: undefined })
				)
			)

			if (!result) {
				return { error }
			}

			return {
				result: result.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					playlistId: d.playlistId,
					rundownId: d.rundownId,
					segmentId: d.segmentId
				}))
			}
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

		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			UPDATE parts
			SET playlistId = ?, segmentId = ?, document = (SELECT json_patch(parts.document, json(?)) FROM parts WHERE id = ?)
			WHERE id = "${payload.id}";
		`,
				[payload.playlistId || null, payload.segmentId || null, JSON.stringify(update), payload.id],
				(e) =>
					e ? resolve({ error: e, result: undefined }) : resolve({ error: undefined, result: true })
			)
		)

		if (!result || error) {
			return { error }
		}

		const { result: readResult, error: readError } = await mutations.read({
			id: payload.id
		})

		if ((readResult && Array.isArray(result)) || error) {
			return { error: readError }
		}

		return { result: readResult as Part }
	},
	async delete(payload: MutationPartDelete): Promise<{ error?: Error }> {
		return new Promise((resolve) =>
			db.exec(
				`
			BEGIN TRANSACTION;
			DELETE FROM parts
			WHERE id = "${payload.id}";
			DELETE FROM pieces
			WHERE partId = "${payload.id}";
			COMMIT;
		`,
				(error: Error | null) => resolve({ error: error || undefined })
			)
		)
	}
}

ipcMain.handle('parts', async (_, operation: IpcOperation) => {
	if (operation.type === IpcOperationType.Create) {
		const { result, error } = await mutations.create(operation.payload)

		if (result && !result.float) {
			coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartCreate, [
				result.rundownId,
				result.segmentId,
				await mutatePart(result)
			])
		}

		return error || result
	} else if (operation.type === IpcOperationType.Read) {
		const { result, error } = await mutations.read(operation.payload)

		return error || result
	} else if (operation.type === IpcOperationType.Update) {
		const { result: document } = await mutations.read({ id: operation.payload.id })
		const { result, error } = await mutations.update(operation.payload)

		if (document && 'id' in document && result) {
			sendPartDiffToCore(document, result)
		}

		return error || result
	} else if (operation.type === IpcOperationType.Delete) {
		const { result: document } = await mutations.read({ id: operation.payload.id })
		const { error } = await mutations.delete(operation.payload)

		if (!error && document && !Array.isArray(document) && !document.float) {
			coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartDelete, [
				document.rundownId,
				document.segmentId,
				document.id
			])
		}

		return error || true
	}
})

export async function createAllPartsInCore(segmentId: string) {
	const { result } = await mutations.read({ segmentId })

	if (result && Array.isArray(result)) {
		const sortedParts = result.sort((a, b) => a.rank - b.rank)
		for (const s of sortedParts) {
			if (!s.float)
				await coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartCreate, [
					s.rundownId,
					s.segmentId,
					await mutatePart(s)
				])
		}
	}
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

		coreHandler.core.callMethod(PeripheralDeviceAPI.methods.dataPartUpdate, [
			result.rundownId,
			result.segmentId,
			await mutatePart(result)
		])
	}
}
