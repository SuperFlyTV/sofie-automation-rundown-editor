<template>
	<div class="rundown-editor d-flex flex-column">
		<h2>Rundown</h2>

		<b-form @submit.prevent="update">
			<b-form-group label="Name:">
				<b-form-input v-model="name"></b-form-input>
			</b-form-group>

			<b-form-group label="Sync to Sofie:">
				<b-form-checkbox switch v-model="sync"></b-form-checkbox>
			</b-form-group>

			<b-form-group label="Start date:">
				<b-form-datepicker reset-button v-model="startDate"></b-form-datepicker>
			</b-form-group>

			<b-form-group label="Start time:">
				<b-form-timepicker :disabled="!startDate" reset-button v-model="startTime"></b-form-timepicker>
			</b-form-group>

			<b-form-group label="End date:">
				<b-form-datepicker reset-button v-model="endDate"></b-form-datepicker>
			</b-form-group>

			<b-form-group label="End time:">
				<b-form-timepicker :disabled="!endDate" reset-button v-model="endTime"></b-form-timepicker>
			</b-form-group>

			<b-form-group v-for="m in metaDataManifest" :key="m.id" :label="m.label + ':'">
				<b-form-input v-if="m.type === 'number'" number :value="metaData[m.id]"
					@update="(v) => updateMetaData(m.id, v)"></b-form-input>
				<b-form-input v-if="m.type === 'string'" :value="metaData[m.id]"
					@update="(v) => updateMetaData(m.id, v)"></b-form-input>
				<b-form-checkbox v-if="m.type === 'boolean'" :value="metaData[m.id]"
					@update="(v) => updateMetaData(m.id, v)"></b-form-checkbox>
			</b-form-group>
		</b-form>

		<div class="buttons d-flex flex-row justify-content-between">
			<b-button variant="danger" v-b-modal.delete-rd>Delete</b-button>
			<div class="d-flex">
				<b-button-group>
					<b-button class="export-button" @click="exportRundown">Export</b-button>
				</b-button-group>
				<b-button-group>
					<b-button @click="reset">Cancel</b-button>
					<b-button type="submit" @click="update" variant="primary">{{ labelOnUpdateButton }}</b-button>
				</b-button-group>
			</div>
		</div>

		<b-modal id="delete-rd" title="Delete rundown" @ok="deleteRundown" ok-variant="danger" ok-title="Delete">
			<p class="my-4">Are you sure you want to delete "{{ rundown.name }}?"</p>
		</b-modal>
	</div>
</template>

<script lang="ts">
import { IpcOperation, IpcOperationType, Rundown, SerializedRundown } from '@/background/interfaces'
import { editField, literal, Nullable } from '@/util/lib'
import store from '@/store'
import Vue from 'vue'
import { saveToFile } from '../../util/fs'

const { ipcRenderer } = window

export default Vue.extend({
	computed: {
		id(): string {
			return this.$route.params.id
		},
		rundown: {
			get(): Partial<Rundown> {
				return { ...(store.state.rundowns.find((r) => r.id === this.id) || {}) }
			}
		},
		...editField('rundown', 'name'),
		...editField('rundown', 'sync'),
		...editField('rundown', 'metaData', undefined, {}),
		startDate: {
			get(): string | undefined {
				const start = this.editObject
					? this.editObject.expectedStartTime
					: this.rundown?.expectedStartTime
				if (!start) return undefined

				const date = new Date(start)
				return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
			},
			set(date: string) {
				if (!this.editObject) {
					this.editObject = {
						...this.rundown
					}
				}

				if (!date) {
					Vue.set(this.editObject, 'expectedStartTime', null)
				} else {
					Vue.set(
						this.editObject,
						'expectedStartTime',
						new Date(date + ' ' + (this.startTime || '00:00:00')).getTime()
					)
				}
			}
		},
		startTime: {
			get(): string | undefined {
				const start = this.editObject
					? this.editObject.expectedStartTime
					: this.rundown?.expectedStartTime

				if (!start) return undefined

				const date = new Date(start)
				return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
			},
			set(time: string) {
				if (!this.editObject) {
					this.editObject = {
						...this.rundown
					}
				}
				if (!time) {
					Vue.set(this.editObject, 'expectedStartTime', null)
				} else {
					Vue.set(
						this.editObject,
						'expectedStartTime',
						new Date(this.startDate + ' ' + time).getTime()
					)
				}
			}
		},
		endDate: {
			get(): string | undefined {
				const start = this.editObject
					? this.editObject.expectedEndTime
					: this.rundown?.expectedEndTime
				if (!start) return undefined

				const date = new Date(start)
				return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
			},
			set(date: string) {
				if (!this.editObject) {
					this.editObject = {
						...this.rundown
					}
				}

				if (!date) {
					Vue.set(this.editObject, 'expectedEndTime', null)
				} else {
					Vue.set(
						this.editObject,
						'expectedEndTime',
						new Date(date + ' ' + (this.startTime || '00:00:00')).getTime()
					)
				}
			}
		},
		endTime: {
			get(): string | undefined {
				const start = this.editObject
					? this.editObject.expectedEndTime
					: this.rundown?.expectedEndTime

				if (!start) return undefined

				const date = new Date(start)
				return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
			},
			set(time: string) {
				if (!this.editObject) {
					this.editObject = {
						...this.rundown
					}
				}
				if (!time) {
					Vue.set(this.editObject, 'expectedEndTime', null)
				} else {
					Vue.set(
						this.editObject,
						'expectedEndTime',
						new Date(this.startDate + ' ' + time).getTime()
					)
				}
			}
		},
		metaDataManifest() {
			return store.state.settings.rundownMetadata
		},
		labelOnUpdateButton(): string {
			return this.rundown.sync ? 'Update' : 'Save'
		}
	},
	data() {
		return {
			editObject: undefined as
				| (Partial<Omit<Rundown, 'metaData'>> & { metaData?: Nullable<Rundown['metaData']> })
				| undefined
		}
	},
	methods: {
		reset() {
			this.editObject = undefined
		},
		deleteRundown() {
			store.dispatch('removeRundown', this.id)
			this.$router.push('/')
		},
		update() {
			if (this.editObject) {
				store.dispatch('updateRundown', { ...this.editObject })
			}
		},
		updateMetaData(field: string, value: string | number | boolean | null) {
			if (!this.editObject) {
				this.editObject = {
					...this.rundown
				}
			}
			if (!this.editObject['metaData']) {
				this.editObject.metaData = {}
			}
			if (value === undefined || value === '') value = null
			this.editObject.metaData[field] = value
		},
		async exportRundown() {
			const rundown = this.rundown as Rundown
			if (!rundown.id) {
				return
			}

			if (typeof rundown.sync !== 'boolean') {
				rundown.sync = false
			}

			const segments = await ipcRenderer.invoke(
				'segments',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: rundown.id
					}
				})
			)

			const parts = await ipcRenderer.invoke(
				'parts',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: rundown.id
					}
				})
			)

			const pieces = await ipcRenderer.invoke(
				'pieces',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: rundown.id
					}
				})
			)

			saveToFile({
				title: 'Export rundown',
				document: literal<SerializedRundown>({
					rundown,
					segments,
					parts,
					pieces
				})
			})
		}
	}
})
</script>

<style scoped>
.rundown-editor {
	padding: 2em;
}

.form-group {
	margin: 0.5em 0;
}

.buttons {
	margin: 1em 0;
}

.export-button {
	margin: 0 1em;
}
</style>
