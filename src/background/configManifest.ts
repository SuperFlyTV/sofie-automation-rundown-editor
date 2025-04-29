import { DeviceConfigManifest, JSONBlobStringify, JSONSchema } from '@sofie-automation/server-core-integration'

const deviceConfigSchema: JSONSchema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	type: 'object',
	properties: {
		deviceId: {
			type: 'string',
			description: 'The ID of the device'
		},
		deviceToken: {
			type: 'string',
			description: 'The token of the device'
		}
	},
	required: ['deviceId', 'deviceToken']
}

export const DEVICE_CONFIG_MANIFEST: DeviceConfigManifest = {
	deviceConfigSchema: JSONBlobStringify<JSONSchema>(deviceConfigSchema),
	subdeviceManifest: {}
}
