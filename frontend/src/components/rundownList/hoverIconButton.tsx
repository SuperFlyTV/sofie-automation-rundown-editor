import { useState } from 'react'
import { Stack, type ButtonProps } from 'react-bootstrap'
import type { ReactNode } from 'react'
import { IconButton } from '../iconButton'

interface HoverIconButtonProps extends ButtonProps {
	defaultIcon: ReactNode
	hoverIcon: ReactNode
}

export function HoverIconButton({
	defaultIcon,
	hoverIcon,
	className,
	style,
	onClick
}: HoverIconButtonProps) {
	const [hovered, setHovered] = useState(false)

	return (
		<Stack
			className={className}
			direction="horizontal"
			style={{ width: '1.5em', justifyContent: 'center', ...style }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<IconButton
				onClick={onClick}
				icon={hovered ? hoverIcon : defaultIcon}
				style={{ position: 'relative', top: '-.1em', padding: 0 }}
			/>
		</Stack>
	)
}
