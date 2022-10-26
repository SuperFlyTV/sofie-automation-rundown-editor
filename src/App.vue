<template>
	<div id="app">
		<router-view name="header"></router-view>
		<router-view></router-view>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'

const { ipcRenderer } = window

export default Vue.extend({
	name: 'App',
	methods: {
		// eslint-disable-next-line no-undef
		handleError(_: Electron.IpcRendererEvent, error: unknown) {
			// eslint-disable-next-line no-console
			console.error(error)

			let message = 'An unknown error occurred.'
			let title = 'Error'
			if (typeof error === 'string') {
				message = error
			} else if (typeof error === 'object' && error !== null && 'message' in error) {
				/* eslint-disable @typescript-eslint/no-explicit-any */
				message = (error as any).message
				if ('errorType' in error && (error as any).errorType === 'Meteor.Error') {
					title = 'Sofie Core Error'
					message = `Error when updating rundown in Sofie Core: ${message}`
				}
				/* eslint-enable @typescript-eslint/no-explicit-any */
			}
			this.$bvModal.msgBoxOk(message, { title })
		}
	},
	created() {
		ipcRenderer.on('error', this.handleError)
	},
	destroyed() {
		ipcRenderer.removeListener('error', this.handleError)
	}
})
</script>

<style>
* {
	box-sizing: border-box;
}
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;

	background-color: #262626;
	color: #fff;

	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;

	overflow-y: hidden;
	overflow-x: auto;

	display: flex;
	flex-direction: column;
}
</style>
