import path from 'path'
import fs from 'fs'
import sqlite from 'node:sqlite'
import { defaultRundownManifest } from './manifest'
// In dev, store the database in the current working directory
// In production, store the database in the user data directory
const dbFile = path.join(process.cwd(), '../data/data.db')
const dbDir = path.dirname(dbFile)

// Ensure the database directory exists
if (!fs.existsSync(dbDir)) {
	try {
		fs.mkdirSync(dbDir)
	} catch (err) {
		console.error('Unable to create database directory:', dbDir, err)
		process.exit(1)
	}
}
console.log('Database location:', dbFile)

let db: sqlite.DatabaseSync

try {
	db = new sqlite.DatabaseSync(dbFile)

	// db.on('error', (error) => {
	// 	dialog.showErrorBox(
	// 		'Fatal db error',
	// 		`An error occurred with the database file at ${dbFile}.\n\nError: ${
	// 			error instanceof Error ? error.message : String(error)
	// 		}`
	// 	)
	// 	process.exit(1)
	// })

	db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            id string PRIMARY KEY,
            document JSON NOT NULL
        );
    `)

	db.exec(`
        CREATE TABLE IF NOT EXISTS playlists (
            id string PRIMARY KEY,
            document JSON NOT NULL
        );
    `)

	db.exec(`
        CREATE TABLE IF NOT EXISTS rundowns (
            id TEXT PRIMARY KEY,
            playlistId TEXT,
            document TEXT NOT NULL,
            FOREIGN KEY (playlistId) REFERENCES playlists(id)
        );
    `)

	db.exec(`
        CREATE TABLE IF NOT EXISTS segments (
            id TEXT PRIMARY KEY,
            playlistId TEXT,
            rundownId TEXT NOT NULL,
            document TEXT NOT NULL,
            FOREIGN KEY (playlistId) REFERENCES playlists(id),
            FOREIGN KEY (rundownId) REFERENCES rundowns(id)
        );
    `)

	db.exec(`
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

	db.exec(`
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

	// Ensure the new general typeManifests table exists
	db.exec(`
    CREATE TABLE IF NOT EXISTS typeManifests (
        id TEXT PRIMARY KEY,
        document JSON NOT NULL,
        entityType TEXT NOT NULL CHECK(entityType IN ('rundown','segment','part','piece'))
    );
`)

	// Check if the old pieceTypeManifests table exists
	const tableExistsRow = db
		.prepare(
			`
    SELECT name FROM sqlite_master WHERE type='table' AND name='pieceTypeManifests';
`
		)
		.get()

	if (tableExistsRow) {
		console.log('Migrating pieceTypeManifests into typeManifests...')

		try {
			// Copy all entries to typeManifests with entityType='piece'
			const insertStmt = db.prepare(`
            INSERT INTO typeManifests (id, document, entityType)
            SELECT id, document, 'piece' FROM pieceTypeManifests
        `)
			insertStmt.run()

			// Drop old table
			db.exec(`DROP TABLE pieceTypeManifests`)
			console.log('Migration successful: pieceTypeManifests removed.')
		} catch (err) {
			console.error('Failed to migrate pieceTypeManifests:', err)
			process.exit(1)
		}
	}
} catch (error) {
	console.error(
		'Unable to open database',
		`An error occurred while trying to open the database file at ${dbFile}.\n\nError: ${
			error instanceof Error ? error.message : String(error)
		}`
	)
	process.exit(1)
}

export { db }
