import type { Segment } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'

export interface LoadSegmentsPayload {
	rundownId: string
}
export interface NewSegmentPayload {
	playlistId: string | null // TODO - this should be handled by the server..
	rundownId: string
	rank: number
}
export interface UpdateSegmentPayload {
	segment: Segment
}
export interface RemoveSegmentPayload {
	id: string
}

export const addNewSegment = createAppAsyncThunk(
	'segments/addNewSegment',
	async (payload: NewSegmentPayload) => {
		return electronApi.addNewSegment({
			name: `Segment ${payload.rank + 1}`,
			playlistId: payload.playlistId,
			rundownId: payload.rundownId,
			rank: payload.rank,
			float: false
		})
	}
)
export const updateSegment = createAppAsyncThunk(
	'segments/updateSegment',
	async (payload: UpdateSegmentPayload) => {
		return electronApi.updateSegment(payload.segment)
	}
)
export const reorderSegments = createAppAsyncThunk(
	'parts/reorderSegments',
	async ({ segment, targetIndex }: { segment: Segment; targetIndex: number }) => {
		return electronApi.reorderSegments(segment, targetIndex)
	}
)
export const removeSegment = createAppAsyncThunk(
	'segments/removeSegment',
	async (payload: RemoveSegmentPayload) => {
		await electronApi.deleteSegment(payload.id)
		return payload
	}
)

interface SegmentsState {
	rundownId: string | null
	segments: Segment[]
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadSegments = createAppAsyncThunk(
	'segments/loadSegments',
	async (payload: LoadSegmentsPayload) => {
		const segments = await electronApi.getSegments(payload.rundownId)
		return {
			rundownId: payload.rundownId,
			segments
		}
	}
)

const segmentsSlice = createSlice({
	name: 'segments',
	initialState: {
		rundownId: null,
		segments: [],
		status: 'idle',
		error: null
	} as SegmentsState,
	reducers: {
		// initSegments: (_state, action: { type: string; payload: Segment[] }) => {
		// 	console.log('initSegments', action)
		// 	return action.payload
		// }
	},
	extraReducers(builder) {
		builder
			.addCase(loadSegments.pending, (state) => {
				state.status = 'pending'
				state.rundownId = null
				state.segments = []
				state.error = null
			})
			.addCase(loadSegments.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.rundownId = action.payload.rundownId
				state.segments = action.payload.segments
				state.error = null
			})
			.addCase(loadSegments.rejected, (state, action) => {
				state.status = 'failed'
				state.rundownId = null
				state.segments = []
				state.error = action.error.message ?? 'Unknown Error'
			})
			.addCase(addNewSegment.fulfilled, (state, action) => {
				state.segments.push(action.payload)
			})
			.addCase(updateSegment.fulfilled, (state, action) => {
				const index = state.segments.findIndex((segment) => segment.id === action.payload.id)
				if (index !== -1) {
					state.segments[index] = action.payload
				}
			})
			.addCase(reorderSegments.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.rundownId = action.meta.arg.segment.rundownId
				state.segments = action.payload
				state.error = null
			})
			.addCase(removeSegment.fulfilled, (state, action) => {
				const index = state.segments.findIndex((segment) => segment.id === action.payload.id)
				if (index !== -1) {
					state.segments.splice(index, 1)
				}
			})
	}
})

// Export the auto-generated action creator with the same name
// export const {} = segmentsSlice.actions

export default segmentsSlice.reducer
