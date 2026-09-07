import {
	DBSettings,
	IpcOperationType,
	ApplicationSettings,
	MutationApplicationSettingsCreate,
	MutationApplicationSettingsUpdate,
	TypeManifestEntity,
	TypeManifest,
	ManifestFieldType,
	PayloadManifest
} from '../interfaces'
import { db } from '../db'
import { defaultRundownManifest, TYPE_MANIFESTS } from '../manifest'
import { mutations as typeManifestMutations } from './typeManifests'
import { Server, Socket } from 'socket.io'
import { ografHandler } from '../ografHandler'
import { getDefaultDataFromSchema } from '../lib/ograf-default-data'
import * as OGraf from 'ograf'

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

			return this.read()
		} catch (e) {
			console.error(e)
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
			console.error(e)
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
			console.error(e)
			return { error: e as Error }
		}
	},
	async reset(): Promise<{ result?: ApplicationSettings; error?: Error }> {
		// Reset to defaults from manifest
		await initializeDefaults(true)

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
			case 'reloadOGrafGraphics':
				{
					const ografs = await ografHandler.loadGraphics(payload)

					console.log(`Loaded ${ografs.length} graphics from OGraf server`)

					const readPieceManifests = await typeManifestMutations.read({
						entityType: TypeManifestEntity.Piece
					})

					let pieceManifests: TypeManifest[] = []
					if (readPieceManifests && Array.isArray(readPieceManifests.result))
						pieceManifests = readPieceManifests.result

					for (const ograf of ografs) {
						const typeManifest = getOGrafManifest(ograf.id, ograf.manifest)

						const existingPieceManifest = pieceManifests.find(
							(pieceManifest) => pieceManifest.id === typeManifest.id
						)
						if (!existingPieceManifest) {
							console.log(`Creating new piece manifest for OGraf graphic ${typeManifest.id}`)
							await typeManifestMutations.create(typeManifest)
						} else {
							console.log(`Updating existing piece manifest for OGraf graphic ${typeManifest.id}`)
							await typeManifestMutations.update({
								id: typeManifest.id,
								update: typeManifest
							})
						}
					}

					callback(null)
					// .then(callback).catch(callback)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}

const DEFAULT_SETTINGS: ApplicationSettings = {
	coreUrl: '127.0.0.1',
	corePort: 3000
}

export async function initializeDefaults(force: boolean = false): Promise<void> {
	if (force) {
		// Reset type manifests using the typeManifests module
		// First, get all existing manifests
		const existingManifests = await typeManifestMutations.read({})
		if (existingManifests.result && Array.isArray(existingManifests.result)) {
			// Delete them all
			for (const manifest of existingManifests.result) {
				await typeManifestMutations.delete({ id: manifest.id })
			}
		}
	}
	// Insert the defaults
	{
		const existingSettings = await mutations.read()
		if (!existingSettings.result) {
			await mutations.create(DEFAULT_SETTINGS)
		} else if (force) {
			await mutations.update(DEFAULT_SETTINGS)
		}
	}
	{
		const RUNDOWN_ID = 'rundown'
		const existing = await typeManifestMutations.readOne(RUNDOWN_ID)
		if (!existing.result) {
			await typeManifestMutations.create({
				id: RUNDOWN_ID,
				entityType: TypeManifestEntity.Rundown,
				// Only store the payload array for now; keep other fields in settings
				payload: defaultRundownManifest.payload
			})
		}
	}

	for (const typeManifest of TYPE_MANIFESTS) {
		const existing = await typeManifestMutations.readOne(typeManifest.id)
		if (!existing.result) {
			await typeManifestMutations.create(typeManifest)
		}
	}
}

function getOGrafManifest(id: string, manifest: OGraf.GraphicsManifest): TypeManifest {
	return {
		id: `ograf-${id}`,
		colour: '#5555ff',
		entityType: TypeManifestEntity.Piece,
		name: `${manifest.name}`,
		shortName: 'OGraf',
		includeTypeInName: true,

		payload: [
			{
				id: 'ograf-id',
				label: 'OGraf Id',
				type: ManifestFieldType.Const,
				defaultValue: id
			},
			{
				id: 'type',
				label: 'Type of Graphics',
				type: ManifestFieldType.Enum,
				enumValues: [
					{ label: 'Full Screen', value: 'full-screen' },
					{ label: 'Overlay 1', value: 'overlay1' },
					{ label: 'Overlay 2', value: 'overlay2' },
					{ label: 'Overlay 3', value: 'overlay3' },
					{ label: 'Overlay 4', value: 'overlay4' },
					{ label: 'Studio Screen 1', value: 'studio1' },
					{ label: 'Studio Screen 2', value: 'studio2' },
					{ label: 'Studio Screen 3', value: 'studio3' }
				],
				defaultValue: 'overlay1'
			},
			{
				id: 'ograf-data',
				label: 'OGraf Data',
				type: ManifestFieldType.OGrafForm,
				ografManifest: manifest,
				defaultValue: manifest.schema ? getDefaultDataFromSchema(manifest.schema) : undefined
			},
			{
				id: 'ograf-manifest',
				label: 'OGraf Manifest',
				type: ManifestFieldType.ConstHidden,
				includeInName: false,
				defaultValue: manifest
			}
		]
	} satisfies TypeManifest
}
