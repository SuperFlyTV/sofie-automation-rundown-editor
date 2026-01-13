import { type ButtonProps } from 'react-bootstrap'
import { useNavigate } from '@tanstack/react-router'
import { removeRundown } from '~/store/rundowns'
import { useAppDispatch } from '~/store/app'
import { DeleteButtonWrapper } from '../deleteButtonWrapper'

export function DeleteRundownButton({
	rundownId,
	rundownName,
	disabled,
	renderButton,
	...rest
}: {
	rundownId: string
	rundownName: string
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
			entityLabel="rundown"
			entityName={rundownName}
			disabled={disabled}
			onDelete={() => dispatch(removeRundown({ id: rundownId })).unwrap()}
			onSuccessNavigate={() => navigate({ to: '/' })}
			renderButton={renderButton}
			{...rest}
		/>
	)
}
