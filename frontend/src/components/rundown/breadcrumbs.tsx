import Container from 'react-bootstrap/esm/Container'
import Nav from 'react-bootstrap/esm/Nav'
import Navbar from 'react-bootstrap/esm/Navbar'
import { Link, useRouterState } from '@tanstack/react-router'
import type React from 'react'
import { NavbarText } from 'react-bootstrap'
import { useAppSelector } from '~/store/app'
import type { CSSProperties } from 'react'

export function RundownBreadcrumbs({ rundownId }: { rundownId: string }) {
	const matches = useRouterState({ select: (s) => s.matches })

	// console.log('matches', matches)

	const links: React.ReactNode[] = []

	// Match segment route
	const segmentMatch = matches.find((match) => match.fullPath.includes('/segment/$segmentId'))
	const segmentId = (segmentMatch?.params as Record<string, string | undefined>)?.segmentId

	// Match part route
	const partMatch = matches.find((match) => match.fullPath.includes('/part/$partId'))
	const partId = (partMatch?.params as Record<string, string | undefined>)?.partId

	// Match piece route
	const pieceMatch = matches.find((match) => match.fullPath.includes('/piece/$pieceId'))
	const pieceId = (pieceMatch?.params as Record<string, string | undefined>)?.pieceId

	const segmentName = useAppSelector(
		(state) => state.segments.segments.find((s) => s.id === segmentId)?.name
	)
	const partName = useAppSelector((state) => state.parts.parts.find((p) => p.id === partId)?.name)
	const pieceName = useAppSelector(
		(state) => state.pieces.pieces.find((p) => p.id === pieceId)?.name
	)

	const linkStyle: CSSProperties = {
		textDecoration: 'underline',
		textUnderlineOffset: '2px',
		cursor: 'pointer'
	}

	if (segmentId) {
		links.push(
			<Nav.Link
				key={segmentId}
				as={Link}
				to={`/rundown/${rundownId}/segment/${segmentId}`}
				style={linkStyle}
			>
				{segmentName || segmentId}
			</Nav.Link>
		)
	}

	if (segmentId && partId) {
		links.push(
			<NavbarText key={`${partId}-sep`}>/</NavbarText>,
			<Nav.Link
				key={partId}
				as={Link}
				to={`/rundown/${rundownId}/segment/${segmentId}/part/${partId}`}
				style={linkStyle}
			>
				{partName || partId}
			</Nav.Link>
		)
	}

	if (segmentId && partId && pieceId) {
		links.push(
			<NavbarText key={`${pieceId}-sep`}>/</NavbarText>,
			<Nav.Link
				key={pieceId}
				as={Link}
				to={`/rundown/${rundownId}/segment/${segmentId}/part/${partId}/piece/${pieceId}`}
				style={linkStyle}
			>
				{pieceName || pieceId}
			</Nav.Link>
		)
	}

	return (
		<Navbar
			className="text-white"
			style={{ height: '2.5em', fontSize: '.75em', backgroundColor: '#2E2E2E' }}
		>
			<Container fluid>
				<Nav className="">
					<NavbarText key={`${partId}-sep`}>/</NavbarText>
					{links}
				</Nav>
			</Container>
		</Navbar>
	)
}
