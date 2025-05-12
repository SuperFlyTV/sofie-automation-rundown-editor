import Vue from 'vue'
import { BootstrapVue } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import store, { initStore } from './store/index.js'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { router } from './router/index.js'

Vue.use(BootstrapVue)

Vue.use(VueRouter)

library.add(faTimes, faPencilAlt, faTrash)
// eslint-disable-next-line vue/multi-word-component-names
Vue.component('Fa', FontAwesomeIcon)

Vue.config.productionTip = false

initStore()
	.then(() => {
		new Vue({
			store,
			router,
			render: (h) => h(App)
		}).$mount('#app')
	})
	.catch((err) => {
		alert('Error initializing app: ' + err)
	})
