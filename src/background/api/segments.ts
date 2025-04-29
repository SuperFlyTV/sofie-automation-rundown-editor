import { BrowserWindow, ipcMain } from 'electron'
import {
	DBSegment,
	IpcOperation,
	IpcOperationType,
	MutationSegmentCreate,
	MutationSegmentDelete,
	MutationSegmentRead,
	MutationSegmentUpdate,
	MutatedSegment,
	Segment
} from '../interfaces'
import { db, InsertResolution, UpdateResolution } from '../db'
import { v4 as uuid } from 'uuid'
import { coreHandler } from '../coreHandler'
import { getMutatedPartsFromSegment } from './parts'
import { mutations as rundownMutations } from './rundowns'
import { PeripheralDeviceAPIMethods } from '@sofie-automation/shared-lib/dist/peripheralDevice/methodsAPI'
import { stringifyError } from '../util'

async function mutateSegment(segment: Segment): Promise<MutatedSegment> {
	return {
		externalId: segment.id,
		name: segment.name,
		rank: segment.rank,
		payload: {
			name: segment.name,
			rank: segment.rank
		},
		parts: await getMutatedPartsFromSegment(segment.id)
	}
}

async function sendSegmentDiffToCore(oldSegment: Segment, newSegment: Segment) {
	const rd = await rundownMutations.read({ id: newSegment.rundownId })
	if (rd.result && !Array.isArray(rd.result) && rd.result.sync === false) {
		return
	}

	if (oldSegment.float && !newSegment.float) {
		await coreHandler.core.callMethodLowPrioRaw(PeripheralDeviceAPIMethods.dataSegmentCreate, [
			newSegment.rundownId,
			await mutateSegment(newSegment)
		])
	} else if (!oldSegment.float && newSegment.float) {
		await coreHandler.core.callMethodLowPrioRaw(PeripheralDeviceAPIMethods.dataSegmentDelete, [
			newSegment.rundownId,
			newSegment.id
		])
	} else if (!oldSegment.float && !newSegment.float) {
		await coreHandler.core.callMethodLowPrioRaw(PeripheralDeviceAPIMethods.dataSegmentUpdate, [
			newSegment.rundownId,
			await mutateSegment(newSegment)
		])
	}
}

export const mutations = {
	async create(payload: MutationSegmentCreate): Promise<{ result?: Segment; error?: Error }> {
		const id = payload.id || uuid()
		const document: Partial<MutationSegmentCreate> = {
			...payload
		}
		delete document.playlistId
		delete document.rundownId

		if (!payload.rundownId)
			return {
				error: new Error('Missing rundownId')
			}

		const { result, error } = await new Promise<InsertResolution>((resolve) =>
			db.run(
				`
			INSERT INTO segments (id,playlistId,rundownId,document)
			VALUES (?,?,?,json(?));
		`,
				[id, payload.playlistId || null, payload.rundownId, JSON.stringify(document)],
				function (e: Error | null) {
					if (e) {
						resolve({ result: undefined, error: e })
					} else if (this) {
						resolve({ result: this.lastID, error: undefined })
					}
				}
			)
		)

		if (result) {
			const document = await new Promise<DBSegment>((resolve, reject) =>
				db.get(
					`
				SELECT *
				FROM segments
				WHERE id = ?
				LIMIT 1;
			`,
					[id],
					(e, r) => {
						if (e) {
							reject(e)
						} else {
							resolve(r)
						}
					}
				)
			)

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					playlistId: document.playlistId,
					rundownId: document.rundownId
				}
			}
		}

		return { error }
	},
	async read(
		payload: Partial<MutationSegmentRead>
	): Promise<{ result?: Segment | Segment[]; error?: Error }> {
		if (payload && payload.id) {
			const document = await new Promise<DBSegment>((resolve, reject) =>
				db.get(
					`
				SELECT *
				FROM segments
				WHERE id = ?
				LIMIT 1;
			`,
					[payload.id],
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return {
				result: {
					...JSON.parse(document.document),
					id: document.id,
					rundownId: document.rundownId,
					playlistId: document.playlistId
				}
			}
		} else if (payload && payload.rundownId) {
			const documents = await new Promise<DBSegment[]>((resolve, reject) =>
				db.all(
					`
				SELECT *
				FROM segments
				WHERE rundownId = ?
			`,
					[payload.rundownId],
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return {
				result: documents.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					rundownId: d.rundownId,
					playlistId: d.playlistId
				}))
			}
		} else {
			const documents = await new Promise<DBSegment[]>((resolve, reject) =>
				db.all(
					`
				SELECT *
				FROM segments
			`,
					(e, r) => (e ? reject(e) : resolve(r))
				)
			)

			return {
				result: documents.map((d) => ({
					...JSON.parse(d.document),
					id: d.id,
					rundownId: d.rundownId,
					playlistId: d.playlistId
				}))
			}
		}
	},
	async update(payload: MutationSegmentUpdate): Promise<{ result?: Segment; error?: Error }> {
		const update = {
			...payload,
			id: null,
			playlistId: null,
			rundownId: null
		}
		const { result, error } = await new Promise<UpdateResolution>((resolve) =>
			db.run(
				`
			UPDATE segments
			SET playlistId = ?, document = (SELECT json_patch(segments.document, json(?)) FROM segments WHERE id = ?)
			WHERE id = "${payload.id}";
		`,
				[payload.playlistId || null, JSON.stringify(update), payload.id],
				(e) =>
					e ? resolve({ error: e, result: undefined }) : resolve({ result: true, error: undefined })
			)
		)

		if (result) {
			const document = await new Promise<DBSegment>((resolve, reject) =>
				db.get(
					`
				SELECT *
				FROM segments
				WHERE id = ?
				LIMIT 1;
			`,
					[payload.id],
					(e, r) => {
						if (e) {
							reject(e)
						} else {
							resolve(r)
						}
					}
				)
			)

			return {
				result: {
					...JSON.parse(document.document),
					id: payload.id,
					rundownId: document.rundownId,
					playlistId: document.playlistId
				}
			}
		}

		return {
			error
		}
	},
	async delete(payload: MutationSegmentDelete): Promise<{ error?: Error }> {
		return new Promise((resolve) =>
			db.exec(
				`
			BEGIN TRANSACTION;
			DELETE FROM segments
			WHERE id = "${payload.id}";
			DELETE FROM parts
			WHERE segmentId = "${payload.id}";
			DELETE FROM pieces
			WHERE segmentId = "${payload.id}";
			COMMIT;
		`,
				(error: Error | null) => resolve({ error: error || undefined })
			)
		)
	}
}

export async function init(window: BrowserWindow): Promise<void> {
	ipcMain.handle('segments', async (_, operation: IpcOperation) => {
		if (operation.type === IpcOperationType.Create) {
			const { result, error } = await mutations.create(operation.payload)

			if (result && !result.float) {
				const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await coreHandler.core.callMethodLowPrioRaw(PeripheralDeviceAPIMethods.dataSegmentCreate, [
							result.rundownId,
							await mutateSegment(result)
						])
					} catch (error) {
						console.error(error)
						window.webContents.send('error', stringifyError(error, true))
					}
				}
			}

			return result || error
		} else if (operation.type === IpcOperationType.Read) {
			const { result, error } = await mutations.read(operation.payload)

			return result || error
		} else if (operation.type === IpcOperationType.Update) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { result, error } = await mutations.update(operation.payload)

			if (document && 'id' in document && result) {
				const { result: rundown } = await rundownMutations.read({ id: result.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await sendSegmentDiffToCore(document, result)
					} catch (error) {
						console.error(error)
						window.webContents.send('error', stringifyError(error, true))
					}
				}
			}

			return result || error
		} else if (operation.type === IpcOperationType.Delete) {
			const { result: document } = await mutations.read({ id: operation.payload.id })
			const { error } = await mutations.delete(operation.payload)

			if (document && 'id' in document) {
				const { result: rundown } = await rundownMutations.read({ id: document.rundownId })
				if (rundown && !Array.isArray(rundown) && rundown.sync) {
					try {
						await coreHandler.core.callMethodLowPrioRaw(PeripheralDeviceAPIMethods.dataSegmentDelete, [
							document.rundownId,
							document.id
						])
					} catch (error) {
						console.error(error)
						window.webContents.send('error', stringifyError(error, true))
					}
				}
			}

			return error || true
		}
	})
}

export async function getMutatedSegmentsFromRundown(rundownId: string): Promise<MutatedSegment[]> {
	const { result: segments } = await mutations.read({ rundownId })

	if (segments && Array.isArray(segments)) {
		return await Promise.all(segments.map(mutateSegment))
	}

	return []
}
