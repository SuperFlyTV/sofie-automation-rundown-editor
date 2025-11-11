import {
	DBRundown,
	IpcOperationType,
	MutationRundownCreate,
	MutationRundownDelete,
	MutationRundownRead,
	MutationRundownUpdate,
	MutatedRundown,
	Rundown,
	MutationRundownCopyResult,
	MutationRundownCopy
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedSegmentsFromRundown } from './segments'
import { mutations as partMutations } from './parts'
import { mutations as piecesMutations } from './pieces'
import { mutations as segmentsMutations } from './segments'
import { Server, Socket } from 'socket.io'

export async function mutateRundown(rundown: Rundown): Promise<MutatedRundown> {
	return {
		externalId: rundown.id,
		name: rundown.name,
		type: 'sofie-rundown-editor', // ?
		segments: await getMutatedSegmentsFromRundown(rundown.id),
		payload: {
			name: rundown.name,
			expectedStart: rundown.expectedStartTime,
			expectedEnd: rundown.expectedEndTime,
			...(rundown.metaData || {})
		}
	}
}

export async function sendRundownDiffToCore(oldDocument: Rundown, newDocument: Rundown) {
	const wasSynced = oldDocument.sync && !oldDocument.isTemplate
	const willSync = newDocument.sync && !newDocument.isTemplate

	if (wasSynced && !willSync) {
		// The rundown was synced, but now it should NOT be synced (so we delete it from core)
		console.log('delete rundown', oldDocument, newDocument)
		return coreHandler.core.coreMethods.dataRundownDelete(oldDocument.id)
	} else if (!wasSynced && willSync) {
		// The rundown was not synced, but now it should be synced (so we create it in core)
		console.log('create rundown', oldDocument, newDocument)
		return coreHandler.core.coreMethods.dataRundownCreate(await mutateRundown(newDocument))
	} else if (wasSynced && willSync) {
		// The rundown was synced and still should be synced (so we send an update to core)
		console.log('update rundown', oldDocument, newDocument)
		return coreHandler.core.coreMethods.dataRundownUpdate(await mutateRundown(newDocument))
	}
}

export const mutations = {
	async create(payload: MutationRundownCreate): Promise<{ result?: Rundown; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationRundownCreate> = {
			...payload
		}
		delete document.id
		delete document.playlistId

		try {
			const stmt = db.prepare(`
				INSERT INTO rundowns (id,playlistId,document)
				VALUES (?,?,json(?));
			`)

			const result = stmt.run(id, payload.playlistId || null, JSON.stringify(document))
			if (result.changes === 0) throw new Error('No rows were inserted')

			console.log(result)

			return this.readOne(id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	/**
	 * Copy an existing Rundown.
	 *
	 * This function creates a new `Rundown` record by duplicating the data of an existing one.
	 *
	 * @async
	 * @param {Object} payload - The clone parameters.
	 * @param {string} payload.id - The ID of the source part to clone.
	 * @returns {Promise<{ result?: MutationRundownCopyResult; error?: Error }>}
	 * Returns an object containing either the newly cloned `Rundown`, it's `Segment`s, `Part`s and `Piece`s (`result`)
	 * or an `Error` (`error`) if the operation fails.
	 */
	async createRundownCopy(payload: MutationRundownCopy) {
		{
			let returnedError: unknown | Error | undefined
			let result: MutationRundownCopyResult | undefined

			const { result: sourceRundown, error: rundownReadError } = await mutations.readOne(payload.id)

			if (rundownReadError || !sourceRundown) returnedError = rundownReadError
			else {
				try {
					const { result: newRundown, error: createError } = await mutations.create({
						...sourceRundown,
						name: getNewRundownName(sourceRundown, {
							preserveName: false,
							fromTemplate: true
						}),
						isTemplate: false,
						id: undefined
					})

					if (!newRundown) {
						console.error(createError)
						throw new Error('Could not create new Rundown while copying.')
					}
					const copiedSegments = await segmentsMutations.cloneFromRundownToRundown({
						fromRundownId: sourceRundown.id,
						toRundownId: newRundown.id
					})

					if (copiedSegments.error) {
						throw new Error('Copying the segments into the rundown failed')
					}

					const { result: partsResult, error: partsResultReadError } = await partMutations.read({
						rundownId: newRundown.id
					})
					const { result: piecesResult, error: piecesResultReadError } = await piecesMutations.read(
						{
							segmentId: newRundown.id
						}
					)

					if (createError || piecesResultReadError || partsResultReadError)
						returnedError = createError || piecesResultReadError || partsResultReadError
					else
						result =
							copiedSegments.result && partsResult && piecesResult && newRundown
								? {
										rundown: newRundown,
										segments: copiedSegments.result,
										parts: Array.isArray(partsResult) ? partsResult : [partsResult],
										pieces: Array.isArray(piecesResult) ? piecesResult : [piecesResult]
									}
								: undefined
				} catch (e) {
					returnedError = e
				}
			}
			return { result: !returnedError ? result : undefined, error: returnedError }
		}
	},
	async readOne(id: string): Promise<{ result?: Rundown; error?: Error }> {
		try {
			const stmt = db.prepare(`
					SELECT *
					FROM rundowns
					WHERE id = ?
					LIMIT 1;
				`)

			const document = stmt.get(id) as DBRundown | undefined
			if (!document) {
				return { error: new Error(`Rundown with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId
				}
			}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationRundownRead>
	): Promise<{ result?: Rundown | Rundown[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		} else {
			try {
				const stmt = db.prepare(`
							SELECT *
							FROM rundowns
						`)

				const documents = stmt.all() as unknown as DBRundown[]

				return {
					result: documents.map((d) => ({
						...JSON.parse(d.document),
						id: d.id,
						playlistId: d.playlistId
					}))
				}
			} catch (e) {
				console.error(e)
				return { error: e as Error }
			}
		}
	},
	async update(payload: MutationRundownUpdate): Promise<{ result?: Rundown; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE rundowns
				SET playlistId = ?, document = (SELECT json_patch(rundowns.document, json(?)) FROM rundowns WHERE id = ?)
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
	async delete(payload: MutationRundownDelete): Promise<{ error?: Error }> {
		try {
			db.exec('BEGIN TRANSACTION')

			db.prepare('DELETE FROM pieces WHERE rundownId = ?').run(payload.id)
			db.prepare('DELETE FROM parts WHERE rundownId = ?').run(payload.id)
			db.prepare('DELETE FROM segments WHERE rundownId = ?').run(payload.id)
			db.prepare('DELETE FROM rundowns WHERE id = ?').run(payload.id)

			db.exec('COMMIT')

			return {}
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	}
}

export function registerRundownsHandlers(socket: Socket, io: Server) {
	socket.on('rundowns', async (action, payload, callback) => {
		switch (action) {
			case IpcOperationType.Create:
				{
					const { result, error } = await handleCreateRundown(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Copy:
				{
					const { result, error } = await handleCopyRundown(payload)
					io.emit('segments:update', {
						action: 'update',
						pieces: result?.segments
					})
					io.emit('parts:update', {
						action: 'update',
						pieces: result?.parts
					})
					io.emit('pieces:update', {
						action: 'update',
						pieces: result?.pieces
					})
					callback(result?.rundown || error)
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
					const { result, error } = await handleUpdateRundown(payload)
					callback(result || error)
				}
				break
			case IpcOperationType.Delete:
				{
					const { result, error } = await handleDeleteRundown(payload)
					callback(result || error)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}

async function handleCreateRundown(payload: MutationRundownCreate) {
	{
		let returnedError: unknown | Error | undefined

		const { result, error: createError } = await mutations.create(payload)

		if (createError) returnedError = createError

		if (result && result.sync) {
			console.log('create rundown', result, createError)
			try {
				await coreHandler.core.coreMethods.dataRundownCreate(await mutateRundown(result))
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result, error: returnedError }
	}
}
async function handleCopyRundown(payload: MutationRundownCopy) {
	let returnedError: unknown | Error | undefined

	const { result, error: cloneError } = await mutations.createRundownCopy(payload)

	if (cloneError) returnedError = cloneError

	try {
		if (result) {
			await coreHandler.core.coreMethods.dataRundownCreate(await mutateRundown(result.rundown))
		} else throw new Error('Error sending rundown update to core.')
	} catch (error) {
		console.error(error)
		returnedError = error
	}

	return { result, error: returnedError }
}
async function handleUpdateRundown(payload: MutationRundownUpdate) {
	{
		let returnedError: unknown | Error | undefined

		const { result: document } = await mutations.read({ id: payload.id })
		const { result, error: updateError } = await mutations.update(payload)

		if (updateError) returnedError = updateError

		if (document && 'id' in document && result) {
			try {
				await sendRundownDiffToCore(document, result)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result, error: returnedError }
	}
}
async function handleDeleteRundown(payload: MutationRundownDelete) {
	{
		let returnedError: unknown | Error | undefined

		const { result: document } = await mutations.read({ id: payload.id })
		const { error: deleteError } = await mutations.delete(payload)

		if (deleteError) returnedError = deleteError

		if (document && 'id' in document && !deleteError && document.sync) {
			try {
				await coreHandler.core.coreMethods.dataRundownDelete(document.id)
			} catch (error) {
				console.error(error)
				returnedError = error
			}
		}

		return { result: returnedError === undefined ? true : undefined, error: returnedError }
	}
}

function getNewRundownName(
	sourceRundown: Rundown,
	payload: { preserveName?: boolean; fromTemplate?: boolean }
) {
	const now = new Date()
	const dateSuffix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
		now.getDate()
	).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
		now.getMinutes()
	).padStart(2, '0')}`

	if (payload.fromTemplate) {
		// From template → append date/time
		return `${sourceRundown.name} ${dateSuffix}`
	}

	if (!payload.preserveName) {
		// Not preserving name → append ' Copy'
		return `${sourceRundown.name} Copy`
	}

	// Preserve original name
	return sourceRundown.name
}
