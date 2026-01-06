import {
	DeviceConfigManifest,
	JSONBlobStringify,
	JSONSchema
} from '@sofie-automation/server-core-integration'

const deviceConfigSchema: JSONSchema = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	properties: {},
	required: []
}
const subDeviceConfigSchema: JSONSchema = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	type: 'object',
	title: 'Rundown Editor Config',
	properties: {},
	required: []
}

export const DEVICE_CONFIG_MANIFEST: DeviceConfigManifest = {
	deviceConfigSchema: JSONBlobStringify<JSONSchema>(deviceConfigSchema),
	subdeviceManifest: {
		default: {
			displayName: 'Rundow Editor',
			configSchema: JSONBlobStringify<JSONSchema>(subDeviceConfigSchema)
		}
	}
}
