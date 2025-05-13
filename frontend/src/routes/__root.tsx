import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useEffect } from 'react'
import { useAppDispatch } from '~/store/app'
import { initStore } from '~/store/init'

export const Route = createRootRoute({
	component: () => {
		const appDispatch = useAppDispatch()

		// TODO: this is a hack to get the store to initialize
		// It should be done in a better way, but this is a quick port of the old code
		useEffect(() => initStore(appDispatch), [])

		return (
			<>
				<Outlet />
				<TanStackRouterDevtools position="top-left" />
			</>
		)
	}
})
