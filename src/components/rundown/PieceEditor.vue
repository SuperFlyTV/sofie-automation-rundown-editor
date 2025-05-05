<template>
	<div class="segment-editor d-flex flex-column">
		<h2>Piece</h2>

		<b-form @submit.prevent="update">

			<!-- <b-form-group label="Float:">
			<b-form-checkbox v-model="float"></b-form-checkbox>
		</b-form-group> -->

			<p>Piece type: {{ pieceManifest.name }}</p>

			<b-form-group label="Duration:">
				<b-form-input number v-model="duration"></b-form-input>
			</b-form-group>

			<b-form-group label="Start:">
				<b-form-input number v-model="start"></b-form-input>
			</b-form-group>

			<b-form-group v-for="m in pieceManifest.payload" :key="m.id" :label="m.label + ':'">
				<b-form-input v-if="m.type === 'number'" number :value="payload[m.id]"
					@update="(v) => updatePayload(m.id, v)"></b-form-input>
				<b-form-input v-if="m.type === 'string'" :value="payload[m.id]"
					@update="(v) => updatePayload(m.id, v)"></b-form-input>
				<b-form-checkbox v-if="m.type === 'boolean'" :checked="payload[m.id]"
					@input="(v) => updatePayload(m.id, v)"></b-form-checkbox>
			</b-form-group>

			<div class="buttons d-flex flex-row justify-content-between">
				<b-button variant="danger" v-b-modal.delete-rd>Delete</b-button>
				<b-button-group>
					<b-button @click="reset">Cancel</b-button>
					<b-button type="submit" @click="update" variant="primary">{{ labelOnUpdateButton }}</b-button>
				</b-button-group>
			</div>
		</b-form>

		<b-modal id="delete-rd" title="Delete segment" @ok="deletePiece" ok-variant="danger" ok-title="Delete">
			<p class="my-4">Are you sure you want to delete "{{ piece.name }}?"</p>
		</b-modal>
	</div>
</template>

<script lang="ts">
import { Piece, PieceTypeManifest, Rundown } from '@/background/interfaces'
import { editField, Nullable } from '@/util/lib'
import store from '@/store'
import Vue from 'vue'

export default Vue.extend({
	computed: {
		id(): string {
			return this.$route.params.piece
		},
		rundown: {
			get(): Partial<Rundown> {
				return { ...(store.state.rundowns.find((r) => r.id === this.$route.params.id) || {}) }
			}
		},
		piece(): Piece | undefined {
			return store.state.pieces.find((p) => p.id === this.$route.params.piece)
		},
		pieceManifest(): Partial<PieceTypeManifest> {
			return store.state.piecesManifest.find((m) => m.id === this.piece?.pieceType) || {}
		},

		payload: {
			get(): Piece['payload'] {
				return this.piece?.payload || {}
			}
		},
		labelOnUpdateButton(): string {
			return this.rundown.sync ? 'Update' : 'Save'
		},

		...editField('piece', 'duration'),
		...editField('piece', 'start')
	},
	data() {
		return {
			editObject: undefined as
				| (Partial<Omit<Piece, 'payload'>> & { payload?: Nullable<Piece['payload']> })
				| undefined
		}
	},
	methods: {
		reset() {
			this.editObject = undefined
		},
		deletePiece() {
			const partId = this.piece?.partId
			store.dispatch('removePiece', this.id)
			this.$router.push(`/rundown/${this.rundown.id}/part/${partId}`)
		},
		updatePayload<T extends keyof Piece['payload']>(field: T, value: Piece['payload'][T] | null) {
			if (!this.editObject) {
				this.editObject = {
					...this.piece
				}
			}
			if (!this.editObject['payload']) {
				this.editObject.payload = {}
			}
			if (value === undefined || value === '') value = null
			this.editObject.payload[field] = value
		},
		update() {
			if (!this.pieceManifest.payload) {
				// This should only happen on Pieces which no longer have a valid Piece Manifest type.
				return
			}

			let name = this.pieceManifest.includeTypeInName ? this.pieceManifest.name + ' ' : ''
			name += this.pieceManifest.payload
				.filter((m) => m.includeInName)
				.map((m) => m.id)
				.map((id) => this.editObject?.payload?.[id])
				.join(' - ')

			if (this.editObject) {
				store.dispatch('updatePiece', {
					...this.editObject,
					name,
					payload: {
						...(this.editObject.payload || {})
					}
				})
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
