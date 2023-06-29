import { RemoteOperation, RemoteOperationType } from './interfaces'

import './api/settings'
import './api/pieceManifests'
import './api/playlists'

import { init as initRundowns } from './api/rundowns'
import { init as initSegments } from './api/segments'
import { init as initParts } from './api/parts'
import { init as initPieces } from './api/pieces'

import { init as initPieceManifest } from './api/pieceManifests'
import { init as initSettings } from './api/settings'

import { coreHandler } from './coreHandler'

export interface BasicPayload extends Record<string, unknown> {
	playerId: number
}

export class ControlAPI {

	async init(): Promise<void> {
		await coreHandler.init()

		// ipcMain.handle('coreConnectionInfo', (_, operation: RemoteOperation) => {
		// 	if (operation.type === RemoteOperationType.Read) {
		// 		return coreHandler.connectionInfo
		// 	}
		// })
	}
}
