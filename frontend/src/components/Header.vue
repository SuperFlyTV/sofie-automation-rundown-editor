<template>
	<div class="header d-flex justify-content-between">
		<div class="d-flex align-items-center">
			<div class="logo"></div>
			<div>Core Connection Status: {{ status }}</div>
		</div>
		<div>
			<router-link to="/">Rundowns</router-link>
			<router-link to="/settings">Settings</router-link>
		</div>
	</div>
</template>

<script lang="ts">
import store from '@/store'
import Vue from 'vue'
import { CoreConnectionStatus } from '../background/interfaces'

export default Vue.extend({
	computed: {
		status() {
			const host = store.state.coreConnectionInfo.url || '127.0.0.1'
			const port = store.state.coreConnectionInfo.port || 3000
			const hostPortString = `${host}:${port}`
			if (store.state.coreConnectionInfo.status === CoreConnectionStatus.CONNECTED) {
				return `${store.state.coreConnectionInfo.status} to ${hostPortString}`
			}

			return `${store.state.coreConnectionInfo.status} from ${hostPortString}`
		}
	}
})
</script>

<style scoped>
a {
	color: white;
	line-height: 3.5em;
	margin: 0 0.5em;
	text-decoration: none;
}
a:hover {
	text-decoration: underline;
}
.header {
	background: black;
}
.logo {
	margin: 0.5em;
	width: 2.5em;
	height: 2.5em;
	background-image: url(../assets/sofie-logo.svg);
	background-repeat: no-repeat;
}
</style>
