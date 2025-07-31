import { io, Socket } from 'socket.io-client'

let socket: Socket

export const getSocket = (): Socket => {
	if (!socket) {
		socket = import.meta.env.MODE === 'development' ? io('http://localhost:3010/') : io()
	}
	return socket
}
