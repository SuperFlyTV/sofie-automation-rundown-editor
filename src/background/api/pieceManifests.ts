import { ipcMain } from 'electron'
import {
	DBPieceTypeManifest,
	IpcOperation,
	IpcOperationType,
	MutationPieceManifestCreate,
	MutationPieceManifestDelete,
	MutationPieceManifestRead,
	MutationPieceManifestUpdate,
	PieceTypeManifest
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { RunResult } from 'sqlite3'

export const mutations = {
	async create(
		payload: MutationPieceManifestCreate
	): Promise<{ result?: PieceTypeManifest; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationPieceManifestCreate> = {
			...payload
		}
		delete document.id

		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			INSERT INTO pieceTypeManifests (id,document)
			VALUES (?,json(?));
		`,
				[id, JSON.stringify(document)],
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
			const { result: returnResult, error } = await mutations.read({ id })

			if (returnResult && !Array.isArray(returnResult)) {
				return { result: returnResult }
			}
			if (error) {
				return { error }
			}

			return { error: new Error('Unknonw error') }
		}

		return { error: error as Error }
	},
	async read(
		payload: Partial<MutationPieceManifestRead>
	): Promise<{ result?: PieceTypeManifest | PieceTypeManifest[]; error?: Error }> {
		if (payload && payload.id) {
			const document = await new Promise<DBPieceTypeManifest>((resolve, reject) =>
				db.get(
					`
				SELECT *
				FROM pieceTypeManifests
				WHERE id = ?
				LIMIT 1;
			`,
					[payload.id],
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id
				}
			}
		} else {
			const documents = await new Promise<DBPieceTypeManifest[]>((resolve, reject) =>
				db.all(
					`
				SELECT *
				FROM pieceTypeManifests
			`,
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return {
				result: documents.map((d) => ({
					...JSON.parse(d.document),
					id: d.id
				}))
			}
		}
	},
	async update(
		payload: MutationPieceManifestUpdate
	): Promise<{ result?: PieceTypeManifest; error?: Error }> {
		const update = {
			...payload.update,
			id: null
		}
		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			UPDATE pieceTypeManifests
			SET id = ?, document = (SELECT json_patch(pieceTypeManifests.document, json(?)) FROM pieceTypeManifests WHERE id = ?)
			WHERE id = "${payload.id}";
		`,
				[payload.update.id, JSON.stringify(update), payload.id],
				(e) =>
					e ? resolve({ result: undefined, error: e }) : resolve({ result: true, error: undefined })
			)
		)

		if (result) {
			const { result: returnResult, error } = await mutations.read({
				id: payload.update.id
			})

			if (returnResult && !Array.isArray(returnResult)) {
				return { result: returnResult }
			}
			if (error) {
				return { error }
			}

			return { error: new Error('Unknown error') }
		}

		return error
	},
	async delete(payload: MutationPieceManifestDelete): Promise<{ error?: Error }> {
		return new Promise((resolve) =>
			db.run(
				`
			DELETE FROM pieceTypeManifests
			WHERE id = "${payload.id}";
		`,
				(r: RunResult, e: Error | null) =>
					e ? resolve({ error: e }) : resolve({ error: undefined })
			)
		)
	}
}

ipcMain.handle('pieceTypeManifests', async (_, operation: IpcOperation) => {
	if (operation.type === IpcOperationType.Create) {
		const { result, error } = await mutations.create(operation.payload)

		return result || error
	} else if (operation.type === IpcOperationType.Read) {
		const { result, error } = await mutations.read(operation.payload)

		return result || error
	} else if (operation.type === IpcOperationType.Update) {
		const { result, error } = await mutations.update(operation.payload)

		return result || error
	} else if (operation.type === IpcOperationType.Delete) {
		const { error } = await mutations.delete(operation.payload)

		return error || true
	}
})
