import type { Identifier } from 'dnd-core'
import type { FC } from 'react'
import { useRef } from 'react'
import { useDrag, useDrop, type DragSourceMonitor, type DropTargetMonitor } from 'react-dnd'
import type { DragTypes } from './DragTypes'
import type { DraggableItemData, HoverState } from './DraggableContainer'

export interface DraggableItem<T> extends DraggableItemData {
	index: number
	type: string
	data: T
	parentId: string
	hoverState: HoverState<T>
}

export interface DraggableWrappedComponentProps<T> {
	id: string
	index: number
	data: T
	hover: (
		hoveredRef: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem<T>, DraggableItem<T>>,
		draggedItem: DraggableItem<T>,
		hoveredItem: DraggableItem<T>
	) => void
	endDrag: (
		dragIndex: number,
		monitor: DragSourceMonitor<DraggableItem<T>, DraggableItem<T>>,
		item: DraggableItem<T>
	) => void
}

export type DraggableWrappedComponent<T> = FC<DraggableWrappedComponentProps<T>>

export interface DraggableComponentWrapperProps<T> extends DraggableWrappedComponentProps<T> {
	Component: DraggableWrappedComponent<T>
	parentId: string
	itemType: DragTypes
	hoverState: HoverState<T>
}

export const DraggableComponentWrapper = <T,>({
	id,
	parentId,
	index,
	data,
	itemType,
	hover,
	endDrag,
	Component,
	hoverState
}: DraggableComponentWrapperProps<T>) => {
	const ref = useRef<HTMLDivElement>(null)

	const [dropCollectedProps, drop] = useDrop<
		DraggableItem<T>,
		DraggableItem<T>,
		{ handlerId: Identifier | null }
	>({
		accept: itemType,
		collect: (monitor) => ({
			id,
			handlerId: monitor.getHandlerId()
		}),
		hover(item, monitor) {
			hover(ref, monitor, item, {
				id,
				index,
				type: itemType,
				data,
				parentId,
				hoverState
			})
		},
		drop: () => {
			return { id, index, type: itemType, data, parentId, hoverState }
		},
		canDrop: (item) => {
			return (
				item.parentId !== parentId ||
				(item.id !== id &&
					((item.index !== index - 1 && hoverState.newPosition === 'above') ||
						(item.index !== index + 1 && hoverState.newPosition === 'below')))
			)
		}
	})

	const [{ isDragging }, drag] = useDrag<
		DraggableItem<T>,
		DraggableItem<T>,
		{ isDragging: boolean }
	>({
		type: itemType,
		item: () => {
			return { id, index, type: itemType, data, parentId, hoverState }
		},
		end: (item, monitor) => {
			if (!item || !monitor) return

			endDrag(item.index, monitor, item)
		},
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		})
	})

	drag(drop(ref))

	return (
		<div
			ref={ref}
			style={{
				position: 'relative',
				opacity: isDragging ? 0.3 : 1
			}}
			data-handler-id={dropCollectedProps.handlerId}
		>
			<div
				style={{
					position: 'relative',
					borderTop:
						hoverState.hoveredItem?.id === id && hoverState.newPosition === 'above'
							? '2px solid green'
							: 'none',
					height: '2px',
					top: '-1px'
				}}
			></div>
			<Component id={id} index={index} data={data} hover={hover} endDrag={endDrag} />
			<div
				style={{
					position: 'relative',
					borderBottom:
						hoverState.hoveredItem?.id === id && hoverState.newPosition === 'below'
							? '2px solid green'
							: 'none',
					height: '2px',
					top: '1px'
				}}
			></div>
		</div>
	)
}
