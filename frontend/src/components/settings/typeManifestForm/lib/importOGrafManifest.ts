import type {
	ManifestFieldType,
	TypeManifest,
	TypeManifestEntity
} from '~backend/background/interfaces'
import type { AppDispatch } from '../../../../store/app'
import { importTypeManifest, updateTypeManifest } from '../../../../store/typeManifest'
import * as OGraf from 'ograf'
import { getDefaultDataFromSchema } from 'ograf-form'

export function isImportOGrafManifest(data: unknown): data is OGraf.GraphicsManifest {
	if (typeof data !== 'object' || data === null) return false
	if (Array.isArray(data)) return false

	const manifest = data as OGraf.GraphicsManifest

	return (
		manifest.$schema === 'https://ograf.ebu.io/v1/specification/json-schemas/graphics/schema.json'
	)
}
export async function doImportOGrafManifest(
	manifest: OGraf.GraphicsManifest,
	typeManifests: TypeManifest[],
	dispatch: AppDispatch
) {
	const id = `ograf-${manifest.id}`

	const existing = typeManifests.find((m) => m.id === id)

	const typeManifest: TypeManifest = {
		id,
		colour: '#5555ff',
		entityType: 'piece' as TypeManifestEntity,
		name: manifest.name,
		shortName: manifest.name,
		includeTypeInName: true,

		payload: [
			{
				id: 'ograf-id',
				label: 'OGraf Id',
				type: 'const' as ManifestFieldType,
				defaultValue: manifest.id
			},
			{
				id: 'type',
				label: 'Type of Graphics',
				type: 'enum' as ManifestFieldType,
				enumValues: [
					{ label: 'Full Screen', value: 'full-screen' },
					{ label: 'Overlay 1', value: 'overlay1' },
					{ label: 'Overlay 2', value: 'overlay2' },
					{ label: 'Overlay 3', value: 'overlay3' }
				],
				defaultValue: 'overlay1'
			},
			{
				id: 'ograf-data',
				label: 'OGraf Data',
				type: 'ograf-form' as ManifestFieldType,
				ografManifest: manifest,
				defaultValue: getDefaultDataFromSchema(manifest.schema)
			}
		]
	}

	if (existing) {
		await dispatch(updateTypeManifest({ originalId: existing.id, typeManifest }))
	} else {
		await dispatch(importTypeManifest({ typeManifest }))
	}
}
