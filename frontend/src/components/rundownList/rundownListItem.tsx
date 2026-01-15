import { useNavigate } from '@tanstack/react-router'
import { ListGroup, Stack, type ButtonProps } from 'react-bootstrap'
import { useAppDispatch } from '~/store/app'
import { copyRundown } from '~/store/rundowns'
import type { Rundown } from '~backend/background/interfaces'
import { SyncButton } from './syncButton'
import { HoverIconButton } from './hoverIconButton'
import { BsArrowRightShort, BsCopy, BsFillTrashFill, BsTrash } from 'react-icons/bs'
import { DeleteRundownButton } from '../rundown/deleteRundownButton'
import { useToasts } from '../toasts/useToasts'

export function RundownListItem({ rundown }: { rundown: Rundown }) {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const toasts = useToasts()

	const handleCopyRundown = (sourceRundown: Rundown, preserveTemplate: boolean = false) => {
		dispatch(
			copyRundown({
				id: sourceRundown.id,
				preserveTemplate
			})
		)
			.unwrap()
			.then(async (newRundownResult) => {
				await navigate({
					to: `/rundown/${newRundownResult.id}`
				})
			})
			.catch((e) => {
				console.error(e)
				toasts.show({
					headerContent: 'Adding rundown',
					bodyContent: 'Encountered an unexpected error'
				})
			})
	}
	const handleClick = (e: React.MouseEvent) => {
		if (e.defaultPrevented) return
		navigate({ to: `/rundown/${rundown.id}` })
	}

	return (
		<ListGroup.Item action onClick={handleClick} className="copy-item">
			<Stack direction="horizontal" className="align-items-baseline">
				<div style={{ position: 'relative', left: '-.35em', top: '.1em', width: '24px' }}>
					{!rundown.isTemplate ? <SyncButton rundown={rundown} /> : null}
				</div>
				<div>{rundown.name}</div>
				<Stack direction="horizontal" className="ms-auto" gap={1} style={{ opacity: 0.7 }}>
					{rundown.isTemplate || (!rundown.expectedStartTime && !rundown.expectedEndTime) ? null : (
						<>
							<span
								className="ms-1"
								style={{
									fontSize: '.7em',
									width: '129px',
									fontFamily: 'monospace',
									textAlign: 'center'
								}}
							>
								{rundown.expectedStartTime ? (
									new Date(rundown.expectedStartTime).toLocaleString('sv-SE').replace('T', '')
								) : (
									<span style={{ opacity: 0.4 }}>no start selected</span>
								)}
							</span>
							<BsArrowRightShort />
							<span
								style={{
									fontSize: '.7em',
									width: '129px',
									fontFamily: 'monospace',
									textAlign: 'center'
								}}
							>
								{rundown.expectedEndTime ? (
									new Date(rundown.expectedEndTime).toLocaleString('sv-SE').replace('T', ' ')
								) : (
									<span style={{ opacity: 0.4 }}>no end selected</span>
								)}
							</span>
						</>
					)}
				</Stack>
				<Stack className="ms-2" direction="horizontal" gap={1}>
					<DeleteRundownButton
						rundownId={rundown.id}
						rundownName={rundown.name}
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

					<HoverIconButton
						className="sync-plus-wrapper ms-auto"
						defaultIcon={
							<BsCopy
								className="icon-md text-primary"
								style={{ fontSize: '1em', opacity: '75%' }}
							/>
						}
						hoverIcon={<BsCopy className="icon-md text-primary" style={{ fontSize: '1em' }} />}
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							handleCopyRundown(rundown, rundown.isTemplate)
						}}
					/>
				</Stack>
			</Stack>
		</ListGroup.Item>
	)
}
