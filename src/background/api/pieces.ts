import { ipcMain } from 'electron'
import {
	DBPiece,
	IpcOperation,
	IpcOperationType,
	MutatedPiece,
	MutationPieceCreate,
	MutationPieceDelete,
	MutationPieceRead,
	MutationPieceUpdate,
	Piece
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { sendPartUpdateToCore } from './parts'

export const mutations = {
	async create(payload: MutationPieceCreate): Promise<{ result?: Piece; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationPieceCreate> = {
			...payload
		}
		delete document.playlistId
		delete document.rundownId
		delete document.segmentId
		delete document.partId

		if (!payload.rundownId || !payload.partId)
			return { error: new Error('Missing rundown id or part id') }

		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			INSERT INTO pieces (id,playlistId,rundownId,segmentId,partId,document)
			VALUES (?,?,?,?,?,json(?));
		`,
				[
					id,
					payload.playlistId || null,
					payload.rundownId,
					payload.segmentId,
					payload.partId,
					JSON.stringify(document)
				],
				function(e: Error | null) {
					if (e) {
						resolve({ result: undefined, error: e })
					} else if (this) {
						resolve({ result: this.lastID, error: undefined })
					}
				}
			)
		)

		if (result) {
			const { result: document, error: readError } = await mutations.read({ id })

			if (document && !Array.isArray(document)) {
				return { result: document }
			}

			return { error: readError }
			// const document = await new Promise<DBPiece>((resolve, reject) => db.get(`
			// 	SELECT *
			// 	FROM pieces
			// 	WHERE id = ?
			// 	LIMIT 1;
			// `, [ id ], (e, r) => {
			// 	console.log(e, r)
			// 	resolve(r)
			// }))

			// return {
			// 	...JSON.parse(document.document),
			// 	id: document.id,
			// 	playlistId: document.playlistId,
			// 	rundownId: document.rundownId,
			// 	segmentId: document.segmentId,
			// 	partId: document.partId
			// }
		}

		return { error }
	},
	async read(
		payload: Partial<MutationPieceRead>
	): Promise<{ result?: Piece | Piece[]; error?: Error }> {
		let query = `
			SELECT *
			FROM pieces
		`
		const args: string[] = []
		if (payload.id) {
			query += `\nWHERE id = ?`
			args.push(payload.id)
		}
		if (payload.rundownId) {
			query += `\nWHERE rundownId = ?`
			args.push(payload.rundownId)
		}
		if (payload.segmentId) {
			query += `\nWHERE segmentId = ?`
			args.push(payload.segmentId)
		}
		if (payload.partId) {
			query += `\nWHERE partId = ?`
			args.push(payload.partId)
		}

		if (payload.id) {
			query += `\nLIMIT 1`

			const { result, error } = await new Promise<{ result?: DBPiece; error?: Error }>((resolve) =>
				db.get(query, args, (e, r: DBPiece) =>
					e ? resolve({ error: e, result: undefined }) : resolve({ result: r, error: undefined })
				)
			)

			if (!result) {
				return { error }
			}

			return {
				result: {
					...JSON.parse(result.document),
					id: result.id,
					playlistId: result.playlistId,
					rundownId: result.rundownId,
					segmentId: result.segmentId,
					partId: result.partId
				}
			}
		} else {
			const { result, error } = await new Promise<{ result?: DBPiece[]; error?: Error }>(
				(resolve) =>
					db.all(query, args, (e, r: DBPiece[]) =>
						e ? resolve({ error: e, result: undefined }) : resolve({ result: r, error: undefined })
					)
			)

			if (!result) {
				return { error }
			}

			return {
				result: result.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					playlistId: d.playlistId,
					rundownId: d.rundownId,
					segmentId: d.segmentId,
					partId: d.partId
				}))
			}
		}
	},
	async update(payload: MutationPieceUpdate): Promise<{ result?: Piece; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null,
			rundownId: null,
			segmentId: null,
			partId: null
		}

		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			UPDATE pieces
			SET playlistId = ?, document = (SELECT json_patch(pieces.document, json(?)) FROM pieces WHERE id = ?)
			WHERE id = "${payload.id}";
		`,
				[payload.playlistId || null, JSON.stringify(update), payload.id],
				(e) => resolve({ error: e, result: e ? undefined : true })
			)
		)

		if (result) {
			const { result: document, error: readError } = await mutations.read({
				id: payload.id
			})

			if (document && !Array.isArray(document)) {
				return { result: document }
			}

			return { error: readError }
		}

		return { error }
	},
	async delete(payload: MutationPieceDelete): Promise<{ error?: Error }> {
		return new Promise((resolve) =>
			db.run(
				`
			DELETE FROM pieces
			WHERE id = "${payload.id}";
		`,
				(e) => resolve({ error: e || undefined })
			)
		)
	}
}

ipcMain.handle('pieces', async (_, operation: IpcOperation) => {
	if (operation.type === IpcOperationType.Create) {
		const { result, error } = await mutations.create(operation.payload)

		if (result) await sendPartUpdateToCore(result.partId)

		return error || result
	} else if (operation.type === IpcOperationType.Read) {
		const { result, error } = await mutations.read(operation.payload)

		return error || result
	} else if (operation.type === IpcOperationType.Update) {
		const { result, error } = await mutations.update(operation.payload)

		if (result) await sendPartUpdateToCore(result.partId)

		return error || result
	} else if (operation.type === IpcOperationType.Delete) {
		const { result: document } = await mutations.read({ id: operation.payload.id })
		const { error } = await mutations.delete(operation.payload)

		if (!error && document && !Array.isArray(document)) await sendPartUpdateToCore(document.partId)

		return error || true
	}
})

export async function getMutatedPiecesFromPart(partId: string): Promise<MutatedPiece[]> {
	const { result: pieces } = await mutations.read({ partId: partId })

	if (pieces && Array.isArray(pieces)) {
		return pieces.map((piece) => ({
			id: piece.id,
			objectType: piece.pieceType,
			objectTime: piece.start,
			duration: piece.duration,
			clipName: undefined,
			attributes: {
				...piece.payload,
				adlib: piece.start === undefined || piece.start === null
			},
			position: undefined
		}))
	}

	return []
}
