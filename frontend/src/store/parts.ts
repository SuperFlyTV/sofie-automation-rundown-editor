import type { Part } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'

export interface LoadPartsPayload {
	rundownId: string
}
export interface NewPartPayload {
	playlistId: string | null // TODO - this should be handled by the server..
	rundownId: string
	segmentId: string
	rank: number
}
// export interface UpdatePartPayload {
// 	part: Part
// }
// export interface RemovePartPayload {
// 	id: string
// }

export const addNewPart = createAppAsyncThunk(
	'parts/addNewPart',
	async (payload: NewPartPayload) => {
		return electronApi.addNewPart({
			name: `Part ${payload.rank + 1}`,
			playlistId: payload.playlistId,
			rundownId: payload.rundownId,
			segmentId: payload.segmentId,
			rank: payload.rank,
			float: false,
			payload: {}
		})
	}
)
// export const updatePart = createAppAsyncThunk(
// 	'parts/updatePart',
// 	async (payload: UpdatePartPayload) => {
// 		return electronApi.updatePart(payload.part)
// 	}
// )
// export const removePart = createAppAsyncThunk(
// 	'parts/removePart',
// 	async (payload: RemovePartPayload) => {
// 		await electronApi.deletePart(payload.id)
// 		return payload
// 	}
// )

interface PartsState {
	rundownId: string | null
	parts: Part[]
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadParts = createAppAsyncThunk(
	'parts/loadParts',
	async (payload: LoadPartsPayload) => {
		const parts = await electronApi.getParts(payload.rundownId)
		return {
			rundownId: payload.rundownId,
			parts
		}
	}
)

const partsSlice = createSlice({
	name: 'parts',
	initialState: {
		rundownId: null,
		parts: [],
		status: 'idle',
		error: null
	} as PartsState,
	reducers: {
		// initParts: (_state, action: { type: string; payload: Part[] }) => {
		// 	console.log('initParts', action)
		// 	return action.payload
		// }
	},
	extraReducers(builder) {
		builder
			.addCase(loadParts.pending, (state) => {
				state.status = 'pending'
				state.rundownId = null
				state.parts = []
				state.error = null
			})
			.addCase(loadParts.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.rundownId = action.payload.rundownId
				state.parts = action.payload.parts
				state.error = null
			})
			.addCase(loadParts.rejected, (state, action) => {
				state.status = 'failed'
				state.rundownId = null
				state.parts = []
				state.error = action.error.message ?? 'Unknown Error'
			})
			.addCase(addNewPart.fulfilled, (state, action) => {
				state.parts.push(action.payload)
			})
		// 	.addCase(updatePart.fulfilled, (state, action) => {
		// 		const index = state.findIndex((part) => part.id === action.payload.id)
		// 		if (index !== -1) {
		// 			state[index] = action.payload
		// 		}
		// 	})
		// 	.addCase(removePart.fulfilled, (state, action) => {
		// 		const index = state.findIndex((part) => part.id === action.payload.id)
		// 		if (index !== -1) {
		// 			state.splice(index, 1)
		// 		}
		// 	})
	}
})

// Export the auto-generated action creator with the same name
export const {} = partsSlice.actions

export default partsSlice.reducer
