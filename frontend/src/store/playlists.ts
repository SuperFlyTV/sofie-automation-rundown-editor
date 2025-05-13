import type { Playlist } from '~backend/background/interfaces.js'
import { createSlice } from '@reduxjs/toolkit'

const playlistsSlice = createSlice({
	name: 'playlists',
	initialState: [] as Playlist[],
	reducers: {
		initPlaylists: (_state, action: { type: string; payload: Playlist[] }) => {
			console.log('initPlaylists', action)
			return action.payload
		}
		// addPlaylist: (state, action: { type: string; payload: Playlist }) => {
	}
})

// Export the auto-generated action creator with the same name
export const { initPlaylists } = playlistsSlice.actions

export default playlistsSlice.reducer
