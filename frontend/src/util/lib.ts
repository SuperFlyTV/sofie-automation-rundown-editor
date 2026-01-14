export function literal<T>(o: T) {
	return o
}

export type Nullable<T> = { [K in keyof T]: T[K] | null }

export const toTime = (seconds: number) => {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	const pad = (t: number) => ('00' + t).substr(-2)

	return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
}

export const toTimeDiff = (seconds: number) => {
	const prefix = seconds > 0 ? '+' : '-'

	seconds = Math.abs(seconds)
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = Math.floor(seconds % 60)
	const pad = (t: number) => ('00' + t).substr(-2)

	return `${prefix}${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
}
export function computeInsertRank<T extends { id: string; rank: number }>(
	items: T[],
	currentId: string
): number {
	const sorted = [...items].sort((a, b) => a.rank - b.rank)
	const index = sorted.findIndex((i) => i.id === currentId)
	const next = sorted[index + 1]

	return next ? (sorted[index].rank + next.rank) / 2 : sorted[index].rank + 1
}
