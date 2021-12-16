import { BrowserWindow, ipcMain } from 'electron'
import { IpcOperation, IpcOperationType } from './interfaces'

import './api/settings'
import './api/pieceManifests'
import './api/playlists'
import { init as initRundowns } from './api/rundowns'
import { init as initSegments } from './api/segments'
import { init as initParts } from './api/parts'
import { init as initPieces } from './api/pieces'

import { coreHandler } from './coreHandler'

export interface BasicPayload extends Record<string, unknown> {
	playerId: number
}

export class ControlAPI {
	private _window: BrowserWindow

	constructor(window: BrowserWindow) {
		this._window = window
	}

	async init(): Promise<void> {
		await coreHandler.init(this._window)
		await initRundowns(this._window)
		await initSegments(this._window)
		await initParts(this._window)
		await initPieces(this._window)
		ipcMain.handle('coreConnectionInfo', (_, operation: IpcOperation) => {
			if (operation.type === IpcOperationType.Read) {
				return coreHandler.connectionInfo
			}
		})
	}
}
