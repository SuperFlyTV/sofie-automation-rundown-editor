import { ipcMain } from 'electron'
import {
	DBSettings,
	IpcOperation,
	IpcOperationType,
	ApplicationSettings,
	MutationApplicationSettingsCreate,
	MutationApplicationSettingsUpdate
} from '../interfaces'
import { db } from '../db'

export const mutations = {
	async create(
		payload: MutationApplicationSettingsCreate
	): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const document = {
			...payload
		}

		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			INSERT INTO settings (id,document)
			VALUES ("settings",json(?));
		`,
				[JSON.stringify(document)],
				function(e: Error | null) {
					if (e) {
						resolve({ result: undefined, error: e })
					} else if (this) {
						resolve({ result: this.lastID, error: undefined })
					}
				}
			)
		)

		if (result) {
			console.log(result)
			const { result: returnResult, error } = await mutations.read()

			if (returnResult && !Array.isArray(returnResult)) {
				return { result: returnResult }
			}
			if (error) {
				return { error }
			}

			return { error: new Error('Unknonw error') }
		}

		return { error: error as Error }
	},
	async read(): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const { result, error } = await new Promise<{ error?: Error; result?: DBSettings }>((resolve) =>
			db.get(
				`
			SELECT *
			FROM settings
			WHERE id = "settings"
			LIMIT 1;
		`,
				(error, result) => resolve({ error: error || undefined, result })
			)
		)

		if (result) {
			return {
				result: {
					...JSON.parse(result.document)
				}
			}
		} else {
			return { error }
		}
	},
	async update(
		payload: MutationApplicationSettingsUpdate
	): Promise<{ result?: ApplicationSettings; error?: Error }> {
		const update = {
			...payload
		}
		const { result, error } = await new Promise((resolve) =>
			db.run(
				`
			UPDATE settings
			SET document = (SELECT json_patch(settings.document, json(?)) FROM settings WHERE id = "settings")
			WHERE id = "settings";
		`,
				[JSON.stringify(update)],
				(e) =>
					e ? resolve({ result: undefined, error: e }) : resolve({ result: true, error: undefined })
			)
		)

		if (result) {
			const { result: returnResult, error } = await mutations.read()

			if (returnResult && !Array.isArray(returnResult)) {
				return { result: returnResult }
			}
			if (error) {
				return { error }
			}

			return { error: new Error('Unknown error') }
		}

		return error
	}
}

ipcMain.handle('settings', async (_, operation: IpcOperation) => {
	if (operation.type === IpcOperationType.Create) {
		const { result, error } = await mutations.create(operation.payload)

		return result || error
	} else if (operation.type === IpcOperationType.Read) {
		const { result, error } = await mutations.read()

		return result || error
	} else if (operation.type === IpcOperationType.Update) {
		const { result, error } = await mutations.update(operation.payload)

		return result || error
	}
})

mutations.read().then(({ result }) => {
	if (!result) {
		mutations.create({
			partTypes: [],
			rundownMetadata: []
		})
	}
})
