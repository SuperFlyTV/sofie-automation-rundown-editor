import type { ReactElement } from 'react'
import { useCallback, useState } from 'react'
import {
	DraggableComponentWrapper,
	type DraggableWrappedComponent,
	type DraggableItem
} from './DraggableComponentWrapper'
import { DragTypes } from './DragTypes'
import type { DragSourceMonitor, DropTargetMonitor, XYCoord } from 'react-dnd'
import { getNewPosition, isResultCurrentPosition } from './util'

export interface DraggableItemData {
	id: string
}

export interface DraggableContainerProps<T extends DraggableItemData> {
	id: string
	items: T[]
	itemType: DragTypes
	Component: DraggableWrappedComponent<T>
	reorder: (target: T, source: T, targetIndex: number) => unknown
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
	const [hoverState, setHoverState] = useState<HoverState<T>>({
		hoveredItem: null,
		newPosition: null,
		draggedItem: null
	})

	const hover = useCallback(
		(
			hoveredRef: React.RefObject<HTMLDivElement | null>,
			monitor: DropTargetMonitor<DraggableItem<T>, void>,
			draggedItem: DraggableItem<T>,
			hoveredItem: DraggableItem<T>
		) => {
			if (!hoveredRef.current) return

			// reset hover state when hovering on the dragged item
			if (draggedItem.id === hoveredItem.id || !monitor.isOver())
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
		},
		[setHoverState]
	)

	const endDrag = useCallback(
		(
			dragIndex: number,
			monitor: DragSourceMonitor<DraggableItem<T>, DraggableItem<T>>,
			item: DraggableItem<T>
		) => {
			const target = monitor.getDropResult()
			if (
				monitor.didDrop() &&
				target &&
				target.hoverState.hoveredItem &&
				target.hoverState.newPosition !== null
			) {
				let targetIndex = target.index

				if (target.hoverState.newPosition !== null) {
					if (target.hoverState.newPosition === 'below') {
						targetIndex =
							item.parentId === target.parentId && dragIndex < target.index
								? target.index
								: target.index + 1
					} else {
						targetIndex =
							item.parentId === target.parentId && dragIndex < target.index
								? target.index - 1
								: target.index
					}
				}

				if (item.parentId !== target.parentId || targetIndex !== dragIndex) {
					reorder(target.data, item.data, targetIndex)
				}
			}
			setHoverState({
				hoveredItem: null,
				newPosition: null,
				draggedItem: null
			})
		},
		[reorder]
	)

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
		[hover, itemType, Component, hoverState, endDrag, id]
	)

	return <div>{items.map(renderContainedItem)}</div>
}
