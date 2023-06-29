<template>
	<div class="rundown d-flex flex-column">
		<template v-if="loaded">
			<rundown-header class="" />
			<div class="body flex-grow-1 d-flex">
				<segment-list />
				<router-view class="flex-grow-1" name="rundown-left"></router-view>
				<router-view class="flex-grow-1" name="rundown-right"></router-view>
			</div>
			<rundown-footer />
		</template>
		<div v-else class="loader d-flex align-items-center justify-content-center">
			<b-spinner></b-spinner>
		</div>
	</div>
</template>

<script lang="ts">
import store from '@/store'
import Vue from 'vue'
import RundownHeader from '../components/rundown/RundownHeader.vue'
import SegmentList from '../components/rundown/SegmentList.vue'
import RundownFooter from '../components/rundown/RundownFooter.vue'

export default Vue.extend({
	components: { RundownHeader, SegmentList, RundownFooter },
	data() {
		return {
			loaded: false
		}
	},
	async mounted() {
		this.loaded = false
		await store.dispatch('loadRundown', this.$route.params.id)
		this.loaded = true
	}
})
</script>

<style scoped>
.rundown {
	height: 100%;
}
.loader {
	width: 100%;
	height: 100%;
}
.body {
	overflow: hidden;
}
.body div {
	overflow-y: auto;
}
</style>
