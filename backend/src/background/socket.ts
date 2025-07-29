import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

let ioInstance: SocketIOServer | null = null

export function initSocket(server: HTTPServer): SocketIOServer | undefined {
	if (ioInstance) {
		return
	}
	ioInstance = new SocketIOServer(server, {
		cors: {
			origin: '*'
		}
	})
	return ioInstance
}

export function getSocketIO(): SocketIOServer | undefined {
	if (!ioInstance) {
		return
	}
	return ioInstance
}
