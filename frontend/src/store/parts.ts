import type {
	MutationPartCopy,
	MutationPartMove,
	MutationPartUpdate,
	MutationReorder,
	Part
} from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { loadPieces } from './pieces'
import { ipcAPI } from '~/lib/IPC'
import { removeRundown } from './rundowns'

export interface LoadPartsPayload {
	rundownId: string
}
export interface NewPartPayload {
	playlistId: string | null // TODO - this should be handled by the server..
	rundownId: string
	segmentId: string
	name?: string
	rank?: number
	payload?: {
		script?: string
		type?: string
		duration?: number
	}
}
export interface UpdatePartPayload {
	part: Part
}
export interface RemovePartPayload {
	id: string
}

export const addNewPart = createAppAsyncThunk(
	'parts/addNewPart',
	async (payload: NewPartPayload) => {
		const rank: number = payload.rank ?? 0
		return ipcAPI.addNewPart({
			name: payload.name ?? `Part ${rank + 1}`,
			playlistId: payload.playlistId,
			rundownId: payload.rundownId,
			segmentId: payload.segmentId,
			rank: payload.rank,
			float: false,
			payload: payload.payload ?? {}
		})
	}
)
export const copyPart = createAppAsyncThunk(
	'pieces/copyPart',
	async (payload: MutationPartCopy, { dispatch }) => {
		const partResult = await ipcAPI.copyPart(payload)
		dispatch(pushPart(partResult))
		await dispatch(loadPieces({ rundownId: payload.rundownId }))

		return partResult
	}
)
export const movePart = createAppAsyncThunk(
	'parts/movePart',
	async (payload: MutationPartMove, { dispatch }) => {
		const partResult = await ipcAPI.movePart(payload)

		//update parts and pieces
		await dispatch(loadParts({ rundownId: payload.sourcePart.rundownId }))
		await dispatch(loadPieces({ rundownId: payload.sourcePart.rundownId }))

		return partResult
	}
)
export const updatePart = createAppAsyncThunk(
	'parts/updatePart',
	async (payload: UpdatePartPayload) => {
		return ipcAPI.updatePart(payload.part)
	}
)
export const reorderParts = createAppAsyncThunk(
	'parts/reorderParts',
	async (payload: MutationReorder<MutationPartUpdate>) => {
		return ipcAPI.reorderParts(payload)
	}
)
export const removePart = createAppAsyncThunk(
	'parts/removePart',
	async (payload: RemovePartPayload) => {
		await ipcAPI.deletePart(payload.id)
		return payload
	}
)

interface PartsState {
	rundownId: string | null
	parts: Part[]
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadParts = createAppAsyncThunk(
	'parts/loadParts',
	async (payload: LoadPartsPayload) => {
		const parts = await ipcAPI.getParts(payload.rundownId)
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
		pushPart: (state, action: { type: string; payload: Part | Part[] }) => {
			const parts = Array.isArray(action.payload) ? action.payload : [action.payload]
			const merged = new Map(state.parts.map((p) => [p.id, p]))

			for (const newPart of parts) merged.set(newPart.id, { ...merged.get(newPart.id), ...newPart })

			state.parts = Array.from(merged.values())
		}
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
			.addCase(updatePart.fulfilled, (state, action) => {
				const index = state.parts.findIndex((part) => part.id === action.payload.id)
				if (index !== -1) {
					state.parts[index] = action.payload
				}
			})
			.addCase(reorderParts.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.rundownId = action.meta.arg.element.rundownId
				state.parts = state.parts.map(
					(part) => action.payload.find((newPart) => newPart.id === part.id) ?? part
				)
				state.error = null
			})
			.addCase(removePart.fulfilled, (state, action) => {
				const index = state.parts.findIndex((part) => part.id === action.payload.id)
				if (index !== -1) {
					state.parts.splice(index, 1)
				}
			})
			.addCase(removeRundown.fulfilled, (state, action) => {
				// Check if the rundown being removed is the one currently loaded in the parts slice
				if (state.rundownId === action.payload.id) {
					// Reset the state to initial values
					state.rundownId = null
					state.parts = []
					state.status = 'idle'
					state.error = null
				}
			})
	}
})

// Export the auto-generated action creator with the same name
// export const {} = partsSlice.actions

export const { pushPart } = partsSlice.actions
export default partsSlice.reducer
