import Container from 'react-bootstrap/esm/Container'
import Nav from 'react-bootstrap/esm/Nav'
import Navbar from 'react-bootstrap/esm/Navbar'
import { Link } from '@tanstack/react-router'
import { type Rundown } from '~backend/background/interfaces'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'

export function RundownNavbar({ rundown }: { rundown: Rundown }) {
	return (
		<Navbar expand="lg" style={{ background: '#2689ba' }}>
			<Container fluid>
				<Navbar.Text> {rundown.name}</Navbar.Text>
				<Nav className="ms-auto">
					<Nav.Link as={Link} to="/">
						<FontAwesomeIcon icon={faClose} size="xl" />
					</Nav.Link>
				</Nav>
			</Container>
		</Navbar>
	)
}
