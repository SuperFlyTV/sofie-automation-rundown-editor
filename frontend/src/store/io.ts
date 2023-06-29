import { CoreConnectionInfo, RemoteOperation } from '@/background/interfaces';
import { io } from 'socket.io-client'
import store, { initStore } from './index'

const socket =
  process.env.NODE_ENV === "development" ? io("ws://localhost:3100") : io();

export async function executeRemoteOp(opType: string, op: RemoteOperation) {
  console.log('exec remote', opType, op)
  const { error, result } = await socket.emitWithAck(opType, op)
  console.log(error, result)

  if (error) throw new Error(error)

  return result
}

socket.on('connect', () => {
  console.log('connect')
  initStore()
})

socket.on('coreConnectionInfo', (newInfo: CoreConnectionInfo) => {
  store.commit('setCoreConnectionInfo', newInfo)
})
