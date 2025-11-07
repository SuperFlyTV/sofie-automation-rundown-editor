import { Button } from 'react-bootstrap'
import type { ComponentProps } from 'react'
import { BsCopy } from 'react-icons/bs'

export function CopyIconButton(props: ComponentProps<typeof Button>) {
	return (
		<Button variant="link" {...props}>
			<BsCopy />
		</Button>
	)
}
