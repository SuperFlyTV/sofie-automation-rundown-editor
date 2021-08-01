<template>
	<div class="segment-list d-flex flex-column">
		<draggable :list="sortableSegments" group="segments" @change="changeSegments">
			<div class="part-list d-flex flex-column" v-for="segment in segments" :key="segment.id">
				<router-link
					:to="`/rundown/${rundown.id}/segment/${segment.id}`"
					:class="classes('segment', { floated: segment.float })"
				>
					{{ segment.name }}
					<span class="time">{{ displayTime(segment.duration) }}</span>
				</router-link>
				<draggable
					class="d-flex flex-column"
					:list="segment.parts.map((p) => p.id)"
					:group="partGroup(segment.id)"
					@change="(ev) => changeParts2(segment.id, ev)"
				>
					<router-link
						:to="`/rundown/${rundown.id}/part/${part.id}`"
						:class="classes('part', { floated: segment.float || part.float })"
						v-for="part in segment.parts"
						:key="part.id"
					>
						{{ part.name }}
						<span class="time">{{ displayTime(part.payload.duration) }}</span>
					</router-link>
				</draggable>
				<div class="part new" @click="newPart(segment.id)">New part</div>
			</div>
		</draggable>
		<div class="segment new" @click="newSegment">New segment</div>
	</div>
</template>

<script lang="ts">
import { Part, Rundown, Segment } from '@/background/interfaces'
import store from '@/store'
import Vue from 'vue'
import draggable from 'vuedraggable'

export default Vue.extend({
	components: { draggable },
	computed: {
		rundown(): Rundown | undefined {
			return store.state.rundowns.find((r) => r.id === this.$route.params.id) || undefined
		},
		segments() {
			// todo filter for rundown id
			return store.state.segments
				.map((segment) => ({
					...segment,
					duration: store.state.parts
						.filter((p) => p.segmentId === segment.id)
						.map((p) => p.payload?.duration || 0)
						.reduce((a, b) => a + b, 0),
					parts: store.state.parts
						.filter((p) => p.segmentId === segment.id)
						.sort((a, b) => (a.rank || 0) - (b.rank || 0))
						.map((p) => ({
							...p,
							payload: p.payload || {}
						}))
				}))
				.sort((a, b) => (a.rank || 0) - (b.rank || 0))
		},
		sortableSegments: {
			get() {
				return store.state.segments
					.sort((a, b) => (a.rank || 0) - (b.rank || 0))
					.map((segment) => segment.id)
			},
			set(list: any) {
				console.log(list)
			}
		}
	},
	data() {
		return {
			lastPartListMutation: undefined as
				| {
						segmentId: string
						partId: string
						index: number
						futureIndex: number
				  }
				| undefined
		}
	},
	methods: {
		newSegment() {
			if (this.rundown)
				store.dispatch('newSegment', {
					playlistId: this.rundown.playlistId,
					rundownId: this.rundown.id,
					rank: this.segments.length
				})
		},
		newPart(id: string) {
			const segment = this.segments.find((s) => id === s.id)
			if (this.rundown)
				store.dispatch('newPart', {
					playlistId: this.rundown.playlistId,
					rundownId: this.rundown.id,
					segmentId: id,
					rank: segment?.parts.length
				})
		},

		displayTime(seconds: number) {
			if (!seconds) return

			const h = Math.floor(seconds / 3600)
			const m = Math.floor((seconds % 3600) / 60)
			const s = Math.floor(seconds % 60)
			const pad = (t: number) => ('00' + t).substr(-2)

			return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`
		},

		classes(name: string, conditionals: Record<string, boolean>) {
			return {
				[name]: true,
				...conditionals
			}
		},

		partGroup(id: string) {
			return {
				name: id,
				pull: store.state.segments.map((p) => p.id),
				put: store.state.segments.map((p) => p.id)
			}
		},

		changeParts2(segmentId: string, ev: any) {
			const segment = this.segments.find((s) => s.id === segmentId)
			if (!segment) return

			if ('moved' in ev) {
				const { oldIndex, newIndex, element: id } = ev.moved
				const delta = oldIndex > newIndex ? 1 : -1
				const partsToUpdate = segment.parts
					.filter(
						(_, i) =>
							(delta > 0 && i < oldIndex && i >= newIndex) ||
							(delta < 0 && i > oldIndex && i <= newIndex)
					)
					.map(
						(s): Partial<Part> => ({
							id: s.id,
							rundownId: s.rundownId,
							segmentId: s.segmentId,
							rank: s.rank + delta
						})
					)

				store.dispatch('updatePart', {
					id,
					rundownId: this.rundown?.id,
					segmentId: segment.id,
					rank: newIndex
				})
				partsToUpdate.forEach((p) => {
					store.dispatch('updatePart', p)
				})
			} else if ('added' in ev) {
				const { newIndex, element: id } = ev.added

				const partsToUpdate = segment.parts
					.filter((p) => p.rank >= newIndex)
					.map((p) => ({
						id: p.id,
						rundownId: p.rundownId,
						segmentId: p.segmentId,
						rank: p.rank + 1
					}))

				store.dispatch('updatePart', {
					id,
					rundownId: this.rundown?.id,
					segmentId: segment.id,
					rank: newIndex
				})
				partsToUpdate.forEach((p) => {
					store.dispatch('updatePart', p)
				})
			} else if ('removed' in ev) {
				const { oldIndex, element: id } = ev.added

				const partsToUpdate = segment.parts
					.filter((p) => p.rank > oldIndex)
					.map((p) => ({
						id: p.id,
						rundownId: p.rundownId,
						segmentId: p.segmentId,
						rank: p.rank - 1
					}))

				partsToUpdate.forEach((p) => {
					store.dispatch('updatePart', p)
				})
			}
		},
		changeSegments(ev: any) {
			if ('moved' in ev) {
				const { oldIndex, newIndex, element: id } = ev.moved
				const delta = oldIndex > newIndex ? 1 : -1
				const segmentsToUpdate = this.segments
					.filter(
						(_, i) =>
							(delta > 0 && i < oldIndex && i >= newIndex) ||
							(delta < 0 && i > oldIndex && i <= newIndex)
					)
					.map(
						(s): Partial<Segment> => ({
							id: s.id,
							rank: s.rank + delta
						})
					)

				store.dispatch('updateSegment', {
					id,
					rank: newIndex
				})
				segmentsToUpdate.forEach((s) => {
					store.dispatch('updateSegment', s)
				})
			}
		}
	}
})
</script>

<style scoped>
.segment-list {
	width: 300px;
}

a {
	color: white;
	text-decoration: none;
}

.segment {
	background-color: #4b4b4b;
	width: 100%;
	font-size: 1.2em;
	line-height: 2em;
	height: 2.4em;
	padding: 0.2em;
}

.new {
	color: #777;
}
.new:hover {
	color: white;
	cursor: pointer;
}

.part-list div {
	min-height: 1px;
}

.part {
	width: 100%;
	font-size: 1em;
	line-height: 1.5em;
	height: 1.6em;
	padding: 0.2em;
}
.part:hover {
	background-color: #777;
}

.time {
	font-size: 0.7em;
	color: #b2b2b2;
}

.floated {
	text-decoration: line-through;
}

.active,
.router-link-active {
	border: 1px solid #009dff;
}
</style>
