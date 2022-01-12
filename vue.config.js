module.exports = {
	pluginOptions: {
		electronBuilder: {
			preload: 'src/preload.ts',
			mainProcessWatch: ['src/background.ts', 'src/background/*'],
			rendererProcessWatch: ['src/external/*'],
			customFileProtocol: './',
			asar: false,
			nodeIntegration: true,
			builderOptions: {
				productName: 'Sofie Rundown Editor',
				appId: 'sofie-rundown-editor.superfly.tv',
				mac: {
					target: 'dmg'
				},
				linux: {
					target: ['AppImage', 'deb'],
					icon: 'static/icons/Icon-512x512.png',
					category: 'Utility'
				}
			}
		}
	},
	pages: {
		index: {
			entry: 'src/main.ts',
			title: 'Sofie Rundown Editor'
		}
		// timer: {
		// 	// entry for the page
		// 	entry: 'src/external/timer/main.ts',
		// 	// the source template
		// 	template: 'public/index.html',
		// 	// output as dist/index.html
		// 	filename: 'timer.html',
		// 	// when using title option,
		// 	// template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
		// 	title: 'CasparCG Playback Client Timers',
		// 	// chunks to include on this page, by default includes
		// 	// extracted common chunks and vendor chunks.
		// 	chunks: ['chunk-vendors', 'chunk-common', 'timer']
		// }
	}
}
