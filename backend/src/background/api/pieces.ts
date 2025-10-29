import {
	DBPiece,
	IpcOperationType,
	MutatedPiece,
	MutationPieceCloneFromParToPart,
	MutationPieceCreate,
	MutationPieceDelete,
	MutationPieceRead,
	MutationPieceUpdate,
	Piece
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { sendPartUpdateToCore } from './parts'
import { mutations as partsMutations } from './parts'
import { Server, Socket } from 'socket.io'

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
			console.error(e)
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
			console.error(e)
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
			console.error(e)
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
			console.error(e)
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
			console.error(e)
			return { error: e as Error }
		}
	},
	async cloneFromPartToPart({
		fromPartId,
		toPartId
	}: MutationPieceCloneFromParToPart): Promise<{ result?: Piece[]; error?: Error }> {
		try {
			const { result: fromPart } = await partsMutations.readOne(fromPartId)
			const { result: toPart } = await partsMutations.readOne(toPartId)

			if (!fromPart || !toPart) {
				throw new Error('Either the source or target Part was not found')
			}

			const { result: sourcePieces } = await mutations.read({ partId: fromPartId })
			if (sourcePieces && Array.isArray(sourcePieces)) {
				await Promise.all(
					sourcePieces.map(async (piece) => {
						return await mutations.create({
							playlistId: toPart.playlistId,
							rundownId: toPart.rundownId,
							segmentId: toPart.segmentId,
							partId: toPart.id,
							name: piece.name,
							start: piece.start,
							duration: piece.duration,
							pieceType: piece.pieceType,
							payload: piece.payload
						})
					})
				)

				const { result: resultPieces } = await mutations.read({ partId: toPartId })
				if (resultPieces) {
					return { result: Array.isArray(resultPieces) ? resultPieces : [resultPieces] }
				} else {
					throw new Error("Couldn't retrieve cloned pieces after creation.")
				}
			} else {
				throw new Error('Pre-conditions for cloning were not met.')
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	}
}

export function registerPiecesHandlers(socket: Socket, _io: Server) {
	socket.on('pieces', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await handleCreatePiece(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Read:
				{
					const { result, error } = await mutations.read(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Update:
				{
					const { result, error } = await handleUpdatePiece(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Delete:
				{
					const { result, error } = await handleDeletePiece(payload)
					callback(result || error)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}

async function handleCreatePiece(payload: MutationPieceCreate) {
	{
		let returnedError: unknown | Error | undefined

		const { result, error: createError } = await mutations.create(payload)

		if (createError) returnedError = createError

		if (result) {
			try {
				await sendPartUpdateToCore(result.partId)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result, error: returnedError }
	}
}

async function handleUpdatePiece(payload: MutationPieceUpdate) {
	{
		let returnedError: unknown | Error | undefined

		const { result, error: updateError } = await mutations.update(payload)

		if (updateError) returnedError = updateError

		if (result) {
			try {
				await sendPartUpdateToCore(result.partId)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result, error: returnedError }
	}
}

async function handleDeletePiece(payload: MutationPieceDelete) {
	{
		let returnedError: unknown | Error | undefined

		const { result: document } = await mutations.read({ id: payload.id })
		const { error: deleteError } = await mutations.delete(payload)

		if (deleteError) returnedError = deleteError

		if (!deleteError && document && !Array.isArray(document)) {
			try {
				await sendPartUpdateToCore(document.partId)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result: returnedError === undefined ? true : undefined, error: returnedError }
	}
}

async function handleCloneSetPiece(payload: MutationPieceCloneFromParToPart) {
	{
		let returnedError: unknown | Error | undefined

		const { result, error: cloneError } = await mutations.cloneFromPartToPart(payload)

		if (cloneError) returnedError = cloneError

		if (result) {
			try {
				await sendPartUpdateToCore(payload.toPartId)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result, error: returnedError }
	}
}

export async function getMutatedPiecesFromPart(partId: string): Promise<MutatedPiece[]> {
	const { result: pieces } = await mutations.read({ partId: partId })

	if (pieces && Array.isArray(pieces)) {
		return pieces.map((piece) => ({
			id: piece.id,
			name: piece.name,
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
