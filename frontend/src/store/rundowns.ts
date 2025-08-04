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
		const createdRundown = await ipcAPI.addNewRundown({ ...rundown.rundown, sync: false })

		// Note: we don't need to update the stores, that will happen when opening the rundown

		// We need to override the ranks, because for the reordering function to work correctly ranks should be the index of the segment/part
		const orderedSegments = [...rundown.segments].sort((a, b) => a.rank - b.rank)
		await Promise.all(
			orderedSegments.map((segment, index) => ipcAPI.addNewSegment({ ...segment, rank: index }))
		)

		// Group parts by segmentId
		const partsGroupedBySegment: Record<string, typeof rundown.parts> = {}
		for (const part of rundown.parts) {
			if (!partsGroupedBySegment[part.segmentId]) {
				partsGroupedBySegment[part.segmentId] = []
			}
			partsGroupedBySegment[part.segmentId].push(part)
		}

		// override part.rank based on index
		const orderedParts: typeof rundown.parts = []

		for (const segment of orderedSegments) {
			const parts = partsGroupedBySegment[segment.id]
			if (parts) {
				const sortedParts = parts
					.sort((a, b) => a.rank - b.rank) // Sort current segment's parts by original rank
					.map((part, index) => ({
						...part,
						rank: index // Override rank with index
					}))
				orderedParts.push(...sortedParts)
			}
		}

		await Promise.all(orderedParts.map((part) => ipcAPI.addNewPart(part)))
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
