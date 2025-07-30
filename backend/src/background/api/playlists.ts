import {
	DBPlaylist,
	IpcOperationType,
	MutationPlaylistCreate,
	MutationPlaylistDelete,
	MutationPlaylistRead,
	MutationPlaylistUpdate,
	Playlist
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { Server, Socket } from 'socket.io'

export const mutations = {
	async create(playlist: MutationPlaylistCreate) {
		const id = uuid()
		const document = {
			...playlist
		}
		delete document.id

		try {
			const stmt = db.prepare(`
				INSERT INTO playlists (id,document)
				VALUES (?,json(?));
			`)

			const result = stmt.run(id, JSON.stringify(document))
			if (result.changes === 0) throw new Error('No rows were inserted')

			return mutations.readOne(id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async readOne(id: string): Promise<{ result?: Playlist; error?: Error }> {
		try {
			const stmt = db.prepare(`
			SELECT *
			FROM playlists
			WHERE id = ?
			LIMIT 1;
		`)

			const document = stmt.get(id) as DBPlaylist | undefined
			if (!document) {
				return { error: new Error(`Playlist with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id
				}
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async read(
		payload: MutationPlaylistRead
	): Promise<{ result?: Playlist | Playlist[]; error?: Error }> {
		if (payload && payload.id) {
			return mutations.readOne(payload.id)
		} else {
			try {
				const stmt = db.prepare(`
					SELECT *
					FROM playlists
				`)

				const documents = stmt.all() as unknown as DBPlaylist[]

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
	async update(payload: MutationPlaylistUpdate): Promise<{ result?: Playlist; error?: Error }> {
		const update = {
			...payload,
			id: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE playlists
				SET document = (SELECT json_patch(playlists.document, json(?)) FROM playlists WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(JSON.stringify(update), payload.id, payload.id)
			if (result.changes === 0) {
				throw new Error('No rows were updated')
			}

			return mutations.readOne(payload.id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async delete(payload: MutationPlaylistDelete): Promise<{ result?: true; error?: Error }> {
		try {
			const stmt = db.prepare(`
				DELETE FROM playlists
				WHERE id = ?;
			`)

			stmt.run(payload.id)
			return { result: true }
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	}
}

export function registerPlaylistsHandlers(socket: Socket, _io: Server) {
	socket.on('playlists', async (action, payload, callback) => {
		console.log(action)
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
					console.log(result)
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
					const { result, error } = await mutations.delete(payload)
					callback(result || error)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}
