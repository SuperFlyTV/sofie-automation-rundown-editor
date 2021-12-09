<template>
	<div class="playlists">
		<div class="d-flex justify-content-between align-items-center">
			<b-button to="/">Back</b-button>
			<h2>{{ playlist.name }}</h2>
			<b-button @click="newRundown">New</b-button>
		</div>
		<b-list-group>
			<b-list-group-item
				v-for="rundown in rundowns"
				:key="rundown.id"
				href="#"
				:to="'/rundown/' + rundown.id"
			>
				{{ rundown.name }}
			</b-list-group-item>
		</b-list-group>
	</div>
</template>

<script lang="ts">
import { Playlist, Rundown } from '@/background/interfaces'
import store from '@/store'
import Vue from 'vue'

export default Vue.extend({
	computed: {
		matchedId(): string {
			return this.$route.params.id
		},
		playlist(): Playlist | undefined {
			return store.state.playlists.find((p) => p.id === this.matchedId)
		},
		rundowns(): Rundown[] {
			return store.state.rundowns.filter((r) => r.playlistId === this.matchedId)
		}
	},
	methods: {
		newRundown() {
			store.dispatch('newRundown', { playlistId: this.matchedId })
		}
	}
})
</script>

<style scoped>
.playlist {
	padding: 2em;
}
</style>
