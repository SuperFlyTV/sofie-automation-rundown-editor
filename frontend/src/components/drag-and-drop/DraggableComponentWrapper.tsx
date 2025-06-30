import type { Identifier, XYCoord } from 'dnd-core'
import type { FC } from 'react'
import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import type { DragTypes } from './DragTypes'

interface DragItem {
	index: number
	id: string | number
	type: string
}

export interface DraggableComponentWrapperProps<T> {
	id: string | number
	index: number
	data: T
	itemType: DragTypes
	moveCard: (dragIndex: number, hoverIndex: number) => void
	Component: FC<{
		id: string | number
		index: number
		data: T
		moveCard: (dragIndex: number, hoverIndex: number) => void
	}>
}

export const DraggableComponentWrapper = <T,>({
	id,
	index,
	data,
	itemType,
	moveCard,
	Component
}: DraggableComponentWrapperProps<T>) => {
	const ref = useRef<HTMLDivElement>(null)

	const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
		accept: itemType,
		collect: (monitor) => ({
			handlerId: monitor.getHandlerId()
		}),
		hover(item: DragItem, monitor) {
			if (!ref.current) return

			const dragIndex = item.index
			const hoverIndex = index
			if (dragIndex === hoverIndex) return

			const hoverRect = ref.current.getBoundingClientRect()
			const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
			const clientOffset = monitor.getClientOffset()
			const hoverClientY = (clientOffset as XYCoord).y - hoverRect.top

			if (
				(dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
				(dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
			) {
				return
			}

			moveCard(dragIndex, hoverIndex)
			item.index = hoverIndex
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
		<div ref={ref} style={{ opacity: isDragging ? 0.3 : 1 }} data-handler-id={handlerId}>
			<Component id={id} index={index} data={data} moveCard={moveCard} />
		</div>
	)
}
