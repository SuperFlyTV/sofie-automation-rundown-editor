import type { Rundown, SerializedRundown } from '~backend/background/interfaces.js'
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

export const importRundown = createAppAsyncThunk(
	'rundowns/importRundown',
	async (rundown: SerializedRundown) => {
		const createdRundown = await electronApi.addNewRundown(rundown.rundown)

		// Note: we don't need to update the stores, that will happen when opening the rundown
		await Promise.all(rundown.segments.map((segment) => electronApi.addNewSegment(segment)))
		await Promise.all(rundown.parts.map((part) => electronApi.addNewPart(part)))
		await Promise.all(rundown.pieces.map((piece) => electronApi.addNewPiece(piece)))

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
