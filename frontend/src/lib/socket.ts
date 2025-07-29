import { io, Socket } from 'socket.io-client'

let socket: Socket

export const getSocket = (): Socket => {
	if (!socket) {
		socket = io('http://localhost:3010/') // TODO: use environment variable to configure host
	}
	return socket
}
