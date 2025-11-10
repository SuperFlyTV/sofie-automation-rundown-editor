import { Button } from 'react-bootstrap'
import type { ComponentProps } from 'react'
import { BsPencil } from 'react-icons/bs'

export function EditIconButton(props: ComponentProps<typeof Button>) {
	return (
		<Button variant="link" {...props}>
			<BsPencil />
		</Button>
	)
}
