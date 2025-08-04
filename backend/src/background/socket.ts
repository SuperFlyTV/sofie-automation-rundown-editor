import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

let ioInstance: SocketIOServer | null = null

export function initSocket(server: HTTPServer): SocketIOServer | undefined {
	if (ioInstance) {
		return
	}
	const corsOrigin = process.env.NODE_ENV === 'development' ? '*' : false

	ioInstance = new SocketIOServer(server, {
		cors: {
			origin: corsOrigin
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
