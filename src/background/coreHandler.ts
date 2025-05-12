import {
	CoreConnection,
	CoreCredentials,
	CoreOptions,
	DDPConnectorOptions,
	Observer,
	PeripheralDevicePubSub,
	PeripheralDeviceCommand,
	PeripheralDevicePubSubCollectionsNames,
	stringifyError
} from '@sofie-automation/server-core-integration'
import * as P from '@sofie-automation/shared-lib/dist/peripheralDevice/peripheralDeviceAPI'
import { StatusCode } from '@sofie-automation/shared-lib/dist/lib/status'
import { protectString } from '@sofie-automation/shared-lib/dist/lib/protectedString'
import { DEVICE_CONFIG_MANIFEST } from './configManifest'
import { mutations as settingsMutations } from './api/settings'
import { BrowserWindow } from 'electron'
import { CoreConnectionInfo, CoreConnectionStatus } from './interfaces'
import { mutateRundown, mutations as rundownMutations } from './api/rundowns'
import { PeripheralDeviceCommandId } from '@sofie-automation/shared-lib/dist/core/model/Ids'

const serverCoreIntegrationVersion =
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('@sofie-automation/server-core-integration/package.json').version

export interface DeviceConfig {
	deviceId: string
	deviceToken: string
}

export class CoreHandler {
	public core: CoreConnection
	public get connectionInfo(): Readonly<CoreConnectionInfo> {
		return Object.freeze({ ...this._connectionInfo })
	}

	private _observers: Array<Observer<any>> = []
	private _subscriptions: Array<string> = []
	private _executedFunctions = new Set<PeripheralDeviceCommandId>()
	private _connectionInfo: CoreConnectionInfo = {
		url: undefined,
		port: undefined,
		status: CoreConnectionStatus.DISCONNECTED
	}

	constructor() {
		// todo - have settings for this
		this.core = new CoreConnection(
			this.getCoreConnectionOptions(
				{
					deviceId: '',
					deviceToken: ''
				},
				'sofie-rundown-editor'
			)
		)
	}

	async init(window: BrowserWindow) {
		const { result: settings } = await settingsMutations.read()

		this.core.onConnected(() => {
			console.log('Core Connected!')
			this._connectionInfo.status = CoreConnectionStatus.CONNECTED
			window.webContents.send('coreConnectionInfo', this._connectionInfo)
			this.setStatus(StatusCode.GOOD, [])
			// if (this._isInitialized) this.onConnectionRestored()
		})
		this.core.onDisconnected(() => {
			console.log('Core Disconnected!')
			this._connectionInfo.status = CoreConnectionStatus.DISCONNECTED
			window.webContents.send('coreConnectionInfo', this._connectionInfo)
		})
		this.core.onError((err) => {
			console.log('Core Error: ' + (typeof err === 'string' ? err : err.message))
		})

		const ddpConfig: DDPConnectorOptions = {
			host: (settings || {}).coreUrl || '127.0.0.1',
			port: (settings || {}).corePort || 3000
		}
		this._connectionInfo.url = ddpConfig.host
		this._connectionInfo.port = ddpConfig.port
		window.webContents.send('coreConnectionInfo', this._connectionInfo)
		// if (this._process && this._process.certificates.length) {
		// 	ddpConfig.tlsOpts = {
		// 		ca: this._process.certificates
		// 	}
		// }
		this.core
			.init(ddpConfig)
			.then(() => {
				return this.setupSubscriptionsAndObservers()
			})
			.catch((error) => {
				console.error('Core Initialization Error:', error instanceof Error ? error.message : error)
				this.core.destroy() // Cleanup to prevent EventEmitter leaks.
				this.init(window) // Keep retrying until successful.
			})
	}

	/**
	 * Subscribes to events in the core.
	 */
	async setupSubscriptionsAndObservers(): Promise<void> {
		// console.log('setupObservers', this.core.deviceId)
		if (this._observers.length) {
			console.info('Core: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}

		if (!this.core) {
			throw Error('core is undefined!')
		}

		console.info('Core: Setting up subscriptions for ' + this.core.deviceId + '..')
		await Promise.all([
			this.core.autoSubscribe(PeripheralDevicePubSub.peripheralDeviceForDevice, this.core.deviceId),
			this.core.autoSubscribe(PeripheralDevicePubSub.peripheralDeviceCommands, this.core.deviceId)
		])

		this.setupObserverForPeripheralDeviceCommands()
	}

	getCoreConnectionOptions(deviceOptions: DeviceConfig, name: string): CoreOptions {
		let credentials: CoreCredentials = {
			deviceId: protectString('SofieRundownEditor'),
			deviceToken: 'unsecureToken'
		}

		if (deviceOptions.deviceId && deviceOptions.deviceToken) {
			credentials = {
				deviceId: protectString(deviceOptions.deviceId),
				deviceToken: deviceOptions.deviceToken
			}
		} else if (deviceOptions.deviceId) {
			console.warn('Token not set, only id! This might be unsecure!')
			credentials = {
				deviceId: protectString(deviceOptions.deviceId + name),
				deviceToken: 'unsecureToken'
			}
		} else {
			console.warn('Device ID and token not set, using unsecure defaults!')
		}
		const options: CoreOptions = {
			...credentials,

			deviceCategory: P.PeripheralDeviceCategory.INGEST,
			deviceType: P.PeripheralDeviceType.SPREADSHEET,
			documentationUrl: 'xxx',
			versions: {}, // todo - unhardcode

			deviceName: name,
			watchDog: false, // todo - unhardcode

			configManifest: DEVICE_CONFIG_MANIFEST
		}
		options.versions = this._getVersions()
		return options
	}

	setStatus(statusCode: StatusCode, messages: string[]) {
		this.core
			.setStatus({
				statusCode: statusCode,
				messages: messages
			})
			.catch((e) => console.warn('Error when setting status:' + e))
	}

	/**
	 * Listen for commands and execute.
	 */
	setupObserverForPeripheralDeviceCommands() {
		const observer = this.core.observe(
			PeripheralDevicePubSubCollectionsNames.peripheralDeviceCommands
		)
		this.killProcess(0) // just make sure it exists
		this._observers.push(observer)

		/**
		 * Called when a command is added/changed. Executes that command.
		 * @param {string} id Command id to execute.
		 */
		const addedChangedCommand = (id: PeripheralDeviceCommandId) => {
			const cmds = this.core.getCollection(
				PeripheralDevicePubSubCollectionsNames.peripheralDeviceCommands
			)
			if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
			const cmd = cmds.findOne(id)
			if (!cmd) throw Error(`PeripheralCommand "${id}" not found!`)
			if (cmd.deviceId === this.core.deviceId) {
				this.executeFunction(cmd, this)
			}
		}
		observer.added = (id: PeripheralDeviceCommandId) => {
			addedChangedCommand(id)
		}
		observer.changed = (id: PeripheralDeviceCommandId) => {
			addedChangedCommand(id)
		}
		observer.removed = (id: PeripheralDeviceCommandId) => {
			this.retireExecuteFunction(id)
		}
		const cmds = this.core.getCollection(
			PeripheralDevicePubSubCollectionsNames.peripheralDeviceCommands
		)
		if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
		// any should be PeripheralDeviceCommand
		cmds.find({}).forEach((cmd) => {
			if (!this.core) {
				throw Error('functionObject.core is undefined!')
			}
			if (cmd.deviceId === this.core.deviceId) {
				this.executeFunction(cmd, this)
			}
		})
	}

	killProcess(actually: number) {
		if (actually === 1) {
			console.log('KillProcess command received, shutting down in 1000ms!')
			setTimeout(() => {
				process.exit(0)
			}, 1000)
			return true
		}
		return 0
	}

	async triggerReloadRundown(rundownId: string) {
		const { result, error } = await rundownMutations.read({ id: rundownId })
		if (error) {
			throw error
		}
		if (!result) {
			throw new Error(`No rundown found with ID "${rundownId}"`)
		}
		if (Array.isArray(result)) {
			throw new Error(`Found more than one rundown with ID "${rundownId}"`)
		}
		return await mutateRundown(result)
	}

	executeFunction(cmd: PeripheralDeviceCommand, fcnObject: CoreHandler) {
		if (cmd) {
			if (this._executedFunctions.has(cmd._id)) return // prevent it from running multiple times
			console.debug(cmd.functionName, cmd.args)
			this._executedFunctions.add(cmd._id)

			const cb = (err: unknown, res?: any) => {
				if (err) {
					if (err instanceof Error) {
						console.error('executeFunction error', err, err.stack)
					} else {
						console.error('executeFunction error', err)
					}
				}
				this.core.coreMethods.functionReply(cmd._id, err, res).catch((e) => {
					console.error(e)
				})
			}

			if (!cmd.functionName) {
				throw Error('Function name is undefined')
			}
			//@ts-expect-error - functionName is a string
			const fcn = fcnObject[cmd.functionName]
			try {
				if (!fcn) throw Error('Function "' + cmd.functionName + '" not found!')

				Promise.resolve(fcn.apply(fcnObject, cmd.args))
					.then((result) => {
						cb(null, result)
					})
					.catch((e) => {
						cb(stringifyError(e), null)
					})
			} catch (e: any) {
				cb(stringifyError(e), null)
			}
		}
	}
	retireExecuteFunction(cmdId: PeripheralDeviceCommandId): void {
		this._executedFunctions.delete(cmdId)
	}

	private _getVersions() {
		const versions: { [packageName: string]: string } = {
			'@sofie-automation/server-core-integration': serverCoreIntegrationVersion
		}

		if (process.env.npm_package_version) {
			versions['_process'] = process.env.npm_package_version
		}

		return versions
	}
}

export const coreHandler = new CoreHandler()
