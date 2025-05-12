<template>
	<div>
		<b-list-group>
			<b-list-group-item
				v-for="playlist in playlists"
				:key="playlist.id"
				href="#"
				class="d-flex justify-content-between align-items-center"
				:to="'/playlist/' + playlist.id"
			>
				{{ playlist.name }}
				<b-button v-b-modal.edit-playlist @click="setEditPlaylist(playlist.id)"> edit </b-button>
			</b-list-group-item>
		</b-list-group>

		<b-modal id="edit-playlist" title="Edit playlist" @hide="close">
			<b-form-input v-model="newPlaylistName" placeholder="Name..."></b-form-input>

			<template #modal-footer>
				<b-button variant="danger" @click="removePlaylist">Delete</b-button>
				<b-button variant="" @click="close">Cancel</b-button>
				<b-button variant="primary" @click="updatePlaylist">Save</b-button>
			</template>
		</b-modal>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import store from '../store'

export default Vue.extend({
	components: {},
	data() {
		return {
			newPlaylistName: '',
			editPlaylistId: ''
		}
	},
	computed: {
		playlists() {
			return store.state.playlists.map((p) => ({
				...p,
				rundowns: store.state.rundowns.filter((r) => r.playlistId === p.id)
			}))
		}
	},
	methods: {
		setEditPlaylist(id: string) {
			const pl = this.playlists.find((p) => p.id === id)
			this.editPlaylistId = id
			this.newPlaylistName = pl?.name || ''
		},
		removePlaylist() {
			store.dispatch('removePlaylist', this.editPlaylistId)
			this.editPlaylistId = ''
			this.newPlaylistName = ''
			this.$bvModal.hide('edit-playlist')
		},
		close() {
			this.editPlaylistId = ''
			this.newPlaylistName = ''
			this.$bvModal.hide('edit-playlist')
		},
		updatePlaylist() {
			store.dispatch('updatePlaylist', {
				id: this.editPlaylistId,
				name: this.newPlaylistName
			})
			this.editPlaylistId = ''
			this.newPlaylistName = ''
			this.$bvModal.hide('edit-playlist')
		}
	}
})
</script>
