import {
	IpcOperation,
	IpcOperationType,
	Part,
	Piece,
	PiecesManifest,
	PieceTypeManifest,
	Playlist,
	Rundown,
	Segment,
	ApplicationSettings,
	CoreConnectionStatus,
	CoreConnectionInfo
} from '@/background/interfaces'
import { literal } from '@/util/lib'
import Vue from 'vue'
import Vuex from 'vuex'

const { ipcRenderer } = window

Vue.use(Vuex)

export interface State {
	playlists: Playlist[]
	rundowns: Rundown[]
	segments: Segment[]
	parts: Part[]
	pieces: Piece[]
	piecesManifest: PiecesManifest
	settings: ApplicationSettings
	coreConnectionInfo: CoreConnectionInfo
}

export enum Actions {}

const store = new Vuex.Store<State>({
	state: {
		playlists: [],
		rundowns: [],
		segments: [],
		parts: [],
		pieces: [],
		piecesManifest: [],
		settings: {
			partTypes: [],
			rundownMetadata: []
		},
		coreConnectionInfo: {
			status: CoreConnectionStatus.DISCONNECTED
		}
	},
	mutations: {
		setPlaylists: (state, playlists) => {
			Vue.set(state, 'playlists', playlists)
		},
		removePlaylist: (state, id) => {
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
		},

		setRundowns: (state, rundowns) => {
			Vue.set(state, 'rundowns', rundowns)
		},
		removeRundown: (state, id) => {
			for (let i = 0; i < state.rundowns.length; i++) {
				if (state.rundowns[i].id === id) {
					state.rundowns.splice(i, 1)
				}
			}
		},
		addRundown: (state, rundown: Rundown) => {
			state.rundowns.push(rundown)
		},
		updateRundown: (state, rundown) => {
			for (let i = 0; i < state.rundowns.length; i++) {
				if (state.rundowns[i].id === rundown.id) {
					// state.playlists.splice(i, 1, playlist)
					Vue.set(state.rundowns, i, rundown)
				}
			}
		},

		setSegments: (state, segments) => {
			Vue.set(state, 'segments', segments)
		},
		removeSegment: (state, id) => {
			for (let i = 0; i < state.segments.length; i++) {
				if (state.segments[i].id === id) {
					state.segments.splice(i, 1)
				}
			}
		},
		addSegment: (state, segment: Segment) => {
			state.segments.push(segment)
		},
		updateSegment: (state, segment) => {
			for (let i = 0; i < state.segments.length; i++) {
				if (state.segments[i].id === segment.id) {
					// state.playlists.splice(i, 1, playlist)
					Vue.set(state.segments, i, segment)
				}
			}
		},

		setParts: (state, parts) => {
			Vue.set(state, 'parts', parts)
		},
		removePart: (state, id) => {
			for (let i = 0; i < state.parts.length; i++) {
				if (state.parts[i].id === id) {
					state.parts.splice(i, 1)
				}
			}
		},
		addPart: (state, part: Part) => {
			state.parts.push(part)
		},
		updatePart: (state, part) => {
			for (let i = 0; i < state.parts.length; i++) {
				if (state.parts[i].id === part.id) {
					// state.playlists.splice(i, 1, playlist)
					Vue.set(state.parts, i, part)
				}
			}
		},

		setPieces: (state, pieces) => {
			Vue.set(state, 'pieces', pieces)
		},
		removePiece: (state, id) => {
			for (let i = 0; i < state.pieces.length; i++) {
				if (state.pieces[i].id === id) {
					state.pieces.splice(i, 1)
				}
			}
		},
		addPiece: (state, piece: Piece) => {
			state.pieces.push(piece)
		},
		updatePiece: (state, piece) => {
			for (let i = 0; i < state.pieces.length; i++) {
				if (state.pieces[i].id === piece.id) {
					// state.playlists.splice(i, 1, playlist)
					Vue.set(state.pieces, i, piece)
				}
			}
		},

		setPieceTypeManifests: (state, pieceTypeManifests) => {
			Vue.set(state, 'piecesManifest', pieceTypeManifests)
		},
		removePieceTypeManifest: (state, id) => {
			for (let i = 0; i < state.piecesManifest.length; i++) {
				if (state.piecesManifest[i].id === id) {
					state.piecesManifest.splice(i, 1)
				}
			}
		},
		addPieceTypeManifest: (state, pieceTypeManifest: PieceTypeManifest) => {
			state.piecesManifest.push(pieceTypeManifest)
		},
		updatePieceTypeManifest: (state, update) => {
			for (let i = 0; i < state.piecesManifest.length; i++) {
				if (state.piecesManifest[i].id === update.id) {
					// state.pieceTypeManifests.splice(i, 1, pieceTypeManifest)
					Vue.set(state.piecesManifest, i, update.manifest)
				}
			}
		},

		setSettings: (state, pieceTypeManifests) => {
			Vue.set(state, 'settings', pieceTypeManifests)
		},

		setCoreConnectionInfo: (state, coreConnnectionInfo: CoreConnectionInfo) => {
			Vue.set(state, 'coreConnectionInfo', coreConnnectionInfo)
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
			commit('updatePlaylist', playlist)
		},

		loadRundown: async ({ commit }, id: string) => {
			const segments = await ipcRenderer.invoke(
				'segments',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: id
					}
				})
			)
			commit('setSegments', segments)

			const parts = await ipcRenderer.invoke(
				'parts',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: id
					}
				})
			)
			commit('setParts', parts)

			const pieces = await ipcRenderer.invoke(
				'pieces',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: id
					}
				})
			)
			commit('setPieces', pieces)
		},

		removeRundown: async ({ commit }, id: string) => {
			await ipcRenderer.invoke(
				'rundowns',
				literal<IpcOperation>({
					type: IpcOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removeRundown', id)
		},
		newRundown: async ({ commit }, { playlistId }) => {
			const rundown = await ipcRenderer.invoke(
				'rundowns',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: {
						name: 'New rundown',
						playlistId
					}
				})
			)
			commit('addRundown', rundown)
		},
		updateRundown: async ({ commit }, update) => {
			const rundown = await ipcRenderer.invoke(
				'rundowns',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			commit('updateRundown', rundown)
		},

		removeSegment: async ({ commit }, id: string) => {
			await ipcRenderer.invoke(
				'segments',
				literal<IpcOperation>({
					type: IpcOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removeSegment', id)
		},
		newSegment: async ({ commit }, { playlistId, rundownId, rank }) => {
			const rundown = await ipcRenderer.invoke(
				'segments',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: {
						name: 'New segment',
						playlistId,
						rundownId,
						rank
					}
				})
			)
			commit('addSegment', rundown)
		},
		updateSegment: async ({ commit }, update) => {
			const rundown = await ipcRenderer.invoke(
				'segments',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			commit('updateSegment', rundown)
		},

		removePart: async ({ commit }, id: string) => {
			await ipcRenderer.invoke(
				'parts',
				literal<IpcOperation>({
					type: IpcOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removePart', id)
		},
		newPart: async ({ commit }, { playlistId, rundownId, segmentId, rank }) => {
			const part = await ipcRenderer.invoke(
				'parts',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: {
						name: 'New part',
						playlistId,
						rundownId,
						segmentId,
						rank
					}
				})
			)
			commit('addPart', part)
		},
		updatePart: async ({ commit }, update) => {
			const rundown = await ipcRenderer.invoke(
				'parts',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			commit('updatePart', rundown)
		},

		removePiece: async ({ commit }, id: string) => {
			await ipcRenderer.invoke(
				'pieces',
				literal<IpcOperation>({
					type: IpcOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removePiece', id)
		},
		newPiece: async (
			{ commit, state },
			{ playlistId, rundownId, segmentId, partId, pieceType }
		) => {
			const manifest = state.piecesManifest.find((m) => m.id === pieceType)
			const piece = await ipcRenderer.invoke(
				'pieces',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: {
						name: manifest && manifest.includeTypeInName ? manifest.name : 'New piece',
						playlistId,
						rundownId,
						segmentId,
						partId,
						pieceType
					}
				})
			)
			commit('addPiece', piece)
			return piece
		},
		updatePiece: async ({ commit }, update) => {
			const rundown = await ipcRenderer.invoke(
				'pieces',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			commit('updatePiece', rundown)
		},

		removePieceTypeManifest: async ({ commit }, id: string) => {
			await ipcRenderer.invoke(
				'pieceTypeManifests',
				literal<IpcOperation>({
					type: IpcOperationType.Delete,
					payload: {
						id
					}
				})
			)
			commit('removePieceTypeManifest', id)
		},
		newPieceTypeManifest: async ({ commit, state }) => {
			const count = state.piecesManifest.filter((m) => m.id.startsWith('new')).length
			const pieceTypeManifest = await ipcRenderer.invoke(
				'pieceTypeManifests',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: {
						id: 'newType' + count,
						name: 'New Piece Type'
					}
				})
			)
			commit('addPieceTypeManifest', pieceTypeManifest)
			return pieceTypeManifest
		},
		importPieceTypeManifest: async ({ commit }, type) => {
			const pieceTypeManifest = await ipcRenderer.invoke(
				'pieceTypeManifests',
				literal<IpcOperation>({
					type: IpcOperationType.Create,
					payload: type
				})
			)
			commit('addPieceTypeManifest', pieceTypeManifest)
			return pieceTypeManifest
		},
		updatePieceTypeManifest: async ({ commit }, update) => {
			const manifest = await ipcRenderer.invoke(
				'pieceTypeManifests',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			commit('updatePieceTypeManifest', { manifest, id: update.id })
		},

		updateSettings: async ({ commit }, update) => {
			const settings = await ipcRenderer.invoke(
				'settings',
				literal<IpcOperation>({
					type: IpcOperationType.Update,
					payload: update
				})
			)
			commit('setSettings', settings)
		}
	},
	modules: {}
})

export default store

export async function initStore() {
	const playlists = await ipcRenderer.invoke(
		'playlists',
		literal<IpcOperation>({
			type: IpcOperationType.Read,
			payload: {}
		})
	)
	store.commit('setPlaylists', playlists)

	const rundowns = await ipcRenderer.invoke(
		'rundowns',
		literal<IpcOperation>({
			type: IpcOperationType.Read,
			payload: {}
		})
	)
	store.commit('setRundowns', rundowns)

	const pieceTypes = await ipcRenderer.invoke(
		'pieceTypeManifests',
		literal<IpcOperation>({
			type: IpcOperationType.Read,
			payload: {}
		})
	)
	store.commit('setPieceTypeManifests', pieceTypes)

	const settings = await ipcRenderer.invoke(
		'settings',
		literal<IpcOperation>({
			type: IpcOperationType.Read,
			payload: {}
		})
	)
	store.commit('setSettings', settings)

	const coreConnectionInfo = await ipcRenderer.invoke(
		'coreConnectionInfo',
		literal<IpcOperation>({
			type: IpcOperationType.Read,
			payload: {}
		})
	)
	store.commit('setCoreConnectionInfo', coreConnectionInfo)

	ipcRenderer.on('coreConnectionInfo', (_, newInfo: CoreConnectionInfo) => {
		store.commit('setCoreConnectionInfo', newInfo)
	})
}
