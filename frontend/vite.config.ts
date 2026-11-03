import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
	base: './',
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src/'),
			'~backend': path.resolve(__dirname, '../backend/src/'),
			'~bootstrap': path.resolve(__dirname, '../node_modules/bootstrap')
		}
	},
	test: { environment: 'jsdom' }, // DOMParser is used for MOS XML
	plugins: [
		//
		TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
		react()
	]
})
