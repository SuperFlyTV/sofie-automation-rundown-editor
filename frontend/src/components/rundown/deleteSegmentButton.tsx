import { type ButtonProps } from 'react-bootstrap'
import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch } from '~/store/app'
import { DeleteButtonWrapper } from '../deleteButtonWrapper'
import { removeSegment } from '~/store/segments'

export function DeleteSegmentButton({
	rundownId,
	segmentId,
	segmentName,
	disabled,
	renderButton,
	...rest
}: {
	rundownId: string
	segmentId: string
	segmentName: string
	disabled: boolean
	renderButton?: (props: {
		onClick: (e: React.MouseEvent) => void
		disabled: boolean
	}) => React.ReactNode
} & ButtonProps) {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()

	return (
		<DeleteButtonWrapper
			entityLabel="segment"
			entityName={segmentName}
			disabled={disabled}
			onDelete={() => dispatch(removeSegment({ id: segmentId })).unwrap()}
			onSuccessNavigate={() =>
				navigate({
					to: '/rundown/$rundownId',
					params: { rundownId }
				})
			}
			renderButton={renderButton}
			{...rest}
		/>
	)
}
