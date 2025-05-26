import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router'
import { Provider } from 'react-redux'
import { store } from '~/store/store.js'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const hashHistory = createHashHistory() // Use hash history, to make it work properly in packaged Electron
const router = createRouter({ routeTree, history: hashHistory })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<RouterProvider router={router} />
		</Provider>
	</StrictMode>
)
