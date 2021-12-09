import {
	CoreConnection,
	CoreOptions,
	DDPConnectorOptions,
	Observer,
	PeripheralDeviceAPI as P
} from '@sofie-automation/server-core-integration'
import { DEVICE_CONFIG_MANIFEST } from './configManifest'
import fs from 'fs'
import { mutations as settingsMutations } from './api/settings'

export interface DeviceConfig {
	deviceId: string
	deviceToken: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PeripheralDeviceCommand {
	_id: string

	deviceId: string
	functionName: string
	args: Array<any>

	hasReply: boolean
	reply?: any
	replyError?: any

	time: number // time
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class CoreHandler {
	public core: CoreConnection

	private _observers: Array<Observer> = []
	private _subscriptions: Array<string> = []
	private _executedFunctions: { [id: string]: boolean } = {}

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

	async init() {
		const { result: settings } = await settingsMutations.read()

		this.core.onConnected(() => {
			console.log('Core Connected!')
			this.setStatus(P.StatusCode.GOOD, [])
			// if (this._isInitialized) this.onConnectionRestored()
		})
		this.core.onDisconnected(() => {
			console.log('Core Disconnected!')
		})
		this.core.onError((err) => {
			console.log('Core Error: ' + (err.message || err.toString() || err))
		})

		const ddpConfig: DDPConnectorOptions = {
			host: (settings || {}).coreUrl || '127.0.0.1',
			port: (settings || {}).corePort || 3000
		}
		// if (this._process && this._process.certificates.length) {
		// 	ddpConfig.tlsOpts = {
		// 		ca: this._process.certificates
		// 	}
		// }
		return this.core
			.init(ddpConfig)
			.then(() => {
				this.core
					.setStatus({
						statusCode: P.StatusCode.UNKNOWN,
						messages: ['Starting up']
					})
					.catch((e) => console.warn('Error when setting status:' + e))
				// nothing
			})
			.then(() => {
				return this.setupSubscriptionsAndObservers()
			})
			.then(() => {
				// this._isInitialized = true
			})
	}

	/**
	 * Subscribes to events in the core.
	 */
	setupSubscriptionsAndObservers(): Promise<void> {
		if (this._observers.length) {
			console.log('Core: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		this._subscriptions = []

		console.log('Core: Setting up subscriptions for ' + this.core.deviceId + '..')
		return Promise.all([
			this.core.autoSubscribe('peripheralDevices', {
				_id: this.core.deviceId
			}),
			this.core.autoSubscribe('peripheralDeviceCommands', this.core.deviceId),
			this.core.autoSubscribe('peripheralDevices', this.core.deviceId)
		])
			.then((subs) => {
				this._subscriptions = this._subscriptions.concat(subs)
			})
			.then(() => {
				this.setupObserverForPeripheralDeviceCommands()

				return
			})
	}

	getCoreConnectionOptions(deviceOptions: DeviceConfig, name: string): CoreOptions {
		let credentials: {
			deviceId: string
			deviceToken: string
		}

		if (deviceOptions.deviceId && deviceOptions.deviceToken) {
			credentials = {
				deviceId: deviceOptions.deviceId,
				deviceToken: deviceOptions.deviceToken
			}
		} else if (deviceOptions.deviceId) {
			console.warn('Token not set, only id! This might be unsecure!')
			credentials = {
				deviceId: deviceOptions.deviceId + name,
				deviceToken: 'unsecureToken'
			}
		} else {
			credentials = CoreConnection.getCredentials(name.replace(/ /g, ''))
		}
		const options: CoreOptions = {
			...credentials,

			deviceCategory: P.DeviceCategory.INGEST,
			deviceType: P.DeviceType.SPREADSHEET,
			deviceSubType: P.SUBTYPE_PROCESS,

			deviceName: name,
			watchDog: false, // todo - unhardcode

			configManifest: DEVICE_CONFIG_MANIFEST
		}
		options.versions = this._getVersions()
		return options
	}

	setStatus(statusCode: P.StatusCode, messages: string[]) {
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
		const observer = this.core.observe('peripheralDeviceCommands')
		this.killProcess(0) // just make sure it exists
		this._observers.push(observer)

		/**
		 * Called when a command is added/changed. Executes that command.
		 * @param {string} id Command id to execute.
		 */
		const addedChangedCommand = (id: string) => {
			const cmds = this.core.getCollection('peripheralDeviceCommands')
			if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
			const cmd = cmds.findOne(id) as PeripheralDeviceCommand
			if (!cmd) throw Error('PeripheralCommand "' + id + '" not found!')
			if (cmd.deviceId === this.core.deviceId) {
				this.executeFunction(cmd, this)
			}
		}
		observer.added = (id: string) => {
			addedChangedCommand(id)
		}
		observer.changed = (id: string) => {
			addedChangedCommand(id)
		}
		observer.removed = (id: string) => {
			this.retireExecuteFunction(id)
		}
		const cmds = this.core.getCollection('peripheralDeviceCommands')
		if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
		cmds.find({}).forEach((cmd0) => {
			const cmd = cmd0 as PeripheralDeviceCommand
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	executeFunction(cmd: PeripheralDeviceCommand, fcnObject: any) {
		if (cmd) {
			if (this._executedFunctions[cmd._id]) return // prevent it from running multiple times
			console.debug(cmd.functionName, cmd.args)
			this._executedFunctions[cmd._id] = true
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cb = (err: unknown, res?: any) => {
				if (err) {
					if (err instanceof Error) {
						console.error('executeFunction error', err, err.stack)
					} else {
						console.error('executeFunction error', err)
					}
				}
				this.core.callMethod(P.methods.functionReply, [cmd._id, err, res]).catch((e) => {
					console.error(e)
				})
			}

			const fcn: Function = fcnObject[cmd.functionName]
			try {
				if (!fcn) throw Error('Function "' + cmd.functionName + '" not found!')

				Promise.resolve(fcn.apply(fcnObject, cmd.args))
					.then((result) => {
						cb(null, result)
					})
					.catch((e) => {
						cb(e.toString(), null)
					})
			} catch (e) {
				if (e instanceof Error) {
					cb(e.toString(), null)
				} else {
					cb(e, null)
				}
			}
		}
	}
	retireExecuteFunction(cmdId: string) {
		delete this._executedFunctions[cmdId]
	}

	private _getVersions() {
		const versions: { [packageName: string]: string } = {}

		if (process.env.npm_package_version) {
			versions['_process'] = process.env.npm_package_version
		}

		const dirNames = [
			'@sofie-automation/server-core-integration'
			// 'mos-connection'
		]
		try {
			const nodeModulesDirectories = fs.readdirSync('node_modules')
			nodeModulesDirectories.forEach((dir) => {
				try {
					if (dirNames.indexOf(dir) !== -1) {
						let file = 'node_modules/' + dir + '/package.json'
						file = fs.readFileSync(file, 'utf8')
						const json = JSON.parse(file)
						versions[dir] = json.version || 'N/A'
					}
				} catch (e) {
					console.error(e)
				}
			})
		} catch (e) {
			console.error(e)
		}
		return versions
	}
}

export const coreHandler = new CoreHandler()
