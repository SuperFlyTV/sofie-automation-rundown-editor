<template>
	<div class="segment-editor d-flex flex-column">
		<h2>Part</h2>

		<b-form-group label="Name:">
			<b-form-input v-model="name"></b-form-input>
		</b-form-group>

		<b-form-group label="Float:">
			<b-form-checkbox v-model="float"></b-form-checkbox>
		</b-form-group>

		<b-form-group label="Type:">
			<!-- <b-form-input v-model="type"></b-form-input> -->
		</b-form-group>
		<b-form-select v-model="type" :options="types"></b-form-select>

		<b-form-group label="Duration:">
			<b-form-input number v-model="duration"></b-form-input>
		</b-form-group>

		<b-form-group label="Script:">
			<b-form-textarea v-model="script"></b-form-textarea>
		</b-form-group>

		<div class="buttons d-flex flex-row justify-content-between">
			<b-button variant="danger" v-b-modal.delete-rd>Delete</b-button>
			<b-button-group>
				<b-button @click="reset">Cancel</b-button>
				<b-button @click="update" variant="primary">Save</b-button>
			</b-button-group>
		</div>

		<b-modal
			id="delete-rd"
			title="Delete segment"
			@ok="deleteRundown"
			ok-variant="danger"
			ok-title="Delete"
		>
			<p class="my-4">Are you sure you want to delete "{{ part.name }}?"</p>
		</b-modal>
	</div>
</template>

<script lang="ts">
import { Part, Rundown, Segment } from '@/background/interfaces'
import store from '@/store'
import Vue from 'vue'

const editField = <T extends any>(field: string, index?: string) => ({
	[field]: {
		get(): T | undefined {
			const self = this as any
			// console.log((this as any).part[field])
			if (index) {
				return self.editObject ? self.editObject[index]?.[field] : self.part?.[index]?.[field]
			} else {
				return self.editObject ? self.editObject[field] : self.part?.[field]
			}
		},
		set(value: T) {
			const self = this as any
			if (!self.editObject) {
				self.editObject = {
					...self.part
				}
			}
			if (index) {
				if (!self.editObject[index]) self.editObject[index] = {}

				self.editObject[index][field] = value
			} else {
				self.editObject[field] = value
			}
		}
	}
})

export default Vue.extend({
	computed: {
		id(): string {
			return this.$route.params.part
		},
		rundown: {
			get(): Partial<Rundown> {
				return { ...(store.state.rundowns.find((r) => r.id === this.$route.params.id) || {}) }
			}
		},
		part() {
			return store.state.parts.find((s) => s.id === this.$route.params.part)
		},

		...editField<string>('name'),
		...editField<boolean>('float'),
		...editField<string>('type', 'payload'),
		...editField<number>('duration', 'payload'),
		...editField<number>('script', 'payload'),

		types() {
			return store.state.settings.partTypes
		}
	},
	data() {
		return {
			editObject: undefined as Partial<Part> | undefined
		}
	},
	methods: {
		reset() {
			this.editObject = undefined
		},
		deleteRundown() {
			store.dispatch('removePart', this.id)
			this.$router.push('/rundown/' + this.rundown.id)
		},
		update() {
			if (this.editObject) {
				console.log({
					...this.editObject,
					payload: {
						...(this.editObject.payload || {})
					}
				})
				store.dispatch('updatePart', {
					...this.editObject,
					payload: {
						...(this.editObject.payload || {})
					}
				})
			}
		}
	},
	watch: {
		$route: function() {
			this.editObject = undefined
		}
	}
})
</script>

<style scoped>
.segment-editor {
	padding: 2em;
}
.form-group {
	margin: 0.5em 0;
}
.buttons {
	margin: 1em 0;
}
</style>
