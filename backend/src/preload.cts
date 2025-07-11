// import { IpcRenderer, ipcRenderer } from 'electron'
// import { promises as fs } from 'fs'
// import { dialog } from '@electron/remote'
// window.ipcRenderer = ipcRenderer
// window.fs = fs
// window.remoteDialog = dialog

// declare global {
// 	interface Window {
// 		ipcRenderer: IpcRenderer
// 		fs: typeof fs
// 		remoteDialog: typeof dialog
// 	}
// }

/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron')
import type { BackendApi } from './background/api/api.js'
import type {
	CoreConnectionInfo,
	MutationPartCreate,
	MutationPartUpdate,
	MutationPieceCreate,
	MutationPieceUpdate,
	MutationRundownCreate,
	MutationRundownUpdate,
	MutationSegmentCreate,
	MutationSegmentUpdate,
	OpenFromFileArgs,
	PieceTypeManifest,
	SaveToFileArgs
} from './background/interfaces.js'

const electronApi: BackendApi = {
	openFromFile: (args: OpenFromFileArgs) => {
		return ipcRenderer.invoke('openFromFile', args)
	},
	saveToFile: (args: SaveToFileArgs) => {
		return ipcRenderer.invoke('saveToFile', args)
	},

	onCoreConnectionInfo: (callback) => {
		ipcRenderer.on('coreConnectionInfo', (_event: unknown, newInfo: CoreConnectionInfo) => {
			callback(newInfo)
		})
	},
	getCoreConnectionInfo: () => {
		return ipcRenderer.invoke('coreConnectionInfo', {
			type: 'read',
			payload: {}
		})
	},

	resetSettings: () => {
		return ipcRenderer.invoke('settings', {
			type: 'reset',
			payload: {}
		})
	},
	getSettings: () => {
		return ipcRenderer.invoke('settings', {
			type: 'read',
			payload: {}
		})
	},
	updateSettings: (settings) => {
		return ipcRenderer.invoke('settings', {
			type: 'update',
			payload: settings
		})
	},

	getPiecesManifest: () => {
		return ipcRenderer.invoke('pieceTypeManifests', {
			type: 'read',
			payload: {}
		})
	},
	addNewPieceManifest: (manifest: PieceTypeManifest) => {
		return ipcRenderer.invoke('pieceTypeManifests', {
			type: 'create',
			payload: manifest
		})
	},
	updatePiecesManifest: (id: string, manifest: PieceTypeManifest) => {
		return ipcRenderer.invoke('pieceTypeManifests', {
			type: 'update',
			payload: { update: manifest, id: id }
		})
	},
	removePiecesManifest: (id: string) => {
		return ipcRenderer.invoke('pieceTypeManifests', {
			type: 'delete',
			payload: { id }
		})
	},

	getPlaylists: () => {
		return ipcRenderer.invoke('playlists', {
			type: 'read',
			payload: {}
		})
	},

	getRundowns: () => {
		return ipcRenderer.invoke('rundowns', {
			type: 'read',
			payload: {}
		})
	},
	addNewRundown: (rundown: MutationRundownCreate) => {
		return ipcRenderer.invoke('rundowns', {
			type: 'create',
			payload: rundown
		})
	},
	updateRundown: (rundown: MutationRundownUpdate) => {
		return ipcRenderer.invoke('rundowns', {
			type: 'update',
			payload: rundown
		})
	},
	deleteRundown: (rundownId: string) => {
		return ipcRenderer.invoke('rundowns', {
			type: 'delete',
			payload: {
				id: rundownId
			}
		})
	},

	getSegments: (rundownId: string) => {
		return ipcRenderer.invoke('segments', {
			type: 'read',
			payload: {
				rundownId
			}
		})
	},
	addNewSegment: (segment: MutationSegmentCreate) => {
		return ipcRenderer.invoke('segments', {
			type: 'create',
			payload: segment
		})
	},
	updateSegment: (segment: MutationSegmentUpdate) => {
		return ipcRenderer.invoke('segments', {
			type: 'update',
			payload: segment
		})
	},
	deleteSegment: (segmentId: string) => {
		return ipcRenderer.invoke('segments', {
			type: 'delete',
			payload: {
				id: segmentId
			}
		})
	},

	getParts: (rundownId: string) => {
		return ipcRenderer.invoke('parts', {
			type: 'read',
			payload: {
				rundownId
			}
		})
	},
	addNewPart: (part: MutationPartCreate) => {
		return ipcRenderer.invoke('parts', {
			type: 'create',
			payload: part
		})
	},
	updatePart: (part: MutationPartUpdate) => {
		return ipcRenderer.invoke('parts', {
			type: 'update',
			payload: part
		})
	},
	reorderParts: (part: MutationPartUpdate, targetIndex: number) => {
		return ipcRenderer.invoke('parts', {
			type: 'reorder',
			payload: { part, targetIndex }
		})
	},
	deletePart: (partId: string) => {
		return ipcRenderer.invoke('parts', {
			type: 'delete',
			payload: {
				id: partId
			}
		})
	},

	getPieces: (rundownId: string) => {
		return ipcRenderer.invoke('pieces', {
			type: 'read',
			payload: {
				rundownId
			}
		})
	},
	addNewPiece: (segment: MutationPieceCreate) => {
		return ipcRenderer.invoke('pieces', {
			type: 'create',
			payload: segment
		})
	},
	updatePiece: (piece: MutationPieceUpdate) => {
		return ipcRenderer.invoke('pieces', {
			type: 'update',
			payload: piece
		})
	},
	deletePiece: (pieceId: string) => {
		return ipcRenderer.invoke('pieces', {
			type: 'delete',
			payload: {
				id: pieceId
			}
		})
	}
}

contextBridge.exposeInMainWorld('electronApi', electronApi)

export type { electronApi }
