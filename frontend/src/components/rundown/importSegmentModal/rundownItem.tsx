import { ListGroup, Stack, Button } from 'react-bootstrap'
import type { Rundown } from '~backend/background/interfaces'

interface Props {
	rundown: Rundown
	onClone: () => void
}

export default function RundownItem({ rundown, onClone }: Props) {
	return (
		<ListGroup.Item className="copy-item">
			<Stack
				direction="horizontal"
				className="justify-content-between align-items-center"
				style={{ cursor: 'default' }}
			>
				{rundown.name}
				<Button
					size="sm"
					variant="outline-primary"
					onClick={onClone}
					className="ms-auto copy-icon-button"
				>
					Import full rundown
				</Button>
			</Stack>
		</ListGroup.Item>
	)
}
