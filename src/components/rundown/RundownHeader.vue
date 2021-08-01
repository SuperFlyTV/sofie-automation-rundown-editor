<template>
	<div class="header">
		<div class="d-flex">
			<div>Expected start: <br />{{ start }}</div>
			<div>Expected duration: <br />{{ duration }}</div>
			<div>Diff: <br />{{ diff }}</div>
		</div>
		<div class="name">
			{{ rundown.name }}
		</div>
		<div>
			<router-link class="close" to="/">
				<fa icon="times" />
			</router-link>
		</div>
	</div>
</template>

<script lang="ts">
import { Rundown } from '@/background/interfaces'
import { toTime, toTimeDiff } from '@/util/lib'
import store from '@/store'
import Vue from 'vue'
export default Vue.extend({
	computed: {
		rundown(): Partial<Rundown> {
			return store.state.rundowns.find((r) => r.id === this.$route.params.id) || {}
		},
		start(): string {
			return this.rundown.expectedStartTime
				? new Date(this.rundown.expectedStartTime).toLocaleTimeString()
				: 'Not set'
		},
		duration(): string {
			if (!this.rundown.expectedStartTime || !this.rundown.expectedEndTime) {
				return 'Not set'
			}
			const t = this.rundown.expectedEndTime - this.rundown.expectedStartTime

			return toTime(t / 1000)
		},
		diff(): string {
			if (!this.rundown.expectedStartTime || !this.rundown.expectedEndTime) {
				return '-'
			}

			const expectedDuration = this.rundown.expectedEndTime - this.rundown.expectedStartTime
			const actualDuration = store.state.parts
				.filter((p) => p.rundownId === this.rundown.id && p.payload && p.payload.duration)
				.map((p) => p.payload.duration as number)
				.reduce((a, b) => a + b, 0)

			return toTimeDiff(actualDuration - expectedDuration / 1000)
		}
	}
})
</script>

<style scoped>
.header {
	background-color: #2689ba;
	font-size: 1.2em;
}

a {
	color: white;
}
.close {
	font-size: 1.8em;
	padding: 0.2em 0.4em;
}
.name {
	line-height: 2.8em;
}
</style>
