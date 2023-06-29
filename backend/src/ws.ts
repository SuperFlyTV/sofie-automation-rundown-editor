import { Server as HttpServer } from 'http'
import { Server as WsServer } from 'socket.io'

import { init as initPieceManifests } from './api/pieceManifests'
import { init as initSettings } from './api/settings'

import { init as initRundowns } from './api/rundowns'
import { init as initSegments } from './api/segments'
import { init as initParts } from './api/parts'
import { init as initPieces } from './api/pieces'
import { RemoteOperation, RemoteOperationType } from './interfaces'
import { coreHandler } from './coreHandler'

export let io: undefined | WsServer = undefined

export function bootstrapWs(server: HttpServer) {
	io = new WsServer(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	})

	io.on('connection', (socket) => {
		console.log('Received new connection')

		initSettings(socket)
		initPieceManifests(socket)

		initRundowns(socket)
		initSegments(socket)
		initParts(socket)
		initPieces(socket)

		socket.on('disconnect', () => {
			console.log('Disconnect')
		})

		socket.on('coreConnectionInfo', (operation: RemoteOperation, cb) => {
			if (operation.type === RemoteOperationType.Read) {
				cb({ result: coreHandler.connectionInfo})
			}
		})
		// socket.on(WsEvents.EventsGet, () => {
		// 	Events.read().then((events) => {
		// 		socket.emit(WsEvents.EventsGet, events)
		// 	})
		// })
	})
}
