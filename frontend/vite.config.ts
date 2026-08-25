import { defineConfig } from 'vite'
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
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				// To quiet the warnings about the internal bootstrap issues
				// https://github.com/twbs/bootstrap/issues/40962
				quietDeps: true,
				silenceDeprecations: ['import']
			}
		}
	},
	plugins: [
		//
		TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
		react()
	]
})
