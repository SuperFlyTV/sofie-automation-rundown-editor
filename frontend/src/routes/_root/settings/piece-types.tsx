import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_root/settings/piece-types')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/_root/settings/piece-types"!</div>
}
