import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch } from '~/store/app'
import { copyPart } from '~/store/parts'
import type { Part, Segment } from '~backend/background/interfaces'
import { SidebarElementHeader } from './sidebarElementHeader'
import { useToasts } from '~/components/toasts/useToasts'

export function SidebarPart({ part, segment }: { part: Part; segment: Segment }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const handleCopyPart = () =>
		dispatch(copyPart({ id: part.id, rundownId: part.rundownId }))
			.unwrap()
			.then((newPart) =>
				navigate({
					to: `/rundown/${newPart.rundownId}/segment/${newPart.segmentId}/part/${newPart.id}`
				})
			)
			.catch(() =>
				toasts.show({
					headerContent: 'Adding piece',
					bodyContent: 'Encountered an unexpected error'
				})
			)

	return (
		<div className="copy-item">
			<SidebarElementHeader
				label={part.name}
				handleCopy={handleCopyPart}
				linkTo={'/rundown/$rundownId/segment/$segmentId/part/$partId'}
				linkParams={{
					rundownId: segment.rundownId,
					segmentId: segment.id,
					partId: part.id
				}}
				duration={part.payload.duration}
				floated={part.float}
			/>
		</div>
	)
}
