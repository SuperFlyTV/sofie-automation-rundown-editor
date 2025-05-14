import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_root/settings/')({
	loader: () => {
		throw redirect({ to: '/settings/connection' })
	}
})
