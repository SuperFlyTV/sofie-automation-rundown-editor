import { useState } from 'react'
import {
	BsCloudArrowUpFill,
	BsCloudMinus,
	BsCloudMinusFill,
	BsCloudPlus,
	BsCloudPlusFill
} from 'react-icons/bs'
import { IconButton } from '../iconButton'
import { updateRundown } from '~/store/rundowns'
import { useAppDispatch } from '~/store/app'
import type { Rundown } from '~backend/background/interfaces'

interface SyncButtonProps {
	rundown: Rundown
}

export function SyncButton({ rundown }: SyncButtonProps) {
	const [hovered, setHovered] = useState(false)
	const dispatch = useAppDispatch()

	const handleClick = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		try {
			await dispatch(
				updateRundown({
					rundown: { ...rundown, sync: !rundown.sync }
				})
			).unwrap()
		} catch (err) {
			console.error('Failed to toggle sync', err)
		}
	}

	return (
		<div
			style={{ position: 'relative', width: '1.5em' }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{rundown.sync ? (
				<IconButton
					onClick={handleClick}
					icon={
						hovered ? (
							<BsCloudMinusFill className="icon-md" color="var(--bs-danger)" />
						) : (
							<>
								<BsCloudArrowUpFill
									className="sync-icon sync-icon-default icon-md"
									color="var(--bs-success)"
								/>
								<BsCloudMinus
									className="sync-icon sync-icon-hover icon-md"
									color="var(--bs-danger)"
								/>
							</>
						)
					}
					style={{ position: 'relative', top: '-.25em', padding: '0' }}
				/>
			) : (
				<div className="sync-plus-wrapper">
					{
						<IconButton
							onClick={handleClick}
							icon={
								hovered ? (
									<BsCloudPlusFill className="icon-md text-primary" />
								) : (
									<BsCloudPlus className="icon-md text-primary" />
								)
							}
							style={{ position: 'relative', top: '-.25em', padding: '0' }}
						/>
					}
				</div>
			)}
		</div>
	)
}
