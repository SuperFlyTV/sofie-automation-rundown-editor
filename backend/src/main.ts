'use strict'

import { initializeDefaults as initializeSettingsDefaults } from './background/api/settings'
import { ControlAPI } from './background'

async function startRundownEditorServer() {
	await initializeSettingsDefaults()

	const api = new ControlAPI()
	await api.init().catch((error) => {
		console.error(error)
		process.exit(1)
	})
}

startRundownEditorServer()
