import { BrowserWindow } from 'electron'

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

coreHandler.init()

export class ControlAPI {
	constructor(private window: BrowserWindow) {
		// players.forEach((player, id) => {
		// 	player.on('updatePlayerState', () => {
		// 		window.webContents.send('playerStatus', {
		// 			playerId: id,
		// 			playerState: player.playerState
		// 		})
		// 	})
		// })
		// ipcMain.on('getMedia', (ev: any) => {
		// 	ev.reply('media', media)
		// })
		// ipcMain.on('getGfxManifest', (ev: any) => {
		// 	ev.reply('gfxManifest', graphicsManifest)
		// })
		// subscribeToUpdates((newMedia) => {
		// 	media = newMedia
		// 	window.webContents.send('media', newMedia)
		// })
	}
}
