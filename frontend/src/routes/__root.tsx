import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { EditorNavbar } from '~/components/navbar/navbar'

export const Route = createRootRoute({
	component: () => (
		<>
			<EditorNavbar />

			<Outlet />
			<TanStackRouterDevtools position="top-left" />
		</>
	)
})
