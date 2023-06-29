import { Playlist, RemoteOperation, RemoteOperationType } from '@/background/interfaces'
import { literal } from '@/util/lib'
import Vue from 'vue'
import { Module } from 'vuex'
import { State } from '..'
import { executeRemoteOp } from '../io'

export interface PlaylistsState {
	playlists: Playlist[]
}

export const PlaylistsModule = literal<Module<PlaylistsState, State>>({
	state: () => ({
		playlists: []
	}),
	mutations: {
		setPlaylists: (state, playlists) => {
			Vue.set(state, 'playlists', playlists)
		},
		removePlaylist: (state, id) => {
			console.log('mutate remove', id)
			for (let i = 0; i < state.playlists.length; i++) {
				if (state.playlists[i].id === id) {
					state.playlists.splice(i, 1)
				}
			}
		},
		addPlaylist: (state, playlist: Playlist) => {
			state.playlists.push(playlist)
		},
		updatePlaylist: (state, playlist) => {
			for (let i = 0; i < state.playlists.length; i++) {
				if (state.playlists[i].id === playlist.id) {
					// state.playlists.splice(i, 1, playlist)
					Vue.set(state.playlists, i, playlist)
				}
			}
		}
	},
	actions: {
		removePlaylist: async ({ commit }, id: string) => {
			await executeRemoteOp(
				'playlists',
				literal<RemoteOperation>({
					type: RemoteOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removePlaylist', id)
		},
		newPlaylist: async ({ commit }, { name }) => {
			const playlist = await executeRemoteOp(
				'playlists',
				literal<RemoteOperation>({
					type: RemoteOperationType.Create,
					payload: {
						name: name || 'New playlist'
					}
				})
			)
			commit('addPlaylist', playlist)
		},
		updatePlaylist: async ({ commit }, update) => {
			const playlist = await executeRemoteOp(
				'playlists',
				literal<RemoteOperation>({
					type: RemoteOperationType.Update,
					payload: update
				})
			)
			console.log(playlist)
			commit('updatePlaylist', playlist)
		}
	}
})
