import { ipcMain } from 'electron'
import {
	DBPart,
	IpcOperation,
	IpcOperationType,
	MutationPartCreate,
	MutationPartDelete,
	MutationPartRead,
	MutationPartUpdate,
	MutatedPart,
	Part
} from '../interfaces'
import { db } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPiecesFromPart } from './pieces'
import { mutations as rundownMutations } from './rundowns'
import { mutations as segmentsMutations, sendSegmentDiffToCore } from './segments'
import { spliceReorder, stringifyError } from '../util'
import { mutations as settingsMutations } from './settings'
import { mutations as piecesMutations } from './pieces'

async function mutatePart(part: Part): Promise<MutatedPart> {
	return {
		externalId: part.id,
		name: part.name,
		rank: part.rank,
		payload: {
			segmentId: part.segmentId,
			externalId: part.id,
			rank: part.rank,
			name: part.name,
			type: (part.payload || {}).type,
			float: part.float,
			script: (part.payload || {}).script,
			duration: (part.payload || {}).duration,

			pieces: await getMutatedPiecesFromPart(part.id)
		}
	}
}

async function sendPartDiffToCore(oldPart: Part, newPart: Part) {
	const rd = await rundownMutations.read({ id: newPart.rundownId })
	if (rd.result && !Array.isArray(rd.result) && rd.result.sync === false) {
		return
	}
	const segment = await segmentsMutations.read({ id: newPart.segmentId })
	if (segment.result && !Array.isArray(segment.result) && segment.result.float === true) {
		return
	}

	if (oldPart.float && !newPart.float) {
		await coreHandler.core.coreMethods.dataPartDelete(
			oldPart.rundownId,
			oldPart.segmentId,
			oldPart.id
		)
	} else if (!oldPart.float && newPart.float) {
		coreHandler.core.coreMethods.dataPartDelete(newPart.rundownId, newPart.segmentId, newPart.id)
	} else if (!oldPart.float && !newPart.float) {
		coreHandler.core.coreMethods.dataPartUpdate(
			newPart.rundownId,
			newPart.segmentId,
			await mutatePart(newPart)
		)
	}
}

export const mutations = {
	async create(payload: MutationPartCreate): Promise<{ result?: Part; error?: Error }> {
		const partTypes: string[] | undefined = (await settingsMutations.read()).result?.partTypes
		const segmentParts: Part | Part[] | undefined = (
			await mutations.read({ segmentId: payload.segmentId })
		).result

		const partsLength: number = Array.isArray(segmentParts)
			? segmentParts.length
			: segmentParts
				? 1
				: 0

		const id = payload.id || uuid()
		const document: Partial<MutationPartCreate> = {
			...payload,
			payload: {
				// fallback Type to avoid errors in core
				type: partTypes?.[0],
				...payload.payload
			},
			rank: payload.rank ?? partsLength
		}
		delete document.playlistId
		delete document.rundownId
		delete document.segmentId

		if (!payload.rundownId || !payload.segmentId)
			return { error: new Error('Missing rundown or segment id') }

		try {
			const stmt = db.prepare(`
				INSERT INTO parts (id,playlistId,rundownId,segmentId,document)
				VALUES (?,?,?,?,json(?));
			`)

			const result = stmt.run(
				id,
				payload.playlistId || null,
				payload.rundownId,
				payload.segmentId,
				JSON.stringify(document)
			)
			if (result.changes === 0) throw new Error('No rows were inserted')

			return this.readOne(id)
		} catch (e) {
			return { error: e as Error }
		}
	},
	async move(
		sourcePart: Part,
		targetPart: Part,
		targetIndex: number
	): Promise<{ result?: Part; error?: Error }> {
		try {
			const addNewPart = await mutations.create({
				...sourcePart,
				rundownId: targetPart.rundownId,
				playlistId: targetPart.playlistId,
				segmentId: targetPart.segmentId,
				rank: undefined,
				id: uuid(),
				payload: {
					script: sourcePart.payload.script,
					type: sourcePart.payload.type,
					duration: sourcePart.payload.duration
				}
			})
			if (!addNewPart.result) {
				console.error(addNewPart.error)
				throw new Error('Could not create new part while cloning.')
			}
			const clonePieces = await piecesMutations.cloneFromPartToPart({
				fromPartId: sourcePart.id,
				toPartId: addNewPart.result.id
			})
			const reorderParts = await mutations.reorder({ part: addNewPart.result, targetIndex })
			const removePart = await mutations.delete({ id: sourcePart.id })

			if (clonePieces.error && reorderParts.error && removePart.error) {
				throw new Error('Cloning the part failed')
			}

			return mutations.readOne(addNewPart.result.id)
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async readOne(id: string): Promise<{ result?: Part; error?: Error }> {
		try {
			const stmt = db.prepare(`
					SELECT *
					FROM parts
					WHERE id = ?
					LIMIT 1;
				`)

			const document = stmt.get(id) as DBPart | undefined
			if (!document) {
				return { error: new Error(`Part with id ${id} not found`) }
			}

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId,
					rundownId: document.rundownId,
					segmentId: document.segmentId
				}
			}
		} catch (e) {
			return { error: e as Error }
		}
	},
	async read(
		payload: Partial<MutationPartRead>
	): Promise<{ result?: Part | Part[]; error?: Error }> {
		if (payload && payload.id) {
			return this.readOne(payload.id)
		}

		let query = `
    SELECT *
    FROM parts
  `
		const args: (string | number)[] = []
		const conditions: string[] = []

		if (payload.id) {
			conditions.push(`id = ?`)
			args.push(payload.id)
		}
		if (payload.rundownId) {
			conditions.push(`rundownId = ?`)
			args.push(payload.rundownId)
		}
		if (payload.segmentId) {
			conditions.push(`segmentId = ?`)
			args.push(payload.segmentId)
		}
		if (payload.rank !== null && payload.rank !== undefined) {
			conditions.push(`JSON_EXTRACT(document, '$.rank') = ?`)
			args.push(payload.rank)
		}

		if (conditions.length > 0) {
			query += `\nWHERE ${conditions.join(' AND ')}` // Join conditions with AND
		}

		try {
			const stmt = db.prepare(query)

			const documents = stmt.all(...args) as unknown as DBPart[]

			return {
				result: documents.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					playlistId: d.playlistId,
					rundownId: d.rundownId,
					segmentId: d.segmentId
				}))
			}
		} catch (e) {
			return { error: e as Error }
		}
	},
	async update(payload: MutationPartUpdate): Promise<{ result?: Part; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null,
			rundownId: null,
			segmentId: null
		}

		try {
			const stmt = db.prepare(`
				UPDATE parts
				SET playlistId = ?, segmentId = ?, document = (SELECT json_patch(parts.document, json(?)) FROM parts WHERE id = ?)
				WHERE id = ?;
			`)

			const result = stmt.run(
				payload.playlistId || null,
				payload.segmentId || null,
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
	async reorder({
		part,
		targetIndex
	}: {
		part: MutationPartUpdate
		targetIndex: number
	}): Promise<{ result?: Part | Part[]; error?: Error }> {
		try {
			const { result, error } = await this.read({
				segmentId: part.segmentId,
				rundownId: part.rundownId
			})

			if (error) throw error
			if (result && (!('length' in result) || result?.length < 2))
				throw new Error('An error occurred when getting parts from the database during reorder.')

			const safeTargetIndex: number = Math.max(
				0,
				Math.min((result as Part[]).length - 1, targetIndex)
			)

			const partsInRankOrder = (result as Part[]).sort((partA, partB) => partA.rank - partB.rank)
			const reorderedParts = spliceReorder(partsInRankOrder, part.rank, safeTargetIndex)

			db.exec('BEGIN;')
			try {
				const updateStmt = db.prepare(`
				UPDATE parts
				SET playlistId = ?, segmentId = ?, document = (SELECT json_patch(parts.document, json(?)) FROM parts WHERE id = ?)
				WHERE id = ?;
			`)

				reorderedParts.forEach((part, index) => {
					updateStmt.run(
						part.playlistId || null,
						part.segmentId || null,
						// update rank based on array order
						JSON.stringify({ ...part, rank: index }),
						part.id,
						part.id
					)
				})

				db.exec('COMMIT;')
			} catch (transactionError) {
				console.error(transactionError)
				db.exec('ROLLBACK;')
				throw transactionError
			}

			const { result: updatedParts, error: updatedPartserror } = await this.read({
				segmentId: part.segmentId,
				rundownId: part.rundownId
			})

			if (updatedPartserror) throw updatedPartserror

			return { result: updatedParts }
		} catch (e) {
			console.error(e)
			return { error: e as Error }
		}
	},
	async delete(payload: MutationPartDelete): Promise<{ error?: Error }> {
		try {
			db.exec('BEGIN TRANSACTION')

			db.prepare('DELETE FROM pieces WHERE partId = ?').run(payload.id)
			db.prepare('DELETE FROM parts WHERE id = ?').run(payload.id)

			db.exec('COMMIT')

			return {}
		} catch (e) {
			return { error: e as Error }
		}
	}
}

export async function init(): Promise<void> {
	ipcMain.handle('parts', async (event, operation: IpcOperation) => {
		if (operation.type === IpcOperationType.Create) {
			const { result, error } = await mutations.create(operation.payload)

			if (result && !result.float) {
				const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await coreHandler.core.coreMethods.dataPartCreate(
							result.rundownId,
							result.segmentId,
							await mutatePart(result)
						)
					} catch (error) {
						console.error(error)
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return error || result
		} else if (operation.type === IpcOperationType.Move) {
			// TODO: Maybe this should be handled inside Sofie?
			try {
				const { sourcePart, targetPart, targetIndex } = operation.payload
				const { result: document, error: sourceError } = await mutations.readOne(sourcePart.id)
				if (sourceError) throw sourceError
				const { result: target, error: targetError } = await mutations.readOne(targetPart.id)
				if (targetError) throw targetError

				if (document && target) {
					const { result, error } = await mutations.move(sourcePart, targetPart, targetIndex)
					if (error) throw error

					const { result: sourceSegment } = await segmentsMutations.readOne(document.segmentId)
					const { result: targetSegment } = await segmentsMutations.readOne(target.segmentId)

					if (result && sourceSegment && targetSegment) {
						try {
							await sendSegmentDiffToCore(sourceSegment, sourceSegment)
							await sendSegmentDiffToCore(targetSegment, targetSegment)
						} catch (error) {
							console.error(error)
							event.sender.send('error', stringifyError(error, true))
						}
					} else throw new Error('Cannot find segments while cloning')
					return result
				}
			} catch (e) {
				console.error(e)
				return e as Error
			}
		} else if (operation.type === IpcOperationType.Read) {
			const { result, error } = await mutations.read(operation.payload)

			return error || result
		} else if (operation.type === IpcOperationType.Update) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { result, error } = await mutations.update(operation.payload)

			if (document && 'id' in document && result) {
				try {
					await sendPartDiffToCore(document, result)
				} catch (error) {
					console.error(error)
					event.sender.send('error', stringifyError(error, true))
				}
			}

			return error || result
		} else if (operation.type === IpcOperationType.Reorder) {
			const { result: sourceDocument } = await mutations.read({ id: operation.payload.part.id })
			const { result: reorderedParts, error } = await mutations.reorder(operation.payload)

			if (
				!error &&
				sourceDocument &&
				!Array.isArray(sourceDocument) &&
				Array.isArray(reorderedParts)
			) {
				const { result: rundown } = await rundownMutations.read({ id: sourceDocument.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						const { result: segment, error: segmentError } = await segmentsMutations.readOne(
							sourceDocument.segmentId
						)
						// We need to update the entire segment, because otherwise core also reorders the parts in some cases.
						if (segment && !segmentError) {
							await sendSegmentDiffToCore(segment, segment)
							return reorderedParts
						}
					} catch (error) {
						console.error(error)
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}
		} else if (operation.type === IpcOperationType.Delete) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { error } = await mutations.delete(operation.payload)

			if (!error && document && !Array.isArray(document) && !document.float) {
				const { result: rundown } = await rundownMutations.read({ id: document.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await coreHandler.core.coreMethods.dataPartDelete(
							document.rundownId,
							document.segmentId,
							document.id
						)
					} catch (error) {
						console.error(error)
						event.sender.send('error', stringifyError(error, true))
					}
				}
			}

			return error || true
		}
	})
}

export async function sendPartUpdateToCore(partId: string) {
	const { result } = await mutations.read({ id: partId })

	if (result && !Array.isArray(result) && !result.float) {
		const rd = await rundownMutations.read({ id: result.rundownId })
		if (rd.result && !Array.isArray(rd.result) && rd.result.sync === false) {
			return
		}
		const segment = await segmentsMutations.read({ id: result.segmentId })
		if (segment.result && !Array.isArray(segment.result) && segment.result.float === true) {
			return
		}

		await coreHandler.core.coreMethods.dataPartUpdate(
			result.rundownId,
			result.segmentId,
			await mutatePart(result)
		)
	}
}

export async function getMutatedPartsFromSegment(segmentId: string): Promise<MutatedPart[]> {
	const { result: parts } = await mutations.read({ segmentId })

	if (parts && Array.isArray(parts)) {
		return await Promise.all(parts.map(mutatePart))
	}

	return []
}
