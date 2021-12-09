import { Playlist, IpcOperation, IpcOperationType } from '@/background/interfaces'
import { literal } from '@/util/lib'
import { ipcRenderer } from 'electron'
import Vue from 'vue'
import { Module } from 'vuex'
import { State } from '..'

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
			await ipcRenderer.invoke(
				'playlists',
				literal<IpcOperation>({
					type: IpcOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removePlaylist', id)
		},
		newPlaylist: async ({ commit }, { name }) => {
			const playlist = await ipcRenderer.invoke(
				'playlists',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: {
						name: name || 'New playlist'
					}
				})
			)
			commit('addPlaylist', playlist)
		},
		updatePlaylist: async ({ commit }, update) => {
			const playlist = await ipcRenderer.invoke(
				'playlists',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			console.log(playlist)
			commit('updatePlaylist', playlist)
		}
	}
})
