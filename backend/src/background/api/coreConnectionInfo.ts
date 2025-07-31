import { Server, Socket } from 'socket.io'
import { IpcOperationType } from '../interfaces'
import { coreHandler } from '../coreHandler'

export function registerCoreConnectionInfoHandlers(socket: Socket, _io: Server) {
	socket.on('coreConnectionInfo', async (action, _payload, callback) => {
		switch (action) {
			case IpcOperationType.Read:
				{
					if (!coreHandler) callback(new Error('Core Connection is not initialized!'))
					else callback(coreHandler.connectionInfo)
				}
				break
			default:
				callback(new Error(`Unknown operation type ${action}`))
		}
	})
}
