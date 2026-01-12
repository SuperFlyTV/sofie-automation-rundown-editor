import { Link } from '@tanstack/react-router'
import classNames from 'classnames'
import type { ReactNode } from 'react'
import { IconButton } from '~/components/iconButton'
import { displayTime } from './displayTime'

type SidebarItemProps = {
	label: ReactNode
	duration?: number
	handleCopy: () => void
	className?: string
	buttonClassName?: string
	floated: boolean
	linkTo: string
	linkParams: Record<string, string>
}

export function SidebarElementHeader({
	label,
	duration,
	handleCopy,
	buttonClassName,
	floated,
	linkTo,
	linkParams
}: SidebarItemProps) {
	return (
		<>
			<Link to={linkTo} params={linkParams}>
				<button
					className={classNames(buttonClassName, {
						floated
					})}
				>
					{label}
					{duration && <span className="item-duration">{displayTime(duration)}</span>}
				</button>
			</Link>

			<IconButton
				onClick={handleCopy}
				className="copy-icon-button"
				style={{ position: 'absolute', top: '.5em', right: '.25em' }}
			/>
		</>
	)
}
