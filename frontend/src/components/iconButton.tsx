import { Button } from 'react-bootstrap'
import type { ComponentProps, ReactNode } from 'react'
import { BsCopy } from 'react-icons/bs'

interface IconButtonProps extends ComponentProps<typeof Button> {
	icon?: ReactNode
}

export function IconButton({ icon = <BsCopy />, ...props }: IconButtonProps) {
	return (
		<Button variant="link" {...props} style={{ padding: 0, width: '1.5em', ...props.style }}>
			{icon}
		</Button>
	)
}
