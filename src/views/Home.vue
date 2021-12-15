<template>
	<div class="home">
		<div class="d-flex justify-content-between align-items-center">
			<h2>Home</h2>
			<div class="d-flex">
				<b-button @click="newRundown" class="m-2">New</b-button>
				<b-button @click="importRundown" class="m-2">Import</b-button>
			</div>
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
				<b-button @click.prevent="exportRundown(rundown)" class="m-2">Export</b-button>
			</b-list-group-item>
		</b-list-group>

		<b-modal id="new-playlist" title="Create new playlist" ok-title="Create" @ok="newPlaylist">
			<b-form-input v-model="newPlaylistName" placeholder="Name..."></b-form-input>
		</b-modal>

		<b-modal id="rundown-import-already-exists" title="Rundown Import Error" ok-only>
			ERROR: A rundown with that ID already exists.
		</b-modal>

		<b-modal id="rundown-import-is-invalid" title="Rundown Import Error" ok-only>
			ERROR: The selected file is not a valid rundown.
		</b-modal>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import store from '../store'
import PlaylistList from '../components/PlaylistList.vue'
import {
	IpcOperation,
	IpcOperationType,
	Playlist,
	Rundown,
	SerializedRundown
} from '@/background/interfaces'
import { openFromFile, saveToFile } from '@/util/fs'
import { ipcRenderer } from 'electron'
import { literal } from '../util/lib'

export default Vue.extend({
	name: 'App',
	components: {
		PlaylistList
	},
	computed: {
		playlists(): (Playlist & { rundowns: Rundown[] })[] {
			return store.state.playlists.map((p) => ({
				...p,
				rundowns: store.state.rundowns.filter((r) => r.playlistId === p.id)
			}))
		},
		editPlaylistItem(): Partial<Playlist & { rundowns: Rundown[] }> {
			return store.state.playlists.find((p) => p.id === this.editPlaylistId) || {}
		},

		rundowns() {
			return store.state.rundowns.filter((r) => !r.playlistId)
		}
	},
	data(): {
		editPlaylistId: string
		newPlaylistName: string
	} {
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
		},

		async importRundown() {
			let rundown: unknown
			try {
				rundown = await openFromFile({ title: 'Import rundown' })
			} catch (error) {
				console.error(error)
				this.$bvModal.show('rundown-import-is-invalid')
				return
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const verify = (maybeRundown: any): maybeRundown is SerializedRundown => {
				const rundownValid =
					typeof maybeRundown === 'object' &&
					maybeRundown !== null &&
					'rundown' in maybeRundown &&
					typeof maybeRundown.rundown === 'object' &&
					maybeRundown.rundown !== null &&
					'name' in maybeRundown.rundown &&
					typeof maybeRundown.rundown.name === 'string' &&
					'id' in maybeRundown.rundown &&
					typeof maybeRundown.rundown.id === 'string' &&
					'playlistId' in maybeRundown.rundown &&
					(typeof maybeRundown.rundown.playlistId === 'string' ||
						maybeRundown.rundown.playlistId === null) &&
					'sync' in maybeRundown.rundown &&
					typeof maybeRundown.rundown.sync === 'boolean' &&
					'segments' in maybeRundown &&
					Array.isArray(maybeRundown.segments) &&
					'parts' in maybeRundown &&
					Array.isArray(maybeRundown.parts) &&
					'pieces' in maybeRundown &&
					Array.isArray(maybeRundown.pieces)

				if (!rundownValid) {
					return false
				}

				const rd = maybeRundown as Pick<SerializedRundown, 'rundown'> & {
					segments: unknown[]
					parts: unknown[]
					pieces: unknown[]
				}

				/* eslint-disable @typescript-eslint/no-explicit-any */
				const segmentsValid = rd.segments.every((segment: any) => {
					return (
						typeof segment === 'object' &&
						segment !== null &&
						'name' in segment &&
						typeof segment.name === 'string' &&
						'rank' in segment &&
						typeof segment.rank === 'number' &&
						'id' in segment &&
						typeof segment.id === 'string' &&
						'rundownId' in segment &&
						typeof segment.rundownId === 'string' &&
						'playlistId' in segment &&
						(typeof segment.playlistId === 'string' || segment.playlistId === null)
					)
				})

				const partsValid = rd.parts.every((part: any) => {
					return (
						typeof part === 'object' &&
						part !== null &&
						'name' in part &&
						typeof part.name === 'string' &&
						'rank' in part &&
						typeof part.rank === 'number' &&
						'id' in part &&
						typeof part.id === 'string' &&
						'rundownId' in part &&
						typeof part.rundownId === 'string' &&
						'playlistId' in part &&
						(typeof part.playlistId === 'string' || part.playlistId === null)
					)
				})

				const piecesValid = rd.pieces.every((piece: any) => {
					return (
						typeof piece === 'object' &&
						piece !== null &&
						'name' in piece &&
						typeof piece.name === 'string' &&
						'id' in piece &&
						typeof piece.id === 'string' &&
						'rundownId' in piece &&
						typeof piece.rundownId === 'string' &&
						'playlistId' in piece &&
						(typeof piece.playlistId === 'string' || piece.playlistId === null)
					)
				})

				return segmentsValid && partsValid && piecesValid
			}

			if (verify(rundown)) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const existing = this.rundowns.find((rd) => rd.id === (rundown as any).id)
				if (existing) {
					this.$bvModal.show('rundown-import-already-exists')
				} else {
					store.dispatch('importRundown', rundown)
				}
			} else {
				this.$bvModal.show('rundown-import-is-invalid')
			}
		},
		async exportRundown(rundown: Rundown) {
			const segments = await ipcRenderer.invoke(
				'segments',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: rundown.id
					}
				})
			)

			const parts = await ipcRenderer.invoke(
				'parts',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: rundown.id
					}
				})
			)

			const pieces = await ipcRenderer.invoke(
				'pieces',
				literal<IpcOperation>({
					type: IpcOperationType.Read,
					payload: {
						rundownId: rundown.id
					}
				})
			)

			saveToFile({
				title: 'Export rundown',
				document: literal<SerializedRundown>({
					rundown,
					segments,
					parts,
					pieces
				})
			})
		}
	}
})
</script>

<style scoped>
.home {
	padding: 2em;
}
</style>
