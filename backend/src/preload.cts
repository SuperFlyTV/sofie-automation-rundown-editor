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
import {
	CoreConnectionInfo,
	MutationPartCreate,
	MutationPartUpdate,
	MutationPieceCreate,
	MutationRundownCreate,
	MutationRundownUpdate,
	MutationSegmentCreate,
	MutationSegmentUpdate,
	Rundown,
	Segment
} from './background/interfaces.js'

const electronApi: BackendApi = {
	onCoreConnectionInfo: (callback) => {
		ipcRenderer.on('coreConnectionInfo', (event, newInfo: CoreConnectionInfo) => {
			callback(newInfo)
		})
	},
	getCoreConnectionInfo: () => {
		return ipcRenderer.invoke('coreConnectionInfo', {
			type: 'read',
			payload: {}
		})
	},

	getSettings: () => {
		return ipcRenderer.invoke('settings', {
			type: 'read',
			payload: {}
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
	}
}

contextBridge.exposeInMainWorld('electronApi', electronApi)

export type { electronApi }
