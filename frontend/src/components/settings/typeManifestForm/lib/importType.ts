import type { TypeManifest } from '~backend/background/interfaces'
import type { AppDispatch } from '../../../../store/app'
import { importTypeManifest, updateTypeManifest } from '../../../../store/typeManifest'

export function isImportTypeManifest(arr: unknown): arr is TypeManifest[] {
	return (
		Array.isArray(arr) &&
		arr.every((t) => 'id' in t && 'entityType' in t && 'name' in t && 'payload' in t)
	)
}
export async function doImportTypeManifest(
	importJson: TypeManifest[],
	typeManifests: TypeManifest[],
	dispatch: AppDispatch
) {
	await Promise.all(
		importJson.map(async (t) => {
			const existing = typeManifests.find((m) => m.id === t.id)
			try {
				if (existing) {
					await dispatch(updateTypeManifest({ originalId: existing.id, typeManifest: t }))
				} else {
					await dispatch(importTypeManifest({ typeManifest: t }))
				}
			} catch (e) {
				console.error(e)
				throw e
			}
		})
	)
}
