import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { ToastsProvider } from '~/components/toasts/toasts'
import { useAppDispatch } from '~/store/app'
import { initStore } from '~/store/init'
import { MyErrorBoundary } from '~/util/errorBoundary'

export const Route = createRootRoute({
	component: RootRoute
})

function RootRoute() {
	const appDispatch = useAppDispatch()

	// TODO: this is a hack to get the store to initialize
	// It should be done in a better way, but this is a quick port of the old code
	useEffect(() => initStore(appDispatch), [appDispatch])

	return (
		<>
			<MyErrorBoundary>
				<ToastsProvider>
					<Outlet />
				</ToastsProvider>
			</MyErrorBoundary>
			<TanStackRouterDevtools position="top-left" />
		</>
	)
}
