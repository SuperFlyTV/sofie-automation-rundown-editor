import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Tab, Tabs } from 'react-bootstrap'
import { MyErrorBoundary } from '~/util/errorBoundary'

export const Route = createFileRoute('/_root/settings')({
	component: RouteComponent
})

function RouteComponent() {
	const navigate = useNavigate()

	const matches = useRouterState({ select: (s) => s.matches })
	const pathPrefix = '/_root/settings/'
	const currentPath = matches.find((match) => match.id.startsWith(pathPrefix))
	const subPath = currentPath?.id.slice(pathPrefix.length) ?? ''

	const selectTab = (path: string | null) => {
		if (!path) return

		navigate({
			to: `/settings/${path}`
		})
	}

	return (
		<div className="p-4">
			<Tabs activeKey={subPath} onSelect={selectTab} className="mb-3" transition={false}>
				<Tab eventKey="connection" title="Core Connection"></Tab>
				<Tab eventKey="rundown" title="Rundown"></Tab>
				<Tab eventKey="piece-types" title="Piece types"></Tab>
			</Tabs>

			<MyErrorBoundary>
				<Outlet />
			</MyErrorBoundary>
		</div>
	)
}
