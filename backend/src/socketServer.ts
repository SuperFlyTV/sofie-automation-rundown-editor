import express from 'express'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { registerSettingsHandlers } from './background/api/settings'
import { registerTypeManifestsHandlers } from './background/api/typeManifests'
import { registerSegmentsHandlers } from './background/api/segments'
import { registerPlaylistsHandlers } from './background/api/playlists'
import { registerRundownsHandlers } from './background/api/rundowns'
import { registerPiecesHandlers } from './background/api/pieces'
import { registerPartsHandlers } from './background/api/parts'
import { initSocket } from './background/socket'
import { registerCoreConnectionInfoHandlers } from './background/api/coreConnectionInfo'
import path from 'path'

const frontendPath = path.resolve(__dirname, '../../frontend/dist')

export async function initSocketServer(port: number = 3010) {
	const app = express()
	const server = http.createServer(app)
	const io = initSocket(server)

	if (io) {
		type SocketIOHandler = (socket: Socket, io: Server) => void
		const handlers: SocketIOHandler[] = [
			registerCoreConnectionInfoHandlers,
			registerSettingsHandlers,
			registerTypeManifestsHandlers,
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

		app.use(express.static(frontendPath))

		app.get('/', (_, res) => {
			res.sendFile(path.join(frontendPath, 'index.html'))
		})
		app.get('/favicon.png', (_, res) => {
			res.sendFile(path.join(frontendPath, '../../build/icon.png'))
		})

		server.listen(port, () => console.log(`Server running on http://localhost:${port}`))
	} else {
		console.error("Couldn't initialize Socket Server because it's already initialized.")
	}
}
