import { ipcMain } from 'electron'
import { DBPlaylist, IpcOperation, IpcOperationType } from '../interfaces'
import { db, InsertResolution } from '../db'
import { v4 as uuid } from 'uuid'
import { RunResult } from 'sqlite3'

ipcMain.handle('playlists', async (_, operation: IpcOperation) => {
	if (operation.type === IpcOperationType.Create) {
		const id = uuid()
		const document = {
			...operation.payload
		}
		delete document.id

		const { result, error } = await new Promise<InsertResolution>((resolve) =>
			db.run(
				`
			INSERT INTO playlists (id,document)
			VALUES (?,json(?));
		`,
				[id, JSON.stringify(document)],
				function (e: Error | null) {
					if (e) {
						resolve({ result: undefined, error: e })
					} else if (this) {
						resolve({ result: this.lastID, error: undefined })
					}
				}
			)
		)

		if (result) {
			const document = await new Promise<DBPlaylist>((resolve, reject) =>
				db.get<DBPlaylist>(
					`
				SELECT *
				FROM playlists
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
				...JSON.parse(document.document),
				id: document.id
			}
		}

		return error
	} else if (operation.type === IpcOperationType.Read) {
		if (operation.payload && operation.payload.id) {
			const document = await new Promise<DBPlaylist>((resolve, reject) =>
				db.get<DBPlaylist>(
					`
				SELECT *
				FROM playlists
				WHERE id = ?
				LIMIT 1;
			`,
					[operation.payload.id],
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return {
				...JSON.parse(document.document),
				id: document.id
			}
		} else {
			const documents = await new Promise<DBPlaylist[]>((resolve, reject) =>
				db.all<DBPlaylist>(
					`
				SELECT *
				FROM playlists
			`,
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return documents.map((d) => ({
				...JSON.parse(d.document),
				id: d.id
			}))
		}
	} else if (operation.type === IpcOperationType.Update) {
		const update = {
			...operation.payload,
			id: null
		}
		const result = await new Promise((resolve, reject) =>
			db.run(
				`
			UPDATE playlists
			SET document = (SELECT json_patch(playlists.document, json(?)) FROM playlists WHERE id = ?)
			WHERE id = "${operation.payload.id}";
		`,
				[JSON.stringify(update), operation.payload.id],
				(e) => (e ? reject(e) : resolve(true))
			)
		)

		if (result) {
			const document = await new Promise<DBPlaylist>((resolve, reject) =>
				db.get<DBPlaylist>(
					`
				SELECT *
				FROM playlists
				WHERE id = ?
				LIMIT 1;
			`,
					[operation.payload.id],
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
				...JSON.parse(document.document),
				id: operation.payload.id
			}
		}

		return
	} else if (operation.type === IpcOperationType.Delete) {
		return new Promise((resolve, reject) =>
			db.run(
				`
			DELETE FROM playlists
			WHERE id = "${operation.payload.id}";
		`,
				(r: RunResult, e: Error | null) => (e ? reject(e) : resolve(r))
			)
		)
	}
})
