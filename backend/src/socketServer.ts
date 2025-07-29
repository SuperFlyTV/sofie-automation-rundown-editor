import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { registerSettingsHandlers } from './background/api/settings'
import { registerPieceManifestsHandlers } from './background/api/pieceManifests'
import { registerSegmentsHandlers } from './background/api/segments'
import { registerPlaylistsHandlers } from './background/api/playlists'
import { registerRundownsHandlers } from './background/api/rundowns'
import { registerPiecesHandlers } from './background/api/pieces'
import { registerPartsHandlers } from './background/api/parts'
import { initSocket } from './background/socket'
import { registerCoreConnectionInfoHandlers } from './background/api/coreConnectionInfo'

export async function initSocketServer(port: number = 3010) {
	const app = express()
	const server = http.createServer(app)
	const io = initSocket(server)

	if (io) {
		type SocketIOHandler = (socket: Socket, io: Server) => void
		const handlers: SocketIOHandler[] = [
			registerCoreConnectionInfoHandlers,
			registerSettingsHandlers,
			registerPieceManifestsHandlers,
			registerSegmentsHandlers,
			registerPlaylistsHandlers,
			registerRundownsHandlers,
			registerPiecesHandlers,
			registerPartsHandlers
		]

		io.on('connection', (socket) => {
			console.log(`Client connected: ${socket.id}`)

			socket.onAny((event, ...args) => {
				console.log(`Received event: ${event}`, ...args)
			})

			// Register all feature handlers
			handlers.map((handler: SocketIOHandler) => handler(socket, io))
		})

		server.listen(port, () => console.log(`Server running on http://localhost:${port}`))
	} else {
		console.error("Couldn't initialize Socket Server because it's already initialized.")
	}
}
