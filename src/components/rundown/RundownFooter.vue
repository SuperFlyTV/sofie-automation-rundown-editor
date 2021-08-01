<template>
	<div class="footer">
		<b-breadcrumb :items="items"></b-breadcrumb>
	</div>
</template>

<script lang="ts">
import store from '@/store'
import Vue from 'vue'

export default Vue.extend({
	computed: {
		items() {
			const rundownid = this.$route.params.id
			const rundown = store.state.rundowns.find((r) => r.id === rundownid)

			const pieceId = this.$route.params.piece
			const piece = pieceId && store.state.pieces.find((p) => p.id === pieceId)

			const partId = piece ? piece.partId : this.$route.params.part
			const part = partId && store.state.parts.find((p) => p.id === partId)

			const segmentId = part ? part.segmentId : this.$route.params.segment
			const segment = segmentId && store.state.segments.find((s) => s.id === segmentId)

			return [
				{
					text: rundown?.name,
					to: '/rundown/' + rundown?.id
				},
				segment && {
					text: segment.name,
					to: `/rundown/${rundownid}/segment/${segmentId}`
				},
				part && {
					text: part.name,
					to: `/rundown/${rundownid}/part/${partId}`
				},
				piece && {
					text: piece.name,
					to: `/rundown/${rundownid}/piece/${pieceId}`
				}
			].filter((item) => item)
		}
	}
})
</script>

<style scoped>
.footer {
	background-color: #000;
	padding: 0.2em;
	font-size: 0.9em;
}
a {
	color: #bdbdbd;
}
.breadcrumb,
ol {
	margin-bottom: 0;
}
</style>
