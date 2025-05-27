import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IpcOperation, IpcOperationType, OpenFromFileArgs, SaveToFileArgs } from './interfaces'
import fs from 'fs/promises'

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
	async init(): Promise<void> {
		await coreHandler.init()
		await initRundowns()
		await initSegments()
		await initParts()
		await initPieces()
		ipcMain.handle('coreConnectionInfo', (_, operation: IpcOperation) => {
			if (operation.type === IpcOperationType.Read) {
				return coreHandler.connectionInfo
			}
		})
		ipcMain.handle('openFromFile', async (_, args: OpenFromFileArgs) => {
			const { canceled, filePaths } = await dialog.showOpenDialog({
				title: args.title,
				filters: [{ name: 'JSON', extensions: ['json'] }],
				properties: ['openFile']
			})

			if (!canceled && filePaths && filePaths.length > 0) {
				const result = await fs.readFile(filePaths[0], { encoding: 'utf-8' })
				if (result) {
					return JSON.parse(result)
				}
			}

			return null
		})
		ipcMain.handle('saveToFile', async (_, args: SaveToFileArgs) => {
			const { filePath, canceled } = await dialog.showSaveDialog({
				title: args.title,
				filters: [{ name: 'JSON', extensions: ['json'] }]
			})

			console.log('saveToFile', filePath, canceled)

			if (filePath && !canceled) {
				await fs.writeFile(filePath, JSON.stringify(args.document))
			}
		})
	}
}
