import type { Rundown } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'

export interface NewRundownPayload {
	playlistId: string | null
}
export interface UpdateRundownPayload {
	rundown: Rundown
}
export interface RemoveRundownPayload {
	id: string
}

export const addNewRundown = createAppAsyncThunk(
	'rundowns/addNewRundown',
	async (initialRundown: NewRundownPayload) => {
		return electronApi.addNewRundown({
			name: 'New rundown',
			sync: false,
			playlistId: initialRundown.playlistId
		})
	}
)
export const updateRundown = createAppAsyncThunk(
	'rundowns/updateRundown',
	async (payload: UpdateRundownPayload) => {
		return electronApi.updateRundown(payload.rundown)
	}
)
export const removeRundown = createAppAsyncThunk(
	'rundowns/removeRundown',
	async (payload: RemoveRundownPayload) => {
		await electronApi.deleteRundown(payload.id)
		return payload
	}
)

const rundownsSlice = createSlice({
	name: 'rundowns',
	initialState: [] as Rundown[],
	reducers: {
		initRundowns: (_state, action: { type: string; payload: Rundown[] }) => {
			console.log('initRundowns', action)
			return action.payload
		}
	},
	extraReducers(builder) {
		builder
			.addCase(addNewRundown.fulfilled, (state, action) => {
				state.push(action.payload)
			})
			.addCase(updateRundown.fulfilled, (state, action) => {
				const index = state.findIndex((rundown) => rundown.id === action.payload.id)
				if (index !== -1) {
					state[index] = action.payload
				}
			})
			.addCase(removeRundown.fulfilled, (state, action) => {
				const index = state.findIndex((rundown) => rundown.id === action.payload.id)
				if (index !== -1) {
					state.splice(index, 1)
				}
			})
	}
})

// Export the auto-generated action creator with the same name
export const { initRundowns } = rundownsSlice.actions

export default rundownsSlice.reducer
