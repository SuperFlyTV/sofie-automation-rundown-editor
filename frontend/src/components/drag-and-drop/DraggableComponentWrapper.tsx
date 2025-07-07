import type { Identifier } from 'dnd-core'
import type { FC } from 'react'
import { useRef } from 'react'
import { useDrag, useDrop, type DropTargetMonitor } from 'react-dnd'
import type { DragTypes } from './DragTypes'

export interface DraggableItem {
	index: number
	id: string
	type: string
}

export interface DraggableComponentWrapperProps<T> {
	id: string
	index: number
	data: T
	itemType: DragTypes
	move: (dragIndex: number, hoverIndex: number) => void
	hover: (
		ref: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem, void>,
		hoveredItem: DraggableItem,
		currentIndex: number,
		moveToTarget: (dragIndex: number, hoverIndex: number) => void
	) => void
	Component: DraggableWrappedComponent<T>
}

export type DraggableWrappedComponent<T> = FC<{
	id: string
	index: number
	data: T
	move: (dragIndex: number, hoverIndex: number) => void
	hover: (
		ref: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem, void>,
		hoveredItem: DraggableItem,
		currentIndex: number,
		moveToTarget: (dragIndex: number, hoverIndex: number) => void
	) => void
}>

export const DraggableComponentWrapper = <T,>({
	id,
	index,
	data,
	itemType,
	move,
	hover,
	Component
}: DraggableComponentWrapperProps<T>) => {
	const ref = useRef<HTMLDivElement>(null)

	const [collectedProps, drop] = useDrop<DraggableItem, void, { handlerId: Identifier | null }>({
		accept: itemType,
		collect: (monitor) => ({
			id,
			handlerId: monitor.getHandlerId()
		}),
		hover(item: DraggableItem, monitor) {
			hover(ref, monitor, item, index, move)
		}
	})

	const [{ isDragging }, drag] = useDrag({
		type: itemType,
		item: { id, index },
		collect: (monitor) => ({
			isDragging: monitor.isDragging()
		})
	})

	drag(drop(ref))

	return (
		<div
			ref={ref}
			style={{ opacity: isDragging ? 0.3 : 1 }}
			data-handler-id={collectedProps.handlerId}
		>
			<Component id={id} index={index} data={data} move={move} hover={hover} />
		</div>
	)
}
