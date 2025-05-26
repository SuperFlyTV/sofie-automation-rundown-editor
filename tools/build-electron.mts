/* eslint-disable n/no-process-exit */
import { fs, usePowerShell, argv } from 'zx'
// eslint-disable-next-line n/no-extraneous-import
import electronBuilder from 'electron-builder'

if (process.platform === 'win32') {
	usePowerShell() // to enable powershell
}

// perform the electron build
await fs.remove('./dist_electron')

const options: electronBuilder.Configuration = {
	publish: process.env.GH_TOKEN
		? [
				{
					provider: 'github'
				}
		  ]
		: null,
	productName: 'Sofie Rundown Editor',
	appId: 'rundown-editor.sofie.superfly.tv',
	npmRebuild: false,
	directories: {
		buildResources: 'assets/',
		output: '../dist_electron/'
	},
	mac: {
		category: 'tv.superfly.sofie.rundown-editor',
		target: 'dmg',
		extendInfo: {
			LSBackgroundOnly: 1,
			LSUIElement: 1
		},
		hardenedRuntime: true,
		gatekeeperAssess: false,
		entitlements: 'backend/entitlements.mac.plist',
		entitlementsInherit: 'backend/entitlements.mac.plist',
		notarize: !!process.env.CSC_LINK
	},
	dmg: {
		artifactName: 'Sofie-Rundown-Editor.dmg',
		sign: !!process.env.CSC_LINK // Only sign in ci
	},
	win: {
		target: 'nsis',
		verifyUpdateCodeSignature: false // Enabling this would need publishedName to be set, not sure if that is possible
	},
	nsis: {
		createStartMenuShortcut: true,
		perMachine: true,
		oneClick: false,
		allowElevation: true,
		artifactName: 'Sofie-Rundown-Editor-x64.exe'
	},
	linux: {
		target: 'AppImage',
		artifactName: 'Sofie-Rundown-Editor-${arch}.AppImage',
		extraFiles: [
			{
				from: 'assets/linux',
				to: '.'
			}
		]
	},
	files: ['**/*', 'assets/*', '*.db', '!src'],
	extraResources: [
		{
			from: '../frontend/dist',
			to: 'frontend'
		}
	]
}

// const satellitePkgJsonPath = new URL('../satellite/package.json', import.meta.url)
// const satellitePkgJsonStr = await fs.readFile(satellitePkgJsonPath)

// const satellitePkgJson = JSON.parse(satellitePkgJsonStr.toString())
// satellitePkgJson.updateChannel = process.env.EB_UPDATE_CHANNEL
// console.log('Injecting update channel: ' + satellitePkgJson.updateChannel)

// if (process.env.BUILD_VERSION) satellitePkgJson.version = process.env.BUILD_VERSION

// await fs.writeFile(satellitePkgJsonPath, JSON.stringify(satellitePkgJson))

// try {
// perform the electron build
await electronBuilder.build({
	targets: electronBuilder.Platform.current().createTarget(
		null,
		...(process.platform === 'darwin' ? [electronBuilder.Arch.universal] : [])
	),
	config: options,
	projectDir: 'backend'
})
// } finally {
// 	// undo the changes made
// 	await fs.writeFile(satellitePkgJsonPath, satellitePkgJsonStr)
// }
