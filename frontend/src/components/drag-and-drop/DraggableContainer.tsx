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

export interface DraggableContainerProps<T extends DraggableItem> {
	items: T[]
	itemType: DragTypes
	Component: DraggableWrappedComponent<T>
}

export const DraggableContainer = <T extends DraggableItem>({
	items,
	itemType,
	Component
}: DraggableContainerProps<T>): ReactElement => {
	const [containedItems, setContainedItems] = useState<T[]>([])

	const hover = (
		hoveredRef: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem, void>,
		draggedItem: DraggableItem,
		hoveredIndex: number,
		moveToHovered: (dragIndex: number, hoverIndex: number) => void
	) => {
		if (!hoveredRef.current) return

		const dragIndex = draggedItem.index
		const hoverIndex = hoveredIndex
		if (dragIndex === hoverIndex) return

		const hoverRect = hoveredRef.current.getBoundingClientRect()
		const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
		const clientOffset = monitor.getClientOffset()
		const hoverClientY = (clientOffset as XYCoord).y - hoverRect.top

		if (
			(dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
			(dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
		) {
			return
		}

		moveToHovered(dragIndex, hoverIndex)
		draggedItem.index = hoverIndex
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
			/>
		),
		[move, Component, itemType]
	)

	return <div>{containedItems.map(renderContainedItem)}</div>
}
