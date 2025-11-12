import type {
	MutationReorder,
	MutationSegmentCloneFromRundownToRundown,
	MutationSegmentCopy,
	MutationSegmentUpdate,
	Segment
} from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { ipcAPI } from '~/lib/IPC'
import { removeRundown } from './rundowns'
import { loadPieces } from './pieces'
import { loadParts } from './parts'

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
		return ipcAPI.addNewSegment({
			name: `Segment ${payload.rank + 1}`,
			playlistId: payload.playlistId,
			rundownId: payload.rundownId,
			rank: payload.rank,
			float: false,
			isTemplate: false
		})
	}
)
export const copySegment = createAppAsyncThunk(
	'segments/copySegment',
	async (payload: MutationSegmentCopy, { dispatch }) => {
		const segmentResult = await ipcAPI.copySegment(payload)

		dispatch(pushSegment(segmentResult))
		await dispatch(loadPieces({ rundownId: payload.rundownId }))
		await dispatch(loadParts({ rundownId: payload.rundownId }))

		return segmentResult
	}
)

export const cloneSegmentsFromRundownToRundown = createAppAsyncThunk(
	'segments/cloneSegmentsFromRundownToRundown',
	async (payload: MutationSegmentCloneFromRundownToRundown, { dispatch }) => {
		const result = await ipcAPI.cloneSegmentsFromRundownToRundown(payload)

		if (result.length) {
			dispatch(pushSegment(result))
		}

		await dispatch(loadParts({ rundownId: payload.toRundownId }))
		await dispatch(loadPieces({ rundownId: payload.toRundownId }))

		return result
	}
)
export const updateSegment = createAppAsyncThunk(
	'segments/updateSegment',
	async (payload: UpdateSegmentPayload) => {
		return ipcAPI.updateSegment(payload.segment)
	}
)
export const reorderSegments = createAppAsyncThunk(
	'segments/reorderSegments',
	async (payload: MutationReorder<MutationSegmentUpdate>) => {
		return ipcAPI.reorderSegments(payload)
	}
)
export const removeSegment = createAppAsyncThunk(
	'segments/removeSegment',
	async (payload: RemoveSegmentPayload) => {
		await ipcAPI.deleteSegment(payload.id)
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
		const segments = await ipcAPI.getSegments({ rundownId: payload.rundownId })
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
		pushSegment: (state, action: { type: string; payload: Segment | Segment[] }) => {
			const segments = Array.isArray(action.payload) ? action.payload : [action.payload]
			const merged = new Map(state.segments.map((s) => [s.id, s]))

			for (const newSegment of segments)
				merged.set(newSegment.id, { ...merged.get(newSegment.id), ...newSegment })

			state.segments = Array.from(merged.values())
		}
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
				state.rundownId = action.meta.arg.element.rundownId
				state.segments = state.segments.map((segment) => {
					const updated = action.payload.find((updatedSegment) => updatedSegment.id === segment.id)
					return updated ?? segment
				})
				state.error = null
			})
			.addCase(removeSegment.fulfilled, (state, action) => {
				const index = state.segments.findIndex((segment) => segment.id === action.payload.id)
				if (index !== -1) {
					state.segments.splice(index, 1)
				}
			})
			.addCase(removeRundown.fulfilled, (state, action) => {
				// Check if the rundown being removed is the one currently loaded in the segments slice
				if (state.rundownId === action.payload.id) {
					// Reset the state to initial values
					state.rundownId = null
					state.segments = []
					state.status = 'idle'
					state.error = null
				}
			})
	}
})

// Export the auto-generated action creator with the same name
// export const {} = segmentsSlice.actions

export const { pushSegment } = segmentsSlice.actions
export default segmentsSlice.reducer
