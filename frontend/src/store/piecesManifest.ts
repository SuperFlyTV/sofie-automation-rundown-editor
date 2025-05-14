import type { PiecesManifest } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'

// export interface LoadPiecesManifestPayload {
// 	rundownId: string
// }
// export interface NewSettingPayload {
// 	playlistId: string | null // TODO - this should be handled by the server..
// 	rundownId: string
// 	segmentId: string
// 	rank: number
// }
// export interface UpdateSettingPayload {
// 	setting: Setting
// }
// export interface RemoveSettingPayload {
// 	id: string
// }

// export const addNewSetting = createAppAsyncThunk(
// 	'piecesmanifest/addNewSetting',
// 	async (payload: NewSettingPayload) => {
// 		return electronApi.addNewSetting({
// 			name: `Setting ${payload.rank + 1}`,
// 			playlistId: payload.playlistId,
// 			rundownId: payload.rundownId,
// 			segmentId: payload.segmentId,
// 			rank: payload.rank,
// 			float: false,
// 			payload: {}
// 		})
// 	}
// )
// export const updateSetting = createAppAsyncThunk(
// 	'piecesmanifest/updateSetting',
// 	async (payload: UpdateSettingPayload) => {
// 		return electronApi.updateSetting(payload.setting)
// 	}
// )
// export const removeSetting = createAppAsyncThunk(
// 	'piecesmanifest/removeSetting',
// 	async (payload: RemoveSettingPayload) => {
// 		await electronApi.deleteSetting(payload.id)
// 		return payload
// 	}
// )

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
		// .addCase(addNewSetting.fulfilled, (state, action) => {
		// 	state.piecesmanifest.push(action.payload)
		// })
		// .addCase(updateSetting.fulfilled, (state, action) => {
		// 	const index = state.piecesmanifest.findIndex((setting) => setting.id === action.payload.id)
		// 	if (index !== -1) {
		// 		state.piecesmanifest[index] = action.payload
		// 	}
		// })
		// .addCase(removeSetting.fulfilled, (state, action) => {
		// 	const index = state.piecesmanifest.findIndex((setting) => setting.id === action.payload.id)
		// 	if (index !== -1) {
		// 		state.piecesmanifest.splice(index, 1)
		// 	}
		// })
	}
})

// Export the auto-generated action creator with the same name
// export const {} = piecesmanifestSlice.actions

export default piecesManifestSlice.reducer
