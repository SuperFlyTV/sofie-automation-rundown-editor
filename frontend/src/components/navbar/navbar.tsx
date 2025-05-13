import Container from 'react-bootstrap/esm/Container'
import Nav from 'react-bootstrap/esm/Nav'
import Navbar from 'react-bootstrap/esm/Navbar'
import sofieLogo from '~/assets/sofie-logo.svg'
import { Link } from '@tanstack/react-router'
import { useAppSelector } from '~/store/app'
import { CoreConnectionStatus } from '~backend/background/interfaces'

const brandStyle: React.CSSProperties = {
	width: '2rem',
	height: '2rem'
}

export function EditorNavbar() {
	const connectionStatus = useAppSelector((state) => state.coreConnectionStatus)

	const hostPortString = `${connectionStatus.url || '127.0.0.1'}:${connectionStatus.port || 3000}`
	const statusString =
		connectionStatus.status === CoreConnectionStatus.CONNECTED
			? `${connectionStatus.status} to ${hostPortString}`
			: `${connectionStatus.status} from ${hostPortString}`

	return (
		<Navbar expand="lg" style={{ background: 'black' }}>
			<Container fluid>
				<Navbar.Brand as={Link} to="/">
					<img
						src={sofieLogo}
						style={brandStyle}
						className="d-inline-block align-top"
						alt="Sofie logo"
					/>
				</Navbar.Brand>
				<Navbar.Text>Core Status: {statusString}</Navbar.Text>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="ms-auto">
						<Nav.Link as={Link} to="/">
							Rundowns
						</Nav.Link>
						<Nav.Link as={Link} to="/settings">
							Settings
						</Nav.Link>
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	)
}
