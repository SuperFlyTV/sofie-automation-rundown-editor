<template>
	<div class="piece-list d-flex flex-column">
		<router-link
			class="piece d-flex"
			v-for="piece in pieces"
			:key="piece.id"
			:to="`/rundown/${rundown.id}/piece/${piece.id}`"
		>
			<div class="type" :style="{ backgroundColor: piece.manifest.colour }">
				{{ piece.manifest.shortName }}
			</div>
			<div class="name flex-grow-1">{{ piece.name }}</div>
			<div class="start">{{ piece.start }}</div>
			<div class="duration">{{ piece.duration }}</div>
		</router-link>
		<div class="piece new" v-b-modal.new-piece>New piece</div>

		<b-modal id="new-piece" title="New piece" @ok="newPiece" ok-title="Create">
			Piece type: <b-form-select v-model="newPieceType" :options="pieceTypes"></b-form-select>
		</b-modal>
	</div>
</template>

<script lang="ts">
import { Piece, PieceTypeManifest, Rundown } from '@/background/interfaces'
import { toTime } from '@/util/lib'
import store from '@/store'
import Vue from 'vue'

export default Vue.extend({
	computed: {
		rundown(): Rundown | undefined {
			return store.state.rundowns.find((r) => r.id === this.$route.params.id) || undefined
		},
		partId(): string {
			if (this.$route.params.piece) {
				const piece = store.state.pieces.find((p) => p.id === this.$route.params.piece)
				if (piece) return piece.partId
			} else if (this.$route.params.part) {
				return this.$route.params.part
			}
			return ''
		},
		segmentId(): string {
			if (this.$route.params.piece) {
				const piece = store.state.pieces.find((p) => p.id === this.$route.params.piece)
				if (piece) return piece.segmentId
			} else if (this.$route.params.part) {
				const part = store.state.parts.find((p) => p.id === this.$route.params.part)
				if (part) return part.segmentId
			}
			return ''
		},
		pieces(): (Omit<Piece, 'start' | 'duration'> & {
			start?: string
			duration?: string
			manifest?: Partial<PieceTypeManifest>
		})[] {
			return store.state.pieces
				.filter((piece) => piece.partId === this.partId)
				.map((piece) => ({
					...piece,
					start: piece.start !== undefined ? toTime(piece.start) : undefined,
					duration: piece.duration !== undefined ? toTime(piece.duration) : undefined,
					manifest: store.state.piecesManifest.find((m) => m.id === piece.pieceType) || {}
				}))
		},
		pieceTypes() {
			return store.state.piecesManifest.map((m) => ({
				value: m.id,
				text: m.name
			}))
		}
	},
	data() {
		return {
			newPieceType: undefined
		}
	},
	methods: {
		async newPiece() {
			const piece = await store.dispatch('newPiece', {
				playlistId: this.rundown?.playlistId,
				rundownId: this.rundown?.id,
				segmentId: this.segmentId,
				partId: this.partId,
				pieceType: this.newPieceType
			})
			this.$router.push(`/rundown/${this.rundown?.id}/piece/${piece.id}`)
		}
	}
})
</script>

<style scoped>
.piece-list {
	background-color: #000;
	padding: 2em;
}

a {
	color: white;
	text-decoration: none;
}

.piece {
	min-height: 2em;
	line-height: 2em;
}
.piece:hover {
	background: #777;
}
.piece div {
	border: solid 1px #000;
}
.piece .name {
	padding: 0 0.2em;
}
.piece .start,
.piece .duration {
	min-width: 60px;
}
.piece .type {
	min-width: 80px;
}
.piece .start,
.piece .duration,
.piece .type {
	text-align: center;
}

.new {
	color: #777;
}
.new:hover {
	color: white;
	cursor: pointer;
}

.active {
	border: 1px solid #009dff;
}
</style>
