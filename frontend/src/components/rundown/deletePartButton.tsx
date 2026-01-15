import { type ButtonProps } from 'react-bootstrap'
import { useNavigate } from '@tanstack/react-router'
import { useAppDispatch } from '~/store/app'
import { DeleteButtonWrapper } from '../deleteButtonWrapper'
import { removePart } from '~/store/parts'

export function DeletePartButton({
	rundownId,
	segmentId,
	partId,
	partName,
	disabled,
	renderButton,
	...rest
}: {
	rundownId: string
	segmentId: string
	partId: string
	partName: string
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
			entityLabel="part"
			entityName={partName}
			disabled={disabled}
			onDelete={() => dispatch(removePart({ id: partId })).unwrap()}
			onSuccessNavigate={() =>
				navigate({
					to: '/rundown/$rundownId/segment/$segmentId',
					params: { rundownId, segmentId }
				})
			}
			renderButton={renderButton}
			{...rest}
		/>
	)
}
