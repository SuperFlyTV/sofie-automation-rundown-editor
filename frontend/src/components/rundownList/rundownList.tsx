import { ListGroup } from 'react-bootstrap'
import type { Rundown } from '~backend/background/interfaces'
import { RundownListItem } from './rundownListItem'
interface RundownListProps {
	title: string
	rundowns: Rundown[]
}

export function RundownList({ title, rundowns }: RundownListProps) {
	return (
		<div className="mb-4">
			<ListGroup>
				{rundowns.length > 0 ? (
					rundowns.map((rd) => <RundownListItem key={rd.id} rundown={rd} />)
				) : (
					<ListGroup.Item
						className="text-muted fst-italic"
						style={{ textAlign: 'center', opacity: '50%' }}
					>
						No {title} found, create or import one!
					</ListGroup.Item>
				)}
			</ListGroup>
		</div>
	)
}
