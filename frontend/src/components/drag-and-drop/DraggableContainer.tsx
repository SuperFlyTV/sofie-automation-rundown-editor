import type { ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
	DraggableComponentWrapper,
	type DraggableWrappedComponent,
	type DraggableItem
} from './DraggableComponentWrapper'
import { DragTypes } from './DragTypes'
import type { DropTargetMonitor, XYCoord } from 'react-dnd'
import { getNewPosition, isResultCurrentPosition } from './util'

export interface DraggableItemData {
	id: string
}

export interface DraggableContainerProps<T extends DraggableItemData> {
	id: string
	items: T[]
	itemType: DragTypes
	Component: DraggableWrappedComponent<T>
	reorder: (source: T, targetIndex: number) => unknown
}

export type HoverPosition = 'above' | 'below' | null

export type HoverState<T> = {
	hoveredItem: DraggableItem<T> | null
	newPosition: HoverPosition | null
	draggedItem: DraggableItem<T> | null
}

export const DraggableContainer = <T extends DraggableItemData>({
	id,
	items,
	itemType,
	Component,
	reorder
}: DraggableContainerProps<T>): ReactElement => {
	const [draggableItems, setDraggableItems] = useState<T[]>([])
	const [hoverState, setHoverState] = useState<HoverState<T>>({
		hoveredItem: null,
		newPosition: null,
		draggedItem: null
	})

	const hover = (
		hoveredRef: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem<T>, void>,
		draggedItem: DraggableItem<T>,
		hoveredItem: DraggableItem<T>
	) => {
		if (!hoveredRef.current) return

		// reset hover state when hovering on the dragged item
		if (draggedItem.id === hoveredItem.id || draggedItem.parentId !== hoveredItem.parentId)
			setHoverState({
				hoveredItem: null,
				newPosition: null,
				draggedItem: null
			})
		else {
			const hoveredRect = hoveredRef.current.getBoundingClientRect()
			// vertical position of the cursor inside the currently hovered element
			const hoverClientY = (monitor.getClientOffset() as XYCoord).y - hoveredRect.top

			const newPosition = getNewPosition(hoverClientY, hoveredRect)

			if (newPosition !== undefined) {
				if (isResultCurrentPosition(draggedItem.index, newPosition, hoveredItem.index)) {
					// reset hover state when the result of the drop would be the current position of the hovered item
					setHoverState({
						hoveredItem: null,
						newPosition: null,
						draggedItem: null
					})
				} else {
					setHoverState({ hoveredItem, newPosition, draggedItem })
				}
			}
		}
	}

	// Pass Dragged item to this, or even just pass the hover state if possible.
	const endDrag = (
		dragIndex: number,
		didDrop: boolean,
		item: DraggableItem<T>,
		target: DraggableItem<T> | null
	) => {
		if (didDrop && target && hoverState.hoveredItem && hoverState.newPosition !== null) {
			let targetIndex = hoverState.hoveredItem.index

			if (hoverState.newPosition !== null) {
				if (hoverState.newPosition === 'below') {
					targetIndex =
						dragIndex < hoverState.hoveredItem.index
							? hoverState.hoveredItem.index
							: hoverState.hoveredItem.index + 1
				} else {
					targetIndex =
						dragIndex < hoverState.hoveredItem.index
							? hoverState.hoveredItem.index - 1
							: hoverState.hoveredItem.index
				}
			}

			targetIndex = Math.max(0, Math.min(draggableItems.length - 1, targetIndex))

			if (targetIndex !== dragIndex) {
				reorder(item.data, targetIndex)
			}
		}
		setHoverState({
			hoveredItem: null,
			newPosition: null,
			draggedItem: null
		})
	}

	useEffect(() => {
		if (items.length > 0) {
			setDraggableItems(items)
		}
	}, [items])

	const renderContainedItem = useCallback(
		(item: T, index: number) => (
			<DraggableComponentWrapper
				key={item.id}
				id={item.id}
				index={index}
				data={item}
				hover={hover}
				itemType={itemType}
				Component={Component}
				hoverState={hoverState}
				endDrag={endDrag}
				parentId={id}
			/>
		),
		[itemType, Component, hoverState]
	)

	return <div>{draggableItems.map(renderContainedItem)}</div>
}
