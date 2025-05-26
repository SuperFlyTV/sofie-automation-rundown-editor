import type { PiecesManifest, PieceTypeManifest } from '~backend/background/interfaces.js'
import { createSlice, nanoid } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'

export interface ImportPiecesManifestPayload {
	piecesManifest: PieceTypeManifest
}
export interface UpdatePiecesManifestPayload {
	originalId: string
	piecesManifest: PieceTypeManifest
}
export interface RemovePiecesManifestPayload {
	id: string
}

export const addNewPiecesManifest = createAppAsyncThunk(
	'piecesManifest/addNewPiecesManifest',
	async () => {
		return electronApi.addNewPieceManifest({
			id: nanoid(),
			name: 'New Piece Type',
			shortName: 'NPT',
			colour: '#000000',
			payload: []
		})
	}
)
export const importPiecesManifest = createAppAsyncThunk(
	'piecesManifest/importPiecesManifest',
	async (payload: ImportPiecesManifestPayload) => {
		return electronApi.addNewPieceManifest(payload.piecesManifest)
	}
)
export const updatePiecesManifest = createAppAsyncThunk(
	'piecesManifest/updatePiecesManifest',
	async (payload: UpdatePiecesManifestPayload) => {
		const newDoc = await electronApi.updatePiecesManifest(
			payload.originalId,
			payload.piecesManifest
		)
		return {
			newDoc,
			oldId: payload.originalId
		}
	}
)
export const removePiecesManifest = createAppAsyncThunk(
	'piecesManifest/removePiecesManifest',
	async (payload: RemovePiecesManifestPayload) => {
		await electronApi.removePiecesManifest(payload.id)
		return payload
	}
)

interface PiecesManifestState {
	manifest: PiecesManifest | null
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadPiecesManifest = createAppAsyncThunk(
	'piecesManifest/loadPiecesManifest',
	async () => {
		return electronApi.getPiecesManifest()
	}
)

const piecesManifestSlice = createSlice({
	name: 'piecesmanifest',
	initialState: {
		manifest: null,
		status: 'idle',
		error: null
	} as PiecesManifestState,
	reducers: {
		// initPiecesManifest: (_state, action: { type: string; payload: Setting[] }) => {
		// 	console.log('initPiecesManifest', action)
		// 	return action.payload
		// }
	},
	extraReducers(builder) {
		builder
			.addCase(loadPiecesManifest.pending, (state) => {
				state.status = 'pending'
				state.manifest = null
				state.error = null
			})
			.addCase(loadPiecesManifest.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.manifest = action.payload
				state.error = null
			})
			.addCase(loadPiecesManifest.rejected, (state, action) => {
				state.status = 'failed'
				state.manifest = null
				state.error = action.error.message ?? 'Unknown Error'
			})
			.addCase(importPiecesManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				state.manifest.push(action.payload)
			})
			.addCase(addNewPiecesManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				state.manifest.push(action.payload)
			})
			.addCase(updatePiecesManifest.fulfilled, (state, action) => {
				if (!state.manifest) throw new Error('Manifest is not loaded')

				let index = state.manifest.findIndex((setting) => setting.id === action.payload.newDoc.id)
				if (index === -1) {
					index = state.manifest.findIndex((setting) => setting.id === action.payload.oldId)
				}

				if (index !== -1) {
					state.manifest[index] = action.payload.newDoc
				}
			})
			.addCase(removePiecesManifest.fulfilled, (state, action) => {
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

export default piecesManifestSlice.reducer
