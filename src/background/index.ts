import { BrowserWindow, ipcMain } from 'electron'
import { IpcOperation, IpcOperationType } from './interfaces'

import './api/settings'
import './api/pieceManifests'
import './api/playlists'
import './api/rundowns'
import './api/segments'
import './api/parts'
import './api/pieces'

import { coreHandler } from './coreHandler'

export interface BasicPayload extends Record<string, unknown> {
	playerId: number
}

export class ControlAPI {
	constructor(window: BrowserWindow) {
		coreHandler.init(window)
		ipcMain.handle('coreConnectionInfo', (_, operation: IpcOperation) => {
			if (operation.type === IpcOperationType.Read) {
				return coreHandler.connectionInfo
			}
		})
	}
}
