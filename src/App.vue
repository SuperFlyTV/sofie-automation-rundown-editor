<template>
	<div id="app">
		<router-view name="header"></router-view>
		<router-view></router-view>
	</div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
	name: 'App'
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
}
</style>
