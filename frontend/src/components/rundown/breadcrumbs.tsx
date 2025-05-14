import Container from 'react-bootstrap/esm/Container'
import Nav from 'react-bootstrap/esm/Nav'
import Navbar from 'react-bootstrap/esm/Navbar'
import { Link, useRouterState } from '@tanstack/react-router'
import type React from 'react'
import { NavbarText } from 'react-bootstrap'
import { useAppSelector } from '~/store/app'

export function RundownBreadcrumbs({
	rundownId,
	rundownName
}: {
	rundownId: string
	rundownName: string
}) {
	const matches = useRouterState({ select: (s) => s.matches })

	console.log('matches', matches)

	const links: React.ReactNode[] = []

	// Match segment route
	const segmentMatch = matches.find((match) => match.fullPath.includes('/segment/$segmentId'))
	const segmentId = (segmentMatch?.params as Record<string, string | undefined>)?.segmentId

	// Match part route
	const partMatch = matches.find((match) => match.fullPath.includes('/segment/$segmentId'))
	const partId = (partMatch?.params as Record<string, string | undefined>)?.partId

	const segmentName = useAppSelector(
		(state) => state.segments.segments.find((s) => s.id === segmentId)?.name
	)
	const partName = useAppSelector((state) => state.parts.parts.find((p) => p.id === partId)?.name)

	if (segmentId) {
		links.push(
			<NavbarText key={`${segmentId}_/`}>/</NavbarText>,
			<Nav.Link as={Link} to={`/rundown/${rundownId}/segment/${segmentId}`} key={segmentId}>
				{segmentName || segmentId}
			</Nav.Link>
		)
	}

	if (segmentId && partId) {
		links.push(
			<NavbarText key={`${partId}_/`}>/</NavbarText>,
			<Nav.Link
				as={Link}
				to={`/rundown/${rundownId}/segment/${segmentId}/part/${partId}`}
				key={partId}
			>
				{partName || partId}
			</Nav.Link>
		)
	}

	return (
		<Navbar expand="lg" style={{ background: '#888888' }} fixed="bottom">
			<Container fluid>
				<Nav className="me-auto">
					<Nav.Link as={Link} to={`/rundown/${rundownId}`}>
						{rundownName}
					</Nav.Link>
					{links}
				</Nav>
			</Container>
		</Navbar>
	)
}
