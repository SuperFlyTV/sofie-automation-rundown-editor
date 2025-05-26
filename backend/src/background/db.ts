import sqlite3 from 'sqlite3'
import path from 'path'
import { app, dialog } from 'electron'
import isDev from 'electron-is-dev'

export interface InsertResolution {
	result: number | undefined
	error: Error | undefined
}

export interface UpdateResolution {
	result: boolean | undefined
	error: Error | undefined
}

const dbFile = isDev ? path.join(process.cwd(), 'data.db') : app.getPath('userData') + '/data.db'
console.log('Database location:', dbFile)

let db: sqlite3.Database

try {
	db = new sqlite3.Database(dbFile)

	db.on('error', (error) => {
		dialog.showErrorBox(
			'Fatal db error',
			`An error occurred with the database file at ${dbFile}.\n\nError: ${
				error instanceof Error ? error.message : String(error)
			}`
		)
		process.exit(1)
	})

	db.serialize(() => {
		db.run(`
            CREATE TABLE IF NOT EXISTS settings (
                id string PRIMARY KEY,
                document JSON NOT NULL
            );
        `)

		db.run(`
            CREATE TABLE IF NOT EXISTS playlists (
                id string PRIMARY KEY,
                document JSON NOT NULL
            );
        `)

		db.run(`
            CREATE TABLE IF NOT EXISTS rundowns (
                id TEXT PRIMARY KEY,
                playlistId TEXT,
                document TEXT NOT NULL,
                FOREIGN KEY (playlistId) REFERENCES playlists(id)
            );
        `)

		db.run(`
            CREATE TABLE IF NOT EXISTS segments (
                id TEXT PRIMARY KEY,
                playlistId TEXT,
                rundownId TEXT NOT NULL,
                document TEXT NOT NULL,
                FOREIGN KEY (playlistId) REFERENCES playlists(id),
                FOREIGN KEY (rundownId) REFERENCES rundowns(id)
            );
        `)

		db.run(`
            CREATE TABLE IF NOT EXISTS parts (
                id TEXT PRIMARY KEY,
                playlistId TEXT,
                rundownId TEXT NOT NULL,
                segmentId TEXT NOT NULL,
                document TEXT NOT NULL,
                FOREIGN KEY (playlistId) REFERENCES playlists(id),
                FOREIGN KEY (rundownId) REFERENCES rundowns(id),
                FOREIGN KEY (segmentId) REFERENCES segments(id)
            );
        `)

		db.run(`
            CREATE TABLE IF NOT EXISTS pieces (
                id TEXT PRIMARY KEY,
                playlistId TEXT,
                segmentId TEXT NOT NULL,
                rundownId TEXT NOT NULL,
                partId TEXT NOT NULL,
                document TEXT NOT NULL,
                FOREIGN KEY (playlistId) REFERENCES playlists(id),
                FOREIGN KEY (rundownId) REFERENCES rundowns(id),
                FOREIGN KEY (segmentId) REFERENCES segments(id)
                FOREIGN KEY (partId) REFERENCES parts(id)
            );
        `)

		db.run(`
            CREATE TABLE IF NOT EXISTS pieceTypeManifests (
                id string PRIMARY KEY,
                document JSON NOT NULL
            );
        `)
	})
} catch (error) {
	dialog.showErrorBox(
		'Unable to open database',
		`An error occurred while trying to open the database file at ${dbFile}.\n\nError: ${
			error instanceof Error ? error.message : String(error)
		}`
	)
	process.exit(1)
}

export { db }
