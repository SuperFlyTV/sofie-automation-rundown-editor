import { configureStore } from '@reduxjs/toolkit'
import type { Action } from '@reduxjs/toolkit'
import connectionStatusReducer from './connectionStatus.js'
import playlistsReducer from './playlists.js'
import rundownsReducer from './rundowns.js'
import segmentsReducer from './segments.js'

interface CounterState {
	value: number
}

// An example slice reducer function that shows how a Redux reducer works inside.
// We'll replace this soon with real app logic.
function counterReducer(state: CounterState = { value: 0 }, action: Action) {
	switch (action.type) {
		// Handle actions here
		default: {
			return state
		}
	}
}

export const store = configureStore({
	reducer: {
		counter: counterReducer,
		playlists: playlistsReducer,
		rundowns: rundownsReducer,
		segments: segmentsReducer,
		coreConnectionStatus: connectionStatusReducer
	}
})
