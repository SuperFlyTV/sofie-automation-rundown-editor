import update from 'immutability-helper'
import type { ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
	DraggableComponentWrapper,
	type DraggableWrappedComponent,
	type DraggableItem
} from './DraggableComponentWrapper'
import { DragTypes } from './DragTypes'
import type { DropTargetMonitor, XYCoord } from 'react-dnd'

export interface ListItemToBeDragged {
	id: string
}

export interface DraggableContainerProps<T extends ListItemToBeDragged> {
	items: T[]
	itemType: DragTypes
	Component: DraggableWrappedComponent<T>
}

export const DraggableContainer = <T extends ListItemToBeDragged>({
	items,
	itemType,
	Component
}: DraggableContainerProps<T>): ReactElement => {
	const [containedItems, setContainedItems] = useState<T[]>([])
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
	const [hoverPosition, setHoverPosition] = useState<'above' | 'below' | null>(null)

	const hover = (
		hoveredRef: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem, void>,
		draggedItem: DraggableItem,
		hoveredIndex: number
	) => {
		if (!hoveredRef.current) return

		const dragIndex = draggedItem.index
		if (dragIndex === hoveredIndex) setHoveredIndex(null)
		else {
			const hoverRect = hoveredRef.current.getBoundingClientRect()
			const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
			const clientOffset = monitor.getClientOffset()
			const hoverClientY = (clientOffset as XYCoord).y - hoverRect.top

			if (hoverClientY > hoverMiddleY && hoverClientY < hoverMiddleY + 4) {
				return
			}

			const newPosition = hoverClientY > hoverMiddleY ? 'below' : 'above'

			if (
				(hoveredIndex === dragIndex - 1 && newPosition === 'below') ||
				(hoveredIndex === dragIndex + 1 && newPosition === 'above')
			) {
				setHoveredIndex(null)
				setHoverPosition(null)
			} else {
				setHoverPosition((prev) => (prev !== newPosition ? newPosition : prev))
				setHoveredIndex((prev) => (prev !== hoveredIndex ? hoveredIndex : prev))
			}
		}
	}

	const endDrag = (
		dragIndex: number,
		moveToHovered: (dragIndex: number, hoverIndex: number) => void,
		didDrop: boolean
	) => {
		if (didDrop && hoveredIndex !== null && hoverPosition !== null) {
			let targetIndex = hoveredIndex

			if (hoverPosition === 'below') {
				targetIndex = dragIndex < hoveredIndex ? hoveredIndex : hoveredIndex + 1
			} else {
				targetIndex = dragIndex < hoveredIndex ? hoveredIndex - 1 : hoveredIndex
			}

			targetIndex = Math.max(0, Math.min(containedItems.length - 1, targetIndex))

			if (targetIndex !== dragIndex) {
				moveToHovered(dragIndex, targetIndex)
			}
		}
		setHoveredIndex(null)
		setHoverPosition(null)
	}

	const move = useCallback((dragIndex: number, hoverIndex: number) => {
		setContainedItems((prevDaggableItems: T[]) =>
			update(prevDaggableItems, {
				$splice: [
					[dragIndex, 1],
					[hoverIndex, 0, prevDaggableItems[dragIndex]]
				]
			})
		)
	}, [])

	useEffect(() => {
		if (items.length > 0) {
			setContainedItems(items)
		}
	}, [items])

	const renderContainedItem = useCallback(
		(item: T, index: number) => (
			<DraggableComponentWrapper
				key={item.id}
				id={item.id}
				index={index}
				data={item}
				move={move}
				hover={hover}
				itemType={itemType}
				Component={Component}
				hoverPosition={hoverPosition}
				hoveredIndex={hoveredIndex}
				endDrag={endDrag}
			/>
		),
		[move, itemType, Component, hoverPosition, hoveredIndex]
	)

	return <div>{containedItems.map(renderContainedItem)}</div>
}
