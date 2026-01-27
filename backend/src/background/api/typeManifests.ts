import {
	DBTypeManifest,
	IpcOperationType,
	MutationTypeManifestCreate,
	MutationTypeManifestRead,
	MutationTypeManifestUpdate,
	TypeManifest
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { Server, Socket } from 'socket.io'

export const mutations = {
	async create(
		payload: MutationTypeManifestCreate
	): Promise<{ result?: TypeManifest; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationTypeManifestCreate> = { ...payload, id }

		try {
			const stmt = db.prepare(`
				INSERT INTO typeManifests (id, document, entityType)
				VALUES (?, json(?), ?);
			`)

			const result = stmt.run(id, JSON.stringify(document), payload.entityType)
			if (result.changes === 0) throw new Error('No rows were inserted')

			return this.readOne(id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},

	async readOne(id: string): Promise<{ result?: TypeManifest; error?: Error }> {
		try {
			const stmt = db.prepare(`
				SELECT *
				FROM typeManifests
				WHERE id = ?
				LIMIT 1;
			`)

			const document = stmt.get(id) as DBTypeManifest | undefined
			if (!document) {
				return { error: new Error(`TypeManifest with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					entityType: document.entityType
				}
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},

	async read(
		payload: Partial<MutationTypeManifestRead>
	): Promise<{ result?: TypeManifest | TypeManifest[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		} else if (payload && payload.entityType) {
			try {
				const stmt = db.prepare(`
					SELECT *
					FROM typeManifests
					WHERE entityType = ?
				`)

				const documents = stmt.all(payload.entityType) as unknown as DBTypeManifest[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id
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
					FROM typeManifests
				`)

				const documents = stmt.all() as unknown as DBTypeManifest[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id
					}))
				}
			} catch (e) {
				console.error(e)
				return { error: e as Error }
			}
		}
	},

	async update(
		payload: MutationTypeManifestUpdate
	): Promise<{ result?: TypeManifest; error?: Error }> {
		const update = { ...payload.update }

		try {
			const stmt = db.prepare(`
			UPDATE typeManifests
			SET document = json_patch(document, json(?))
			WHERE id = ?;
		`)

			const result = stmt.run(JSON.stringify(update), payload.id)
			if (result.changes === 0) throw new Error('No rows were updated')

			return this.readOne(payload.update.id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},

	async delete(payload: Pick<MutationTypeManifestRead, 'id'>): Promise<{ error?: Error }> {
		try {
			const stmt = db.prepare(`
				DELETE FROM typeManifests
				WHERE id = ?;
			`)

			stmt.run(payload.id)
			return {}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	}
}

export function registerTypeManifestsHandlers(socket: Socket, _io: Server) {
	socket.on('typeManifests', async (action, payload, callback) => {
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
