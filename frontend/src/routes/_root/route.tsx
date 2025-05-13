import { createFileRoute, Outlet } from '@tanstack/react-router'
import { EditorNavbar } from '~/components/navbar/navbar'

export const Route = createFileRoute('/_root')({
	component: () => (
		<>
			<EditorNavbar />

			<Outlet />
		</>
	)
})
