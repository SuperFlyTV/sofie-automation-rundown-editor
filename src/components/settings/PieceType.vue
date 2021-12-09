<template>
	<div class="type-editor">
		<h4>Piece Manifest:</h4>
		<div>
			<label for="id">ID:</label>
			<input type="text" name="id" v-model="id" />
		</div>

		<div>
			<label for="name">Name:</label>
			<input type="text" name="name" v-model="name" />
		</div>

		<div>
			<label for="shortName">Short Name:</label>
			<input type="text" name="shortName" v-model="shortName" />
		</div>

		<div>
			<label for="colour">Colour:</label>
			<input type="text" name="colour" v-model="colour" />
		</div>

		<div>
			<label for="includeTypeInName">Include in name:</label>
			<input type="checkbox" name="includeTypeInName" v-model="includeTypeInName" />
		</div>

		<div>
			<h4>Fields:</h4>

			<div class="field-editor" v-for="(field, i) in payload" :key="i">
				<label for="id">Field ID:</label>
				<input type="text" name="id" v-model="field.id" @click="createEditObj" />

				<label for="label">Label:</label>
				<input type="text" name="label" v-model="field.label" @click="createEditObj" />

				<label for="type">Type:</label>
				<select name="type" id="type" v-model="field.type" @change="createEditObj">
					<option v-for="(type, entry) in fieldTypes" :key="type" :value="type">{{ entry }}</option>
				</select>

				<label for="includeInName">Include in name:</label>
				<input
					type="checkbox"
					name="includeInName"
					v-model="field.includeInName"
					@click="createEditObj"
				/>

				<span class="link" @click="() => removeField(field.id)"><fa icon="trash"/></span>
			</div>
			<b-button variant="primary" @click="() => newField()">+</b-button>
		</div>

		<div class="buttons d-flex flex-row justify-content-end ">
			<b-button-group>
				<b-button @click="reset">Cancel</b-button>
				<b-button @click="update" variant="primary">Save</b-button>
			</b-button-group>
		</div>
	</div>
</template>

<script lang="ts">
import { ManifestFieldType, PieceTypeManifest } from '@/background/interfaces'
import { editField } from '@/util/lib'
import store from '@/store'
import Vue from 'vue'

export default Vue.extend({
	props: {
		manifestId: String
	},
	computed: {
		item(): Partial<PieceTypeManifest> {
			const item = store.state.piecesManifest.find((m) => m.id === this.manifestId)

			return item || {}
		},
		...editField('item', 'id'),
		...editField('item', 'name'),
		...editField('item', 'shortName'),
		...editField('item', 'colour'),
		...editField('item', 'includeTypeInName'),
		...editField('item', 'payload')
	},
	data() {
		return {
			editObject: undefined as Partial<PieceTypeManifest> | undefined,
			fieldTypes: ManifestFieldType
		}
	},
	methods: {
		createEditObj() {
			if (!this.editObject) {
				this.editObject = {
					...this.item,
					payload: (this.item.payload || []).map((item) => ({ ...item }))
				}
			}
		},
		reset() {
			this.editObject = undefined
		},
		update() {
			if (this.editObject) {
				store.dispatch('updatePieceTypeManifest', { update: this.editObject, id: this.manifestId })
			}
		},
		newField() {
			if (!this.editObject) {
				this.editObject = {
					...this.item,
					payload: [...(this.item.payload || [])]
				}
			}
			if (!this.editObject.payload) {
				this.editObject.payload = [...(this.item.payload || [])]
			}
			const count = this.editObject.payload.filter((f) => f.id.startsWith('new')).length

			this.editObject.payload.push({
				id: 'new' + count,
				label: 'New field',
				type: ManifestFieldType.String
			})
		},
		removeField(id: string) {
			if (!this.editObject) {
				this.editObject = {
					...this.item,
					payload: [...(this.item.payload || [])]
				}
			}
			if (!this.editObject.payload) {
				this.editObject.payload = [...(this.item.payload || [])]
			}

			this.editObject.payload = this.editObject.payload.filter((f) => f.id !== id)
		}
	}
})
</script>

<style scoped>
.type-editor {
	padding: 0.5em;
}
.type-editor div {
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
