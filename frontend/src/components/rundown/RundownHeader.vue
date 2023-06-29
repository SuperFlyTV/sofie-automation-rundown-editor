<template>
	<div class="header">
		<div class="name">
			<router-link :to="'/rundown/' + rundown.id">{{ rundown.name }}</router-link>
		</div>
		<div class="d-flex justify-content-between">
			<div class="d-grid timing">
				<div class="label">Expected start:</div>
				<div>{{ start }}</div>
				<div class="label">Expected duration:</div>
				<div>{{ duration }}</div>
				<div class="label">Diff:</div>
				<div>{{ diff }}</div>
			</div>
			<div>
				<router-link class="close" to="/">
					<fa icon="times" />
				</router-link>
			</div>
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
	text-decoration: none;
}
.close {
	font-size: 1.8em;
	padding: 0.2em 0.4em;
}
.name {
	line-height: 2.8em;
	height: 0;
	text-align: center;
}
.timing {
	display: grid;
	grid-template-columns: auto auto auto;
	grid-template-rows: auto auto;
	gap: 0 0.2em;
	grid-auto-flow: column;
}
.timing .label {
	font-size: 0.8em;
}
</style>
