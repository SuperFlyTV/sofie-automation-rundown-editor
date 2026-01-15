import { Link, type LinkProps } from '@tanstack/react-router'
import classNames from 'classnames'
import type { ReactNode } from 'react'
import { displayTime } from './displayTime'
import { Stack } from 'react-bootstrap'
import { BsCopy } from 'react-icons/bs'
import { HoverIconButton } from '~/components/rundownList/hoverIconButton'

type SidebarItemProps = {
	label: ReactNode
	duration?: number
	floated?: boolean
	linkTo: string
	linkParams: Record<string, string>
	handleCopy: () => void
	deleteButton: ReactNode
	buttonClassName?: string
} & LinkProps

export function SidebarElementHeader({
	label,
	duration,
	floated = false,
	linkTo,
	linkParams,
	handleCopy,
	deleteButton,
	buttonClassName
}: SidebarItemProps) {
	return (
		<Link to={linkTo} params={linkParams}>
			<Stack
				direction="horizontal"
				className={classNames(buttonClassName, 'align-items-baseline', {
					floated
				})}
			>
				<div className="segment-header-content">
					<span className="item-title">{label}</span>
				</div>
				<Stack
					direction="horizontal"
					className="ms-auto item-duration"
					gap={1}
					style={{ opacity: 0.7, position: 'absolute' }}
				>
					{<span>{duration ? displayTime(duration) : '--:--'}</span>}
				</Stack>
				<Stack className="ms-auto justify-items-center" direction="horizontal" gap={1}>
					{deleteButton}

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
							handleCopy()
						}}
					/>
				</Stack>
			</Stack>
		</Link>
	)
}
