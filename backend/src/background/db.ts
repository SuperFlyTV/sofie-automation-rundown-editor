import path from 'path'
import fs from 'fs'
import sqlite from 'node:sqlite'
import { defaultRundownManifest } from './manifest'
import { PayloadManifest, TypeManifestEntity } from './interfaces'
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
						SELECT
								id,
								json_set(document, '$.entityType', 'piece') AS document,
								'piece'
						FROM pieceTypeManifests;
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

	// migrate rundown metaData into payload

	const rundowns = db.prepare(`SELECT id, document FROM rundowns`).all() as Array<{
		id: string
		document: string
	}>

	const updateRundownStmt = db.prepare(`
		UPDATE rundowns
		SET document = ?
		WHERE id = ?
	`)

	for (const rundown of rundowns) {
		let parsed: any

		try {
			parsed = JSON.parse(rundown.document)
		} catch (e) {
			console.error(`Invalid JSON in rundown ${rundown.id}`, e)
			process.exit(1)
		}

		// Skip if already migrated
		if ('payload' in parsed) continue

		const migrated = {
			...parsed,
			payload: parsed.metaData ?? {}
		}

		delete migrated.metaData

		updateRundownStmt.run(JSON.stringify(migrated), rundown.id)
	}

	// migrate partTypes and rundownMetadataManifests into typeManifests
	const settingsRow = db.prepare(`SELECT document FROM settings WHERE id = 'settings'`).get() as
		| { document: string }
		| undefined
	console.log(settingsRow)
	if (settingsRow) {
		const oldSettings = JSON.parse(settingsRow.document)

		const settings = oldSettings

		const partTypes: string[] | undefined = settings.partTypes
		const rundownMetadataManifests: PayloadManifest[] | undefined = settings.rundownMetadata

		if (Array.isArray(partTypes) && partTypes.length > 0) {
			console.log('Migrating partTypes into typeManifests (preserving IDs)...')

			const insertStmt = db.prepare(`
			INSERT OR IGNORE INTO typeManifests (id, document, entityType)
			VALUES (?, json(?), 'part')
		`)

			for (const partName of partTypes) {
				const manifest = {
					id: partName,
					externalId: 'parts',
					entityType: TypeManifestEntity.Part,
					name: partName,
					shortName: partName.slice(0, 3).toUpperCase(),
					colour: '#666666',
					payload: []
				}

				insertStmt.run(partName, JSON.stringify(manifest))
			}

			// Remove legacy properties
			delete settings.partTypes

			db.prepare(
				`
				UPDATE settings
				SET document = json(?)
				WHERE id = 'settings'
			`
			).run(JSON.stringify(settings))

			console.log('Part type migration completed successfully.')
		}
		if (rundownMetadataManifests) {
			console.log("Migrating rundownMetadataManifests into default 'rundown' typeManifest")

			const insertStmt = db.prepare(`
			INSERT OR IGNORE INTO typeManifests (id, document, entityType)
			VALUES (?, json(?), 'rundown')
		`)

			const manifest = {
				id: 'rundown',
				entityType: TypeManifestEntity.Rundown,
				name: 'Rundown',
				shortName: 'RND',
				colour: '#666666',
				payload: rundownMetadataManifests
			}

			insertStmt.run('rundown', JSON.stringify(manifest))
			// Remove legacy property
			delete settings.rundownMetadata

			db.prepare(
				`
					UPDATE settings
					SET document = json(?)
					WHERE id = 'settings'
				`
			).run(JSON.stringify(settings))

			console.log('Rundown Metadata migration completed successfully.')
		}
	}

	// migrate part.payload.type into part.partType
	db.exec(`
	UPDATE parts
	SET document = json_set(
		json_remove(document, '$.payload.type'),
		'$.partType',
		json_extract(document, '$.payload.type')
	)
	WHERE
		json_extract(document, '$.payload.type') IS NOT NULL
		AND json_extract(document, '$.partType') IS NULL;
`)
	const parTypeMigrationLeftovers = db
		.prepare(
			`
	SELECT id
	FROM parts
	WHERE json_extract(document, '$.payload.type') IS NOT NULL
`
		)
		.all()

	if (parTypeMigrationLeftovers.length > 0) {
		throw new Error('Migration incomplete: payload.type still exists')
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
