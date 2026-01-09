import { useState } from 'react'
import { type ButtonProps } from 'react-bootstrap'
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
		<div
			className={className}
			style={{ position: 'relative', width: '1.5em', ...style }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<IconButton
				onClick={onClick}
				icon={hovered ? hoverIcon : defaultIcon}
				style={{ position: 'relative', top: '-.1em', padding: 0 }}
			/>
		</div>
	)
}
