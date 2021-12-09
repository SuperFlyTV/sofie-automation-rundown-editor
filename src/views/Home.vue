<template>
	<div class="home">
		<div class="d-flex justify-content-between align-items-center">
			<h2>Home</h2>
			<b-button @click="newRundown" class="m-2">New</b-button>
			<!-- <b-dropdown split text="New rundown" @click="newRundown" class="m-2">
				<b-dropdown-item href="#" v-b-modal.new-playlist>New playlist</b-dropdown-item>
			</b-dropdown> -->
		</div>

		<playlist-list />

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

		<b-modal id="new-playlist" title="Create new playlist" ok-title="Create" @ok="newPlaylist">
			<b-form-input v-model="newPlaylistName" placeholder="Name..."></b-form-input>
		</b-modal>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import store from '../store'
import PlaylistList from '../components/PlaylistList.vue'

export default Vue.extend({
	name: 'App',
	components: {
		PlaylistList
	},
	computed: {
		playlists() {
			return store.state.playlists.map((p) => ({
				...p,
				rundowns: store.state.rundowns.filter((r) => r.playlistId === p.id)
			}))
		},
		editPlaylistItem() {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return store.state.playlists.find((p) => p.id === (this as any).editPlaylist) || {}
		},

		rundowns() {
			return store.state.rundowns.filter((r) => !r.playlistId)
		}
	},
	data() {
		return {
			newPlaylistName: '',
			editPlaylistId: ''
		}
	},
	methods: {
		newPlaylist() {
			store.dispatch('newPlaylist', { name: this.newPlaylistName })
		},

		newRundown() {
			store.dispatch('newRundown', {})
		}
	}
})
</script>

<style scoped>
.home {
	padding: 2em;
}
</style>
