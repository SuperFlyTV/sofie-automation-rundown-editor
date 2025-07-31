import type { ApplicationSettings } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { ipcAPI } from '~/lib/IPC'

// export interface LoadSettingsPayload {
// 	rundownId: string
// }
// export interface NewSettingPayload {
// 	playlistId: string | null // TODO - this should be handled by the server..
// 	rundownId: string
// 	segmentId: string
// 	rank: number
// }
export interface UpdateSettingsPayload {
	settings: ApplicationSettings
}
// export interface RemoveSettingPayload {
// 	id: string
// }

// export const addNewSetting = createAppAsyncThunk(
// 	'settings/addNewSetting',
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
export const updateSettings = createAppAsyncThunk(
	'settings/updateSettings',
	async (payload: UpdateSettingsPayload) => {
		return ipcAPI.updateSettings(payload.settings)
	}
)
// export const removeSetting = createAppAsyncThunk(
// 	'settings/removeSetting',
// 	async (payload: RemoveSettingPayload) => {
// 		await electronApi.deleteSetting(payload.id)
// 		return payload
// 	}
// )

interface SettingsState {
	settings: ApplicationSettings | null
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadSettings = createAppAsyncThunk('settings/loadSettings', async () => {
	return ipcAPI.getSettings()
})

const settingsSlice = createSlice({
	name: 'settings',
	initialState: {
		settings: null,
		status: 'idle',
		error: null
	} as SettingsState,
	reducers: {
		// initSettings: (_state, action: { type: string; payload: Setting[] }) => {
		// 	console.log('initSettings', action)
		// 	return action.payload
		// }
	},
	extraReducers(builder) {
		builder
			.addCase(loadSettings.pending, (state) => {
				state.status = 'pending'
				state.settings = null
				state.error = null
			})
			.addCase(loadSettings.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.settings = action.payload
				state.error = null
			})
			.addCase(loadSettings.rejected, (state, action) => {
				state.status = 'failed'
				state.settings = null
				state.error = action.error.message ?? 'Unknown Error'
			})
			// .addCase(addNewSetting.fulfilled, (state, action) => {
			// 	state.settings.push(action.payload)
			// })
			.addCase(updateSettings.fulfilled, (state, action) => {
				state.settings = action.payload
			})
		// .addCase(removeSetting.fulfilled, (state, action) => {
		// 	const index = state.settings.findIndex((setting) => setting.id === action.payload.id)
		// 	if (index !== -1) {
		// 		state.settings.splice(index, 1)
		// 	}
		// })
	}
})

// Export the auto-generated action creator with the same name
// export const {} = settingsSlice.actions

export default settingsSlice.reducer
