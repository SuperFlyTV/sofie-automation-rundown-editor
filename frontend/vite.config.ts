import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src/'),
			'~backend': path.resolve(__dirname, '../backend/src/'),
			'~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap')
		}
	},
	plugins: [
		//
		TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
		react()
	]
})
