import type { Segment } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'
import { ipcAPI } from '~/lib/IPC'

interface TemplateSegmentsState {
	templates: Segment[]
	status: 'idle' | 'pending' | 'succeeded' | 'failed'
	error: string | null
}

export const loadTemplateSegments = createAppAsyncThunk(
	'templateSegments/loadTemplateSegments',
	async () => ipcAPI.getSegments({ isTemplate: true })
)

const templateSegmentsSlice = createSlice({
	name: 'templateSegments',
	initialState: {
		templates: [],
		status: 'idle',
		error: null
	} as TemplateSegmentsState,
	reducers: {
		pushTemplateSegment: (state, action: { type: string; payload: Segment | Segment[] }) => {
			const templates = Array.isArray(action.payload) ? action.payload : [action.payload]
			const merged = new Map(state.templates.map((s) => [s.id, s]))
			for (const newTemplate of templates)
				merged.set(newTemplate.id, { ...merged.get(newTemplate.id), ...newTemplate })
			state.templates = Array.from(merged.values())
		}
	},
	extraReducers(builder) {
		builder
			.addCase(loadTemplateSegments.pending, (state) => {
				state.status = 'pending'
			})
			.addCase(loadTemplateSegments.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.templates = action.payload
			})
			.addCase(loadTemplateSegments.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message ?? 'Unknown error'
			})
	}
})

export const { pushTemplateSegment } = templateSegmentsSlice.actions
export default templateSegmentsSlice.reducer
