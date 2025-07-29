import {
	DBPieceTypeManifest,
	IpcOperation,
	IpcOperationType,
	MutationPieceTypeManifestCreate,
	MutationPieceTypeManifestDelete,
	MutationPieceTypeManifestRead,
	MutationPieceTypeManifestUpdate,
	PieceTypeManifest
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { Server, Socket } from 'socket.io'

export const mutations = {
	async create(
		payload: MutationPieceTypeManifestCreate
	): Promise<{ result?: PieceTypeManifest; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationPieceTypeManifestCreate> = {
			...payload
		}
		delete document.id

		try {
			const stmt = db.prepare(`
				INSERT INTO pieceTypeManifests (id,document)
				VALUES (?,json(?));
			`)

			const result = stmt.run(id, JSON.stringify(document))
			if (result.changes === 0) throw new Error('No rows were inserted')

			return this.readOne(id)
		} catch (e) {
			return { error: e as Error }
		}
	},
	async readOne(id: string): Promise<{ result?: PieceTypeManifest; error?: Error }> {
		try {
			const stmt = db.prepare(`
				SELECT *
				FROM pieceTypeManifests
				WHERE id = ?
				LIMIT 1;
			`)

			const document = stmt.get(id) as DBPieceTypeManifest | undefined
			if (!document) {
				return { error: new Error(`PieceTypeManifest with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id
				}
			}
		} catch (e) {
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationPieceTypeManifestRead>
	): Promise<{ result?: PieceTypeManifest | PieceTypeManifest[] | undefined; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		} else {
			try {
				const stmt = db.prepare(`
					SELECT *
					FROM pieceTypeManifests
				`)

				const documents = stmt.all() as unknown as DBPieceTypeManifest[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id
					}))
				}
			} catch (e) {
				return { error: e as Error }
			}
		}
	},
	async update(
		payload: MutationPieceTypeManifestUpdate
	): Promise<{ result?: PieceTypeManifest; error?: Error }> {
		const update = {
			...payload.update,
			id: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE pieceTypeManifests
				SET id = ?, document = (SELECT json_patch(pieceTypeManifests.document, json(?)) FROM pieceTypeManifests WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(payload.update.id, JSON.stringify(update), payload.id, payload.id)
			if (result.changes === 0) {
				throw new Error('No rows were updated')
			}

			return this.readOne(payload.update.id)
		} catch (e) {
			return { error: e as Error }
		}
	},
	async delete(payload: MutationPieceTypeManifestDelete): Promise<{ error?: Error }> {
		try {
			const stmt = db.prepare(`
				DELETE FROM pieceTypeManifests
				WHERE id = ?;
			`)

			stmt.run(payload.id)
			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
}

export function registerPieceManifestsHandlers(socket: Socket, _io: Server) {
	socket.on('pieceTypeManifests', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await mutations.create(payload)
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
					const { result, error } = await mutations.update(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Delete:
				{
					const { error } = await mutations.delete(payload)
					callback(error || true)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}
