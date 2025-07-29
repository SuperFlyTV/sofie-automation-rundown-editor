import {
	DBSettings,
	IpcOperationType,
	ApplicationSettings,
	MutationApplicationSettingsCreate,
	MutationApplicationSettingsUpdate
} from '../interfaces'
import { db } from '../db'
import { PARTS_MANIFEST, PIECES_MANIFEST } from '../manifest'
import { mutations as pieceTypeManifestMutations } from './pieceManifests'
import { Server, Socket } from 'socket.io'

export const mutations = {
	async create(
		payload: MutationApplicationSettingsCreate
	): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const document = {
			...payload
		}

		try {
			const stmt = db.prepare(`
				INSERT INTO settings (id,document)
				VALUES ('settings',json(?));
			`)

			const result = stmt.run(JSON.stringify(document))
			if (result.changes === 0) throw new Error('No rows were inserted')

			console.log(result)

			return this.read()
		} catch (e) {
			return { error: e as Error }
		}
	},
	async read(): Promise<{ result?: ApplicationSettings; error?: Error }> {
		try {
			const stmt = db.prepare(`
				SELECT *
				FROM settings
				WHERE id = 'settings'
				LIMIT 1;
			`)

			const result = stmt.get() as DBSettings | undefined

			if (result) {
				return {
					result: {
						...JSON.parse(result.document)
					}
				}
			} else {
				return {}
			}
		} catch (e) {
			return { error: e as Error }
		}
	},
	async update(
		payload: MutationApplicationSettingsUpdate
	): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const update = {
			...payload
		}

		try {
			const stmt = db.prepare(`
				UPDATE settings
				SET document = (SELECT json_patch(settings.document, json(?)) FROM settings WHERE id = 'settings')
				WHERE id = 'settings';
			`)

			stmt.run(JSON.stringify(update))

			return this.read()
		} catch (e) {
			return { error: e as Error }
		}
	},
	async reset(): Promise<{ result?: ApplicationSettings; error?: Error }> {
		// Reset to defaults from manifest
		await initializeDefaults()

		// Return the current settings
		return await this.read()
	}
}

export function registerSettingsHandlers(socket: Socket, _io: Server) {
	socket.on('settings', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await mutations.create(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Read:
				{
					const { result, error } = await mutations.read()
					callback(result || error)
				}
				break
			case IpcOperationType.Update:
				{
					const { result, error } = await mutations.update(payload)
					callback(result || error)
				}
				break
			case 'reset':
				{
					const { result, error } = await mutations.reset()
					callback(result || error)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}

const DEFAULT_SETTINGS: ApplicationSettings = {
	partTypes: PARTS_MANIFEST,
	rundownMetadata: [],
	coreUrl: '127.0.0.1',
	corePort: 3000
}

export async function initializeDefaults() {
	mutations.read().then(({ result }) => {
		if (!result) {
			mutations.create(DEFAULT_SETTINGS)
		}
	})

	// Reset piece type manifests using the pieceManifests module
	// First, get all existing manifests
	const existingManifests = await pieceTypeManifestMutations.read({})

	// Delete them all
	if (existingManifests && Array.isArray(existingManifests)) {
		for (const manifest of existingManifests) {
			await pieceTypeManifestMutations.delete({ id: manifest.id })
		}
	}

	// Insert the defaults
	for (const pieceType of PIECES_MANIFEST) {
		await pieceTypeManifestMutations.create(pieceType)
	}
}
