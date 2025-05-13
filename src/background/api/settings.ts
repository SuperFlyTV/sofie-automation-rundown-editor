import { ipcMain } from 'electron'
import {
	DBSettings,
	IpcOperation,
	IpcOperationType,
	ApplicationSettings,
	MutationApplicationSettingsCreate,
	MutationApplicationSettingsUpdate
} from '../interfaces'
import { db, InsertResolution, UpdateResolution } from '../db'
import { PARTS_MANIFEST, PIECES_MANIFEST } from '../manifest'

export const mutations = {
	async create(
		payload: MutationApplicationSettingsCreate
	): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const document = {
			...payload
		}

		const { result, error } = await new Promise<InsertResolution>((resolve) =>
			db.run(
				`
			INSERT INTO settings (id,document)
			VALUES ("settings",json(?));
		`,
				[JSON.stringify(document)],
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
			console.log(result)
			const { result: returnResult, error } = await mutations.read()

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
	async read(): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const { result, error } = await new Promise<{ error?: Error; result?: DBSettings }>((resolve) =>
			db.get(
				`
			SELECT *
			FROM settings
			WHERE id = "settings"
			LIMIT 1;
		`,
				(error, result) => resolve({ error: error || undefined, result })
			)
		)

		if (result) {
			return {
				result: {
					...JSON.parse(result.document)
				}
			}
		} else {
			return { error }
		}
	},
	async update(
		payload: MutationApplicationSettingsUpdate
	): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const update = {
			...payload
		}
		const { result, error } = await new Promise<UpdateResolution>((resolve) =>
			db.run(
				`
			UPDATE settings
			SET document = (SELECT json_patch(settings.document, json(?)) FROM settings WHERE id = "settings")
			WHERE id = "settings";
		`,
				[JSON.stringify(update)],
				(e) =>
					e ? resolve({ result: undefined, error: e }) : resolve({ result: true, error: undefined })
			)
		)

		if (result) {
			const { result: returnResult, error } = await mutations.read()

			if (returnResult && !Array.isArray(returnResult)) {
				return { result: returnResult }
			}
			if (error) {
				return { error }
			}

			return { error: new Error('Unknown error') }
		}

		return { error }
	},
	async reset(): Promise<{ result?: ApplicationSettings; error?: Error }> {
		// Reset to defaults from manifest
		await initializeDefaults()

		// Return the current settings
		return await this.read()
	}
}

ipcMain.handle('settings', async (_, operation: IpcOperation) => {
	console.log('Settings operation:', operation)
	if (operation.type === IpcOperationType.Create) {
		const { result, error } = await mutations.create(operation.payload)

		return result || error
	} else if (operation.type === IpcOperationType.Read) {
		const { result, error } = await mutations.read()

		return result || error
	} else if (operation.type === IpcOperationType.Update) {
		const { result, error } = await mutations.update(operation.payload)

		return result || error
	} else {
		throw new Error('Unknown operation type')
	}
})

const DEFAULT_SETTINGS: ApplicationSettings = {
	partTypes: PARTS_MANIFEST,
	rundownMetadata: [],
	coreUrl: '127.0.0.1',
	corePort: 3000
}

export async function initializeDefaults() {
	const settings: DBSettings | undefined = await new Promise((resolve) => {
		db.get('SELECT * FROM settings WHERE id = ? LIMIT 1', ['application'], (err, row) => {
			resolve(row as DBSettings | undefined)
		})
	})

	if (!settings) {
		mutations.read().then(({ result }) => {
			if (!result) {
				mutations.create(DEFAULT_SETTINGS)
			}
		})
	
		// If no settings exist, create them
		await new Promise<void>((resolve, reject) => {
			db.run(
				'INSERT INTO settings (id, document) VALUES (?, ?)',
				[
					'application',
					JSON.stringify({
						partTypes: PARTS_MANIFEST,
						rundownMetadata: []
					})
				],
				(err) => {
					if (err) reject(err)
					else resolve()
				}
			)
		})
	} else {
		// If settings already exist, update them to defaults
		let existingMetadata: unknown[] = []
		try {
			const parsedDoc = JSON.parse(settings.document)
			existingMetadata = parsedDoc.rundownMetadata || []
		} catch (e) {
			console.error('Error parsing settings document:', e)
		}

		await new Promise<void>((resolve, reject) => {
			db.run(
				'UPDATE settings SET document = ? WHERE id = ?',
				[
					JSON.stringify({
						partTypes: PARTS_MANIFEST,
						rundownMetadata: existingMetadata
					}),
					'application'
				],
				(err) => {
					if (err) reject(err)
					else resolve()
				}
			)
		})
	}

	// Reset piece type manifests
	// First, get all existing manifests
	const manifests: Array<{ id: string }> = await new Promise((resolve) => {
		db.all('SELECT id FROM piece_type_manifests', [], (err, rows) => {
			resolve((rows as Array<{ id: string }>) || [])
		})
	})

	// Delete them all
	for (const manifest of manifests) {
		await new Promise<void>((resolve, reject) => {
			db.run('DELETE FROM piece_type_manifests WHERE id = ?', [manifest.id], (err) => {
				if (err) reject(err)
				else resolve()
			})
		})
	}

	// Insert the defaults
	for (const pieceType of PIECES_MANIFEST) {
		await new Promise<void>((resolve, reject) => {
			db.run(
				'INSERT INTO piece_type_manifests (id, document) VALUES (?, ?)',
				[pieceType.id, JSON.stringify(pieceType)],
				(err) => {
					if (err) reject(err)
					else resolve()
				}
			)
		})
	}
}
