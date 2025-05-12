<template>
	<div class="segment-editor d-flex flex-column">
		<h2>Segment</h2>
		<b-form @submit.prevent="update">
			<b-form-group label="Name:">
				<b-form-input v-model="name"></b-form-input>
			</b-form-group>

			<b-form-group label="Float:">
				<b-form-checkbox v-model="float"></b-form-checkbox>
			</b-form-group>
		</b-form>

		<div class="buttons d-flex flex-row justify-content-between">
			<b-button variant="danger" v-b-modal.delete-rd>Delete</b-button>
			<b-button-group>
				<b-button @click="reset">Cancel</b-button>
				<b-button type="submit" @click="update" variant="primary">{{
					labelOnUpdateButton
				}}</b-button>
			</b-button-group>
		</div>

		<b-modal
			id="delete-rd"
			title="Delete segment"
			@ok="deleteRundown"
			ok-variant="danger"
			ok-title="Delete"
		>
			<p class="my-4">Are you sure you want to delete "{{ segment.name }}?"</p>
		</b-modal>
	</div>
</template>

<script lang="ts">
import { Rundown, Segment } from '@/background/interfaces'
import store from '@/store'
import Vue from 'vue'

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
		segment() {
			return store.state.segments.find((s) => s.id === this.$route.params.segment)
		},

		name: {
			get(): string | undefined {
				return this.editObject ? this.editObject.name : this.segment?.name
			},
			set(name: string) {
				if (!this.editObject) this.editObject = { ...this.segment }
				Vue.set(this.editObject, 'name', name)
			}
		},

		float: {
			get(): boolean | undefined {
				return this.editObject ? this.editObject.float : this.segment?.float
			},
			set(float: boolean) {
				if (!this.editObject) this.editObject = { ...this.segment }
				Vue.set(this.editObject, 'float', float)
			}
		},
		labelOnUpdateButton(): string {
			return this.rundown.sync ? 'Update' : 'Save'
		}
	},
	data() {
		return {
			editObject: undefined as Partial<Segment> | undefined
		}
	},
	methods: {
		reset() {
			this.editObject = undefined
		},
		deleteRundown() {
			store.dispatch('removeSegment', this.segment?.id)
			this.$router.push('/rundown/' + this.rundown.id)
		},
		update() {
			if (this.editObject) {
				store.dispatch('updateSegment', { ...this.editObject })
			}
		}
	},
	watch: {
		$route: function () {
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
