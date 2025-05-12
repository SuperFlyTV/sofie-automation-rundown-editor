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
	created() {
		ipcRenderer.on('error', this.handleError)
	},
	destroyed() {
		ipcRenderer.removeListener('error', this.handleError)
	},
	methods: {
		 
		handleError(_: Electron.IpcRendererEvent, error: unknown) {
			 
			console.error(error)

			let message = 'An unknown error occurred.'
			let title = 'Error'
			if (typeof error === 'string') {
				message = error
			} else if (typeof error === 'object' && error !== null && 'message' in error) {
				 
				message = (error as any).message
				if ('errorType' in error && (error as any).errorType === 'Meteor.Error') {
					title = 'Sofie Core Error'
					message = `Error when updating rundown in Sofie Core: ${message}`
				}
				 
			}
			this.$bvModal.msgBoxOk(message, { title })
		}
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
