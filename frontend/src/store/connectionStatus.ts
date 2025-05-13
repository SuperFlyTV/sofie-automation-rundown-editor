import { CoreConnectionStatus, type CoreConnectionInfo } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'

const connectionStatusSlice = createSlice({
	name: 'coreConnectionStatus',
	initialState: {
		status: CoreConnectionStatus.DISCONNECTED
	} as CoreConnectionInfo,
	reducers: {
		updateConnectionStatus: (state, action: { type: string; payload: CoreConnectionInfo }) => {
			console.log('updateConnectionStatus', action)
			state.status = action.payload.status
			state.url = action.payload.url
			state.port = action.payload.port
		}
	}
})

// Export the auto-generated action creator with the same name
export const { updateConnectionStatus } = connectionStatusSlice.actions

export default connectionStatusSlice.reducer
