import type { Rundown } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'
import { createAppAsyncThunk } from './app'

export interface NewRundownPayload {
	playlistId: string | null
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

const rundownsSlice = createSlice({
	name: 'rundowns',
	initialState: [] as Rundown[],
	reducers: {
		initRundowns: (_state, action: { type: string; payload: Rundown[] }) => {
			console.log('initRundowns', action)
			return action.payload
		}
		// newRundown: async (state, action: { type: string; payload: NewRundownPayload }) => {
		// 	const rundown = await ipcRenderer.invoke(
		// 		'rundowns',
		// 		literal<IpcOperation>({
		// 			type: IpcOperationType.Create,
		// 			payload: {
		// 				name: 'New rundown',
		// 				sync: false,
		// 				playlistId
		// 			}
		// 		})
		// 	)
		// 	commit('addRundown', rundown)

		// 	state.push(rundown)
		// }
		// addRundown: (state, action: { type: string; payload: Rundown }) => {
	},
	extraReducers(builder) {
		builder.addCase(addNewRundown.fulfilled, (state, action) => {
			state.push(action.payload)
		})
	}
})

// Export the auto-generated action creator with the same name
export const { initRundowns } = rundownsSlice.actions

export default rundownsSlice.reducer
