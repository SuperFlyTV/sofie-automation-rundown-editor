import { ipcMain } from 'electron'
import { DBPlaylist, IpcOperation, IpcOperationType, Playlist } from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'

async function readOne(id: string): Promise<{ result?: Playlist; error?: Error }> {
	try {
		const stmt = db.prepare(`
			SELECT *
			FROM playlists
			WHERE id = ?
			LIMIT 1;
		`)

		const document = stmt.get() as DBPlaylist | undefined
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
		return { error: e as Error }
	}
}

ipcMain.handle('playlists', async (_, operation: IpcOperation) => {
	if (operation.type === IpcOperationType.Create) {
		const id = uuid()
		const document = {
			...operation.payload
		}
		delete document.id

		try {
			const stmt = db.prepare(`
				INSERT INTO playlists (id,document)
				VALUES (?,json(?));
			`)

			const result = stmt.run(id, JSON.stringify(document))
			if (result.changes === 0) throw new Error('No rows were inserted')

			return readOne(id)
		} catch (e) {
			return { error: e as Error }
		}
	} else if (operation.type === IpcOperationType.Read) {
		if (operation.payload && operation.payload.id) {
			return readOne(operation.payload.id)
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
				return { error: e as Error }
			}
		}
	} else if (operation.type === IpcOperationType.Update) {
		const update = {
			...operation.payload,
			id: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE playlists
				SET document = (SELECT json_patch(playlists.document, json(?)) FROM playlists WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(JSON.stringify(update), operation.payload.id, operation.payload.id)
			if (result.changes === 0) {
				throw new Error('No rows were updated')
			}

			return readOne(operation.payload.id)
		} catch (e) {
			return { error: e as Error }
		}
	} else if (operation.type === IpcOperationType.Delete) {
		try {
			const stmt = db.prepare(`
				DELETE FROM playlists
				WHERE id = ?;
			`)

			stmt.run(operation.payload.id)
			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
})
