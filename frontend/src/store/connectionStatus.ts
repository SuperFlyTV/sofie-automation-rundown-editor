import { CoreConnectionStatus, type CoreConnectionInfo } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'

/** Must match the 'Default 25' text in the backend config manifest (configManifest.ts). */
export const DEFAULT_FRAME_RATE = 25

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
			state.frameRate = action.payload.frameRate
		}
	}
})

/** Core's frame rate for this device, or DEFAULT_FRAME_RATE if unset. The backend already drops invalid values. */
export const selectFrameRate = (state: { coreConnectionStatus: CoreConnectionInfo }): number => {
	return state.coreConnectionStatus.frameRate ?? DEFAULT_FRAME_RATE
}

// Export the auto-generated action creator with the same name
export const { updateConnectionStatus } = connectionStatusSlice.actions

export default connectionStatusSlice.reducer
