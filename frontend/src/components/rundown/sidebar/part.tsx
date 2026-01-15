import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch } from '~/store/app'
import { copyPart } from '~/store/parts'
import type { Part, Segment } from '~backend/background/interfaces'
import { SidebarElementHeader } from './sidebarElementHeader'
import { useToasts } from '~/components/toasts/useToasts'
import { BsFillTrashFill, BsPlus, BsTrash } from 'react-icons/bs'
import { DeletePartButton } from '../deletePartButton'
import type { ButtonProps } from 'react-bootstrap'
import { HoverIconButton } from '~/components/rundownList/hoverIconButton'

export function SidebarPart({
	part,
	segment,
	handleAddPart,
	insertRank
}: {
	part: Part
	segment: Segment
	handleAddPart: (rank: number) => Promise<string | void>
	insertRank: number
}) {
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
		<div className="sidebar-part-wrapper">
			<div className="sidebar-part copy-item bg-dark">
				<SidebarElementHeader
					label={part.name}
					duration={part.payload.duration}
					linkTo={'/rundown/$rundownId/segment/$segmentId/part/$partId'}
					linkParams={{
						rundownId: segment.rundownId,
						segmentId: segment.id,
						partId: part.id
					}}
					handleCopy={handleCopyPart}
					deleteButton={
						<DeletePartButton
							rundownId={part.rundownId}
							segmentId={part.segmentId}
							partId={part.id}
							partName={part.name}
							disabled={false}
							style={{ zIndex: 4 }}
							renderButton={({ onClick, disabled }: ButtonProps) => (
								<HoverIconButton
									onClick={onClick}
									disabled={disabled}
									className="sync-plus-wrapper ms-auto"
									defaultIcon={<BsTrash className="icon-md" color="var(--bs-danger)" />}
									hoverIcon={<BsFillTrashFill className="icon-md" color="var(--bs-danger)" />}
								/>
							)}
						/>
					}
				/>
			</div>
			<div className="part-button add-button-container">
				<button className="part-button add-button" onClick={() => handleAddPart(insertRank)}>
					<BsPlus className="icon-lg" aria-hidden />
					Add Part
				</button>
			</div>
		</div>
	)
}
