import Koa from 'koa'
import cors from '@koa/cors'
import { bootstrapWs } from './ws'
import { ControlAPI } from './controlApi'
import { initializeDefaults as initializeDefaultSettings } from './api/settings'

// todo - make this a config
// @ts-ignore
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const app = new Koa()

app.use(cors())

// response
app.use((ctx) => {
	ctx.body = { status: 200 }
})

const server = app.listen(3100)

initializeDefaultSettings()

bootstrapWs(server)
new ControlAPI().init()
