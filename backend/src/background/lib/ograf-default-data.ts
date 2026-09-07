// import type { GDDSchema } from "./types.js";

// This file is copied from `ograf-form`

type GDDSchema = any

export function getDefaultDataFromSchema(gddSchema: any, prefilledData?: any) {
	return _getDefaultDataFromSchema(gddSchema, prefilledData, '')
}
function _getDefaultDataFromSchema(gddSchema: GDDSchema, prefilledData?: any, key: string = '') {
	// Note: this function assumes that the schema provided has been validated by validateSchema()

	if (gddSchema.type === 'object') {
		const dataObject = clone(prefilledData ?? gddSchema.default ?? {})
		for (const [subKey, subSchema] of Object.entries(gddSchema.properties ?? {})) {
			if (typeof subSchema === 'boolean') continue // skip

			const subData = _getDefaultDataFromSchema(subSchema, dataObject[subKey], key + '.' + subKey)
			if (subData !== undefined) {
				dataObject[subKey] = subData
			}
		}
		return dataObject
	} else if (gddSchema.type === 'array') {
		const dataArray = clone(prefilledData ?? gddSchema.default ?? [])

		if (typeof gddSchema.items === 'object' && !Array.isArray(gddSchema.items)) {
			for (let index = 0; index < dataArray.length; index++) {
				dataArray[index] = _getDefaultDataFromSchema(
					gddSchema.items,
					dataArray[index],
					key + `[${index}]`
				)
			}
		}
		return dataArray
	} else {
		const data = prefilledData ?? gddSchema.default ?? undefined
		if (data !== undefined) return data

		// Fallback to default values:
		if (gddSchema.type === 'boolean') return false
		if (gddSchema.type === 'string') return ''
		if (gddSchema.type === 'number') return 0
		if (gddSchema.type === 'integer') return 0

		return undefined
	}
}
function clone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj))
}
