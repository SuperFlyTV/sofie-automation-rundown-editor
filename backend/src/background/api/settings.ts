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
			case 'reloadOGrafGraphics':
				{
					const ografs = await ografHandler.loadGraphics(payload)

					const readPieceManifests = await typeManifestMutations.read({
						entityType: TypeManifestEntity.Piece
					})

					let pieceManifests: TypeManifest[] = []
					if (readPieceManifests && Array.isArray(readPieceManifests.result))
						pieceManifests = readPieceManifests.result

					const OGRAF_GRAPHICS_ID_PREFIX = 'ograf_graphic_'
					for (const ograf of ografs) {
						const id = `${OGRAF_GRAPHICS_ID_PREFIX}${ograf.id}`
						const name = `OGraf: ${ograf.name}`
						const shortName = ograf.name
						const payload: PayloadManifest[] = [
							// {
							// 	id: 'inTime',
							// 	label: 'In Time (s)',
							// 	type: ManifestFieldType.Number,
							// 	defaultValue: 0,
							// 	includeInName: true
							// },
							// {
							// 	id: 'duration',
							// 	label: 'Duration (s)',
							// 	type: ManifestFieldType.Number,
							// 	defaultValue: 8,
							// 	includeInName: true
							// },
							{
								id: 'data',
								label: 'Data',
								type: ManifestFieldType.OGrafForm,
								defaultValue: getDefaultDataFromSchema(ograf.manifest.schema),
								includeInName: true,
								ografManifest: ograf.manifest
							}
						]

						console.log('OGraf', ograf.id, ograf.name)
						const existingPieceManifest = pieceManifests.find(
							(pieceManifest) => pieceManifest.id === id
						)
						if (!existingPieceManifest) {
							console.log('Creating new')
							await typeManifestMutations.create({
								id,
								entityType: TypeManifestEntity.Piece,
								name,
								shortName,
								colour: '#FFCC00',
								includeTypeInName: true,
								payload
							})
						} else {
							console.log('Updating existing')
							await typeManifestMutations.update({
								id,
								update: {
									id,
									// entityType: TypeManifestEntity.Piece,
									colour: existingPieceManifest.colour ?? '#FFCC00',
									// includeTypeInName: existingPieceManifest.includeTypeInName ?? true,
									name,
									shortName,
									payload
								}
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

export async function initializeDefaults() {
	mutations.read().then(({ result }) => {
		if (!result) {
			mutations.create(DEFAULT_SETTINGS)
		}
	})

	// Reset type manifests using the typeManifests module
	// First, get all existing manifests
	const existingManifests = await typeManifestMutations.read({})

	if (existingManifests && Array.isArray(existingManifests)) {
		// Delete them all
		for (const manifest of existingManifests) {
			await typeManifestMutations.delete({ id: manifest.id })
		}
	}
	// Insert the defaults
	await typeManifestMutations.create({
		id: 'rundown',
		entityType: TypeManifestEntity.Rundown,
		// Only store the payload array for now; keep other fields in settings
		payload: defaultRundownManifest.payload
	})

	for (const typeManifest of TYPE_MANIFESTS) {
		await typeManifestMutations.create(typeManifest)
	}
}
