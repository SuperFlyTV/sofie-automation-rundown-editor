import Container from 'react-bootstrap/esm/Container'
import Nav from 'react-bootstrap/esm/Nav'
import Navbar from 'react-bootstrap/esm/Navbar'
import { Link } from '@tanstack/react-router'
import { type Rundown } from '~backend/background/interfaces'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'
import './navbar.scss'
import { toTime, toTimeDiff } from '~/util/lib'
import { useAppSelector } from '~/store/app'

export function RundownNavbar({ rundown }: { rundown: Rundown }) {
	const parts = useAppSelector((state) =>
		state.parts.parts.filter((p) => p.rundownId === rundown.id)
	)

	const start = rundown.expectedStartTime
		? new Date(rundown.expectedStartTime).toLocaleTimeString()
		: 'Not set'

	const duration =
		!rundown.expectedStartTime || !rundown.expectedEndTime
			? 'Not set'
			: toTime((rundown.expectedEndTime - rundown.expectedStartTime) / 1000)

	let diff: string | number = '-'
	if (rundown.expectedStartTime && rundown.expectedEndTime) {
		const expectedDuration = rundown.expectedEndTime - rundown.expectedStartTime
		const actualDuration = parts
			.filter((p) => p.payload && p.payload.duration)
			.map((p) => p.payload.duration as number)
			.reduce((a, b) => a + b, 0)

		diff = toTimeDiff(actualDuration - expectedDuration / 1000)
	}

	return (
		<Navbar expand="lg" className="rundown-navbar">
			<Container fluid className="d-flex justify-content-between">
				<div className="d-grid timing">
					<div className="label">Expected start:</div>
					<div>{start}</div>
					<div className="label">Expected duration:</div>
					<div>{duration}</div>
					<div className="label">Diff:</div>
					<div>{diff}</div>
				</div>

				<Nav.Link as={Link} to={`/rundown/${rundown.id}`}>
					{rundown.name}
				</Nav.Link>

				<Nav className="">
					<Nav.Link as={Link} to="/">
						<FontAwesomeIcon icon={faClose} size="xl" />
					</Nav.Link>
				</Nav>
			</Container>
		</Navbar>
	)
}
