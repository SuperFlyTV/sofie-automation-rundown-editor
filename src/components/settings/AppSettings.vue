<template>
	<div class="app-settings">
		<h2>Settings</h2>

		<div>
			<label for="coreUrl">Core connection:</label>
			<input v-model="coreUrl" type="text" placeholder="Core URL" name="coreUrl" />

			<input v-model="corePort" type="number" placeholder="Core Port" name="corePort" />
		</div>

		<div>
			<label for="id">Part types:</label>
			<input v-model="partTypes" type="text" name="id" />
		</div>

		<div>
			<h4>Rundown Metadata Fields:</h4>

			<div v-for="(field, i) in rundownMetadata" :key="i" class="field-editor">
				<label for="id">Field ID:</label>
				<input v-model="field.id" type="text" name="id" @click="createEditObj" />

				<label for="label">Label:</label>
				<input v-model="field.label" type="text" name="label" @click="createEditObj" />

				<label for="type">Type:</label>
				<select id="type" v-model="field.type" name="type" @change="createEditObj">
					<option v-for="(type, entry) in fieldTypes" :key="type" :value="type">{{ entry }}</option>
				</select>

				<span class="link" @click="() => removeField(field.id)"><Fa icon="trash" /></span>
			</div>
			<b-button variant="primary" @click="() => newField()">+</b-button>
		</div>

		<div class="buttons d-flex flex-row">
			<b-button-group>
				<b-button @click="reset">Cancel</b-button>
				<b-button variant="primary" @click="update">Save</b-button>
			</b-button-group>
		</div>
	</div>
</template>

<script lang="ts">
import { ApplicationSettings, ManifestFieldType } from '@/background/interfaces'
import { editField } from '@/util/lib'
import store from '@/store'
import Vue from 'vue'

type EditApplicationSettings = Omit<ApplicationSettings, 'partTypes'> & { partTypes: string }

export default Vue.extend({
	data() {
		return {
			editObject: undefined as EditApplicationSettings | undefined,
			fieldTypes: ManifestFieldType
		}
	},
	computed: {
		settings(): EditApplicationSettings {
			return {
				...store.state.settings,
				partTypes: store.state.settings.partTypes.join(', ')
			}
		},
		...editField('settings', 'coreUrl'),
		...editField('settings', 'corePort'),
		...editField('settings', 'partTypes'),
		...editField('settings', 'rundownMetadata')
	},
	methods: {
		createEditObj() {
			if (!this.editObject) {
				this.editObject = {
					...this.settings,
					rundownMetadata: [...(this.settings.rundownMetadata || [])]
				}
			}
		},
		removeField(id: string) {
			if (!this.editObject) {
				this.editObject = {
					...this.settings,
					rundownMetadata: [...(this.settings.rundownMetadata || [])]
				}
			}
			if (!this.editObject?.rundownMetadata) {
				this.editObject.rundownMetadata = [...(this.settings?.rundownMetadata || [])]
			}

			this.editObject.rundownMetadata = this.editObject?.rundownMetadata.filter((m) => m.id !== id)
		},
		newField() {
			if (!this.editObject) {
				this.editObject = {
					...this.settings,
					rundownMetadata: [...(this.settings.rundownMetadata || [])]
				}
			}
			if (!this.editObject?.rundownMetadata) {
				this.editObject.rundownMetadata = [...(this.settings?.rundownMetadata || [])]
			}

			this.editObject.rundownMetadata.push({ id: '', label: '', type: ManifestFieldType.String })
		},
		reset() {
			this.editObject = undefined
		},
		update() {
			if (this.editObject) {
				store.dispatch('updateSettings', {
					...this.editObject,
					partTypes: this.editObject.partTypes.split(',').map((type) => type.trim())
				})
			}
		}
	}
})
</script>

<style scoped>
.app-settings div {
	margin: 0.2em 0;
}
.field-editor {
	display: flex;
	align-items: center;
}
.field-editor input {
	flex-grow: 1;
}
.link {
	cursor: pointer;
}
</style>
