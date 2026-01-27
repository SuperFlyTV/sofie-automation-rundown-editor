import type { TypeManifest, TypeManifestEntity } from '~backend/background/interfaces.js'
import { createSlice, nanoid } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { ipcAPI } from '~/lib/IPC'

export interface ImportTypeManifestPayload {
	piecesManifest: TypeManifest
}
export interface UpdateTypeManifestPayload {
	originalId: string
	piecesManifest: TypeManifest
}
export interface RemoveTypeManifestPayload {
	id: string
}

export const addNewTypeManifest = createAppAsyncThunk(
	'typeManifest/addNewTypeManifest',
	async (entityType: TypeManifestEntity) => {
		return ipcAPI.addNewTypeManifest({
			id: nanoid(),
			name: 'New Piece Type',
			shortName: 'NPT',
			colour: '#000000',
			payload: [],
			entityType
		})
	}
)
export const importTypeManifest = createAppAsyncThunk(
	'typeManifest/importTypesManifest',
	async (payload: ImportTypeManifestPayload) => {
		return ipcAPI.addNewTypeManifest(payload.piecesManifest)
	}
)
export const updateTypeManifest = createAppAsyncThunk(
	'typeManifest/updateTypeManifest',
	async (payload: UpdateTypeManifestPayload) => {
		const newDoc = await ipcAPI.updateTypeManifest(payload.originalId, payload.piecesManifest)
		return {
			newDoc,
			oldId: payload.originalId
		}
	}
)
export const removeTypeManifest = createAppAsyncThunk(
	'typeManifest/removeTypeManifest',
	async (payload: RemoveTypeManifestPayload) => {
		await ipcAPI.removeTypeManifest(payload.id)
		return payload
	}
)

interface TypeManifestState {
	manifest: TypeManifest[] | null
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadTypeManifest = createAppAsyncThunk('piecesManifest/loadTypeManifest', async () => {
	return ipcAPI.getTypeManifests()
})

const typeManifestSlice = createSlice({
	name: 'typemanifest',
	initialState: {
		manifest: null,
		status: 'idle',
		error: null
	} as TypeManifestState,
	reducers: {
		// initPiecesManifest: (_state, action: { type: string; payload: Setting[] }) => {
		// 	console.log('initPiecesManifest', action)
		// 	return action.payload
		// }
	},
	extraReducers(builder) {
		builder
			.addCase(loadTypeManifest.pending, (state) => {
				state.status = 'pending'
				state.manifest = null
				state.error = null
			})
			.addCase(loadTypeManifest.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.manifest = action.payload
				state.error = null
			})
			.addCase(loadTypeManifest.rejected, (state, action) => {
				state.status = 'failed'
				state.manifest = null
				state.error = action.error.message ?? 'Unknown Error'
			})
			.addCase(importTypeManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				state.manifest.push(action.payload)
			})
			.addCase(addNewTypeManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				state.manifest.push(action.payload)
			})
			.addCase(updateTypeManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				let index = state.manifest.findIndex((setting) => setting.id === action.payload.newDoc.id)
				if (index === -1) {
					index = state.manifest.findIndex((setting) => setting.id === action.payload.oldId)
				}

				if (index !== -1) {
					state.manifest[index] = action.payload.newDoc
				}
			})
			.addCase(removeTypeManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				const index = state.manifest.findIndex((setting) => setting.id === action.payload.id)
				if (index !== -1) {
					state.manifest.splice(index, 1)
				}
			})
	}
})

// Export the auto-generated action creator with the same name
// export const {} = piecesmanifestSlice.actions

export default typeManifestSlice.reducer
