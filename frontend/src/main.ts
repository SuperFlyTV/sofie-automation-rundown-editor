import Vue from 'vue'
import { BootstrapVue } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import App from './App.vue'
import store, { initStore } from './store'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { router } from './router'

Vue.use(BootstrapVue)

Vue.use(VueRouter)

library.add(faTimes, faPencilAlt, faTrash)
Vue.component('fa', FontAwesomeIcon)

Vue.config.productionTip = false

// initStore()

new Vue({
	store,
	router,
	render: (h) => h(App)
}).$mount('#app')
