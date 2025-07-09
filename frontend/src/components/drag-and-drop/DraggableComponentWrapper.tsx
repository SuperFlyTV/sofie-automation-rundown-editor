import type { Identifier } from 'dnd-core'
import type { FC } from 'react'
import { useRef } from 'react'
import { useDrag, useDrop, type DropTargetMonitor } from 'react-dnd'
import type { DragTypes } from './DragTypes'
import type { ListItemToBeDragged } from './DraggableContainer'

export interface DraggableItem extends ListItemToBeDragged {
	index: number
	type: string
}

export interface DraggableWrappedComponentProps<T> {
	id: string
	index: number
	data: T
	move: (dragIndex: number, hoverIndex: number) => void
	hover: (
		ref: React.RefObject<HTMLDivElement | null>,
		monitor: DropTargetMonitor<DraggableItem, void>,
		hoveredItem: DraggableItem,
		currentIndex: number
	) => void
	endDrag: (
		hoverIndex: number,
		move: (dragIndex: number, hoverIndex: number) => void,
		didDrop: boolean
	) => void
}

export type DraggableWrappedComponent<T> = FC<DraggableWrappedComponentProps<T>>

export interface DraggableComponentWrapperProps<T> extends DraggableWrappedComponentProps<T> {
	Component: DraggableWrappedComponent<T>
	itemType: DragTypes
	hoveredIndex: number | null
	hoverPosition: 'above' | 'below' | null
}

export const DraggableComponentWrapper = <T,>({
	id,
	index,
	data,
	itemType,
	move,
	hover,
	endDrag,
	Component,
	hoveredIndex,
	hoverPosition
}: DraggableComponentWrapperProps<T>) => {
	const ref = useRef<HTMLDivElement>(null)

	const [collectedProps, drop] = useDrop<DraggableItem, void, { handlerId: Identifier | null }>({
		accept: itemType,
		collect: (monitor) => ({
			id,
			handlerId: monitor.getHandlerId()
		}),
		hover(item: DraggableItem, monitor) {
			hover(ref, monitor, item, index)
		},
		canDrop: (item: DraggableItem) => {
			console.log(item.index, index - 1, hoverPosition)
			return (
				item.id !== id &&
				((item.index !== index - 1 && hoverPosition === 'above') ||
					(item.index !== index + 1 && hoverPosition === 'below'))
			)
		}
	})

	const [{ isDragging }, drag] = useDrag({
		type: itemType,
		item: () => {
			return { id, index, type: itemType }
		},
		end: (item, monitor) => {
			if (!item || !monitor) return

			endDrag(item.index, move, monitor.didDrop())
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
			data-handler-id={collectedProps.handlerId}
		>
			<div
				style={{
					position: 'relative',
					borderTop:
						hoveredIndex === index && hoverPosition === 'above' ? '2px solid green' : 'none',
					height: '2px',
					top: '-1px'
				}}
			></div>
			<Component id={id} index={index} data={data} move={move} hover={hover} endDrag={endDrag} />
			<div
				style={{
					position: 'relative',
					borderBottom:
						hoveredIndex === index && hoverPosition === 'below' ? '2px solid green' : 'none',
					height: '2px',
					top: '1px'
				}}
			></div>
		</div>
	)
}
