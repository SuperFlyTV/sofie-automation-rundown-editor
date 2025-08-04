import type { Rundown, SerializedRundown } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { ipcAPI } from '~/lib/IPC'

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
		return ipcAPI.addNewRundown({
			name: 'New rundown',
			sync: false,
			playlistId: initialRundown.playlistId
		})
	}
)
export const updateRundown = createAppAsyncThunk(
	'rundowns/updateRundown',
	async (payload: UpdateRundownPayload) => {
		return ipcAPI.updateRundown(payload.rundown)
	}
)
export const removeRundown = createAppAsyncThunk(
	'rundowns/removeRundown',
	async (payload: RemoveRundownPayload) => {
		await ipcAPI.deleteRundown(payload.id)
		return payload
	}
)

export const importRundown = createAppAsyncThunk(
	'rundowns/importRundown',
	async (rundown: SerializedRundown) => {
		const createdRundown = await ipcAPI.addNewRundown(rundown.rundown)

		// Note: we don't need to update the stores, that will happen when opening the rundown
		await Promise.all(rundown.segments.map((segment) => ipcAPI.addNewSegment(segment)))
		await Promise.all(rundown.parts.map((part) => ipcAPI.addNewPart(part)))
		await Promise.all(rundown.pieces.map((piece) => ipcAPI.addNewPiece(piece)))

		return createdRundown
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
			.addCase(importRundown.fulfilled, (state, action) => {
				// This must be a new rundown
				state.push(action.payload)
			})
	}
})

// Export the auto-generated action creator with the same name
export const { initRundowns } = rundownsSlice.actions

export default rundownsSlice.reducer
