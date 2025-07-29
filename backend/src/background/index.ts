import { coreHandler } from './coreHandler'
import { initSocketServer } from '../socketServer'

export interface BasicPayload extends Record<string, unknown> {
	playerId: number
}

export class ControlAPI {
	async init(port: number = 3010): Promise<void> {
		initSocketServer(port)
		await coreHandler.init()
	}
}
