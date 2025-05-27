import { BrowserWindow, ipcMain } from 'electron'
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
import { stringifyError } from '../util'

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

		try {
			const stmt = db.prepare(`
				INSERT INTO pieces (id,playlistId,rundownId,segmentId,partId,document)
				VALUES (?,?,?,?,?,json(?));
			`)

			const result = stmt.run(
				id,
				payload.playlistId || null,
				payload.rundownId,
				payload.segmentId,
				payload.partId,
				JSON.stringify(document)
			)
			if (result.changes === 0) throw new Error('No rows were inserted')

			return this.readOne(id)
		} catch (e) {
			return { error: e as Error }
		}
	},
	async readOne(id: string): Promise<{ result?: Piece; error?: Error }> {
		try {
			const stmt = db.prepare(`
						SELECT *
						FROM pieces
						WHERE id = ?
						LIMIT 1;
					`)

			const document = stmt.get(id) as DBPiece | undefined
			if (!document) {
				return { error: new Error(`Piece with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId,
					rundownId: document.rundownId,
					segmentId: document.segmentId,
					partId: document.partId
				}
			}
		} catch (e) {
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationPieceRead>
	): Promise<{ result?: Piece | Piece[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		}

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

		try {
			const stmt = db.prepare(query)

			const documents = stmt.all(...args) as unknown as DBPiece[]

			return {
				result: documents.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					playlistId: d.playlistId,
					rundownId: d.rundownId,
					segmentId: d.segmentId,
					partId: d.partId
				}))
			}
		} catch (e) {
			return { error: e as Error }
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

		try {
			const stmt = db.prepare(`
				UPDATE pieces
				SET playlistId = ?, document = (SELECT json_patch(pieces.document, json(?)) FROM pieces WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(
				payload.playlistId || null,
				JSON.stringify(update),
				payload.id,
				payload.id
			)
			if (result.changes === 0) {
				throw new Error('No rows were updated')
			}

			return this.readOne(payload.id)
		} catch (e) {
			return { error: e as Error }
		}
	},
	async delete(payload: MutationPieceDelete): Promise<{ error?: Error }> {
		try {
			const stmt = db.prepare(`
				DELETE FROM pieces
				WHERE id = ?;
			`)

			stmt.run(payload.id)
			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
}

export async function init(): Promise<void> {
	ipcMain.handle('pieces', async (event, operation: IpcOperation) => {
		if (operation.type === IpcOperationType.Create) {
			const { result, error } = await mutations.create(operation.payload)

			if (result) {
				try {
					await sendPartUpdateToCore(result.partId)
				} catch (error) {
					console.error(error)
					event.sender.send('error', stringifyError(error, true))
				}
			}

			return error || result
		} else if (operation.type === IpcOperationType.Read) {
			const { result, error } = await mutations.read(operation.payload)

			return error || result
		} else if (operation.type === IpcOperationType.Update) {
			const { result, error } = await mutations.update(operation.payload)

			if (result) {
				try {
					await sendPartUpdateToCore(result.partId)
				} catch (error) {
					console.error(error)
					event.sender.send('error', stringifyError(error, true))
				}
			}

			return error || result
		} else if (operation.type === IpcOperationType.Delete) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { error } = await mutations.delete(operation.payload)

			if (!error && document && !Array.isArray(document)) {
				try {
					await sendPartUpdateToCore(document.partId)
				} catch (error) {
					console.error(error)
					event.sender.send('error', stringifyError(error, true))
				}
			}

			return error || true
		}
	})
}

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
