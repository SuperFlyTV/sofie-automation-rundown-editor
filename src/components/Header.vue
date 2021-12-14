<template>
	<div class="header d-flex justify-content-between">
		<div class="logo"></div>
		<div>
			<router-link to="/">Rundowns</router-link>
			<router-link to="/settings">Settings</router-link>
		</div>
	</div>
</template>

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
