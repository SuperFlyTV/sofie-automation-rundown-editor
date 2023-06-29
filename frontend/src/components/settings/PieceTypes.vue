<template>
	<div>
		<div class="piece-types">
			<div class="buttons d-flex flex-row justify-content-between">
				<h2>Piece types</h2>

				<b-button-group>
					<b-button @click="importPieceTypes">Import</b-button>
					<b-button @click="exportPieceTypes">Export</b-button>
				</b-button-group>
			</div>

			<div class="type" v-for="(type) in types" :key="type.id">
				<div class="header">
					<div class="colour-preview" :style="{ backgroundColor: type.colour }"></div>
					<div class="name">{{ type.name }}</div>
					<div>
						<span class="link" @click="() => toggleDetails(type.id)"><fa icon="pencil-alt"/></span>
						<span class="link" @click="() => removePieceType(type.id)"><fa icon="trash"/></span>
					</div>
				</div>
				<div v-if="type._showDetails" :class="className('body', {})">
					<piece-type :manifestId="type.id" />
				</div>
			</div>
			<b-button variant="" @click="newPieceType">New piece type</b-button>
		</div>
	</div>
</template>

<script lang="ts">
import { PieceTypeManifest } from '@/background/interfaces'
import store from '@/store'
import Vue from 'vue'
import PieceType from './PieceType.vue'
import { openFromFile, saveToFile } from '@/util/fs'

export default Vue.extend({
	components: { PieceType },
	computed: {
		types(): Array<PieceTypeManifest & { _showDetails: boolean }> {
			return store.state.piecesManifest.map((piece) => ({
				...piece,
				_showDetails: this.showDetails.includes(piece.id)
			}))
		},
		pieceTypes() {
			return store.state.piecesManifest
		}
	},
	data() {
		return {
			showDetails: [] as string[]
		}
	},
	methods: {
		toggleDetails(id: string) {
			if (this.showDetails.includes(id)) {
				this.showDetails.splice(this.showDetails.indexOf(id), 1)
			} else {
				this.showDetails.push(id)
			}
		},
		className(name: string, fields: Record<string, boolean>) {
			return {
				[name]: true,
				...fields
			}
		},
		newPieceType() {
			store.dispatch('newPieceTypeManifest')
		},
		removePieceType(id: string) {
			store.dispatch('removePieceTypeManifest', id)
		},

		exportPieceTypes() {
			saveToFile({ title: 'Export piece types', document: this.pieceTypes })
		},

		async importPieceTypes() {
			const pieceTypes = await openFromFile({ title: 'Import piece types' })
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const verify = (pieceTypes: any) =>
				Array.isArray(pieceTypes) &&
				pieceTypes.map((t) => 'id' in t && 'name' in t && 'payload' in t).filter((p) => p === false)

			if (verify(pieceTypes)) {
				pieceTypes.forEach((p: PieceTypeManifest) => {
					const existing = this.pieceTypes.find((type) => type.id === p.id)

					if (existing) {
						store.dispatch('updatePieceTypeManifest', p)
					} else {
						store.dispatch('importPieceTypeManifest', p)
					}
				})
			}
		}
	}
})
</script>

<style scoped>
.piece-types {
	width: 100%;
	display: flex;
	flex-direction: column;
}
.type {
	width: 100%;
}
.header {
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
	height: 2.5em;
	border-top: 1px solid #888;
	border-bottom: 1px solid #888;
}
.header .name {
	flex-grow: 1;
	margin: 0 0.2em;
}
/* .body {
	visibility: hidden;
}
.body.visible {
	visibility: visible;
} */
.colour-preview {
	width: 30px;
	height: 30px;
	border-radius: 3px;
}
.link {
	cursor: pointer;
	margin-left: 0.2em;
}
.buttons {
	margin-bottom: 1em;
}
</style>
