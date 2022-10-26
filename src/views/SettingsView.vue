<template>
	<div class="settings">
		<settings />
		<piece-types />
	</div>
</template>

<script lang="ts">
import Vue from 'vue'
import PieceTypes from '@/components/settings/PieceTypes.vue'
import Settings from '@/components/settings/AppSettings.vue'

export default Vue.extend({
	components: { PieceTypes, Settings }
})
</script>

<style scoped>
.settings {
	padding: 0.5em;
	overflow-y: auto;
	max-height: 100%;
}
</style>
