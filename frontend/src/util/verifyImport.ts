import type { SerializedRundown } from '~backend/background/interfaces'

export function verifyImportIsRundown(maybeRundown: unknown): maybeRundown is SerializedRundown {
	// TODO - It would be nicer to rewrite the rundown etc interfaces to be zod, then we can use zod to validate this
	// and get the type inference for free

	const rundownValid =
		typeof maybeRundown === 'object' &&
		maybeRundown !== null &&
		'rundown' in maybeRundown &&
		typeof maybeRundown.rundown === 'object' &&
		maybeRundown.rundown !== null &&
		'name' in maybeRundown.rundown &&
		typeof maybeRundown.rundown.name === 'string' &&
		'id' in maybeRundown.rundown &&
		typeof maybeRundown.rundown.id === 'string' &&
		'playlistId' in maybeRundown.rundown &&
		(typeof maybeRundown.rundown.playlistId === 'string' ||
			maybeRundown.rundown.playlistId === null) &&
		'sync' in maybeRundown.rundown &&
		typeof maybeRundown.rundown.sync === 'boolean' &&
		'segments' in maybeRundown &&
		Array.isArray(maybeRundown.segments) &&
		'parts' in maybeRundown &&
		Array.isArray(maybeRundown.parts) &&
		'pieces' in maybeRundown &&
		Array.isArray(maybeRundown.pieces)

	if (!rundownValid) {
		return false
	}

	const rd = maybeRundown as Pick<SerializedRundown, 'rundown'> & {
		segments: unknown[]
		parts: unknown[]
		pieces: unknown[]
	}

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const segmentsValid = rd.segments.every((segment: any) => {
		return (
			typeof segment === 'object' &&
			segment !== null &&
			'name' in segment &&
			typeof segment.name === 'string' &&
			'rank' in segment &&
			typeof segment.rank === 'number' &&
			'id' in segment &&
			typeof segment.id === 'string' &&
			'rundownId' in segment &&
			typeof segment.rundownId === 'string' &&
			'playlistId' in segment &&
			(typeof segment.playlistId === 'string' || segment.playlistId === null)
		)
	})

	const partsValid = rd.parts.every((part: any) => {
		return (
			typeof part === 'object' &&
			part !== null &&
			'name' in part &&
			typeof part.name === 'string' &&
			'rank' in part &&
			typeof part.rank === 'number' &&
			'id' in part &&
			typeof part.id === 'string' &&
			'rundownId' in part &&
			typeof part.rundownId === 'string' &&
			'playlistId' in part &&
			(typeof part.playlistId === 'string' || part.playlistId === null)
		)
	})

	const piecesValid = rd.pieces.every((piece: any) => {
		return (
			typeof piece === 'object' &&
			piece !== null &&
			'name' in piece &&
			typeof piece.name === 'string' &&
			'id' in piece &&
			typeof piece.id === 'string' &&
			'rundownId' in piece &&
			typeof piece.rundownId === 'string' &&
			'playlistId' in piece &&
			(typeof piece.playlistId === 'string' || piece.playlistId === null)
		)
	})

	return segmentsValid && partsValid && piecesValid
}
