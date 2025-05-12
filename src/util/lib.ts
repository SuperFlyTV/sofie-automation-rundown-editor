export function literal<T>(o: T): T {
	return o
}

export type Nullable<T> = { [K in keyof T]: T[K] | null }

export interface EditField<T> {
	[field: string]: {
		get(): T | undefined
		set(value: T): void
	}
}

 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const editField = <T extends any>(
	doc: string,
	field: string,
	index?: string,
	defaultVal: any = undefined
): EditField<T> => ({
	[field]: {
		get(): T | undefined {
			const self = this as any
			if (index) {
				return self.editObject
					? self.editObject[index]?.[field]
					: self[doc]?.[index]?.[field] || defaultVal
			} else {
				const editObj = self.editObject ? self.editObject[field] : undefined
				const docObj = self[doc]?.[field] ?? defaultVal

				return editObj ?? docObj
			}
		},
		set(value: T) {
			const self = this as any
			const isValue = value !== '' && value !== undefined && value !== null

			if (!self.editObject) {
				self.editObject = {
					...self[doc]
				}
			}

			if (index) {
				if (!self.editObject[index]) self.editObject[index] = {}

				self.editObject[index][field] = isValue ? value : null
			} else {
				self.editObject[field] = isValue ? value : null
			}
		}
	}
})
 

export const toTime = (seconds: number): string => {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	const pad = (t: number) => ('00' + t).substr(-2)

	return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
}

export const toTimeDiff = (seconds: number): string => {
	const prefix = seconds > 0 ? '+' : '-'

	seconds = Math.abs(seconds)
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	const pad = (t: number) => ('00' + t).substr(-2)

	return `${prefix}${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
}
