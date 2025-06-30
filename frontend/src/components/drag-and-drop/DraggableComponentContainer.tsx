import update from 'immutability-helper'
import type { FC, ReactElement } from 'react'
import { useCallback, useState } from 'react'
import { DraggableComponentWrapper } from './DraggableComponentWrapper'
import type { DragTypes } from './DragTypes'

export interface DraggableItem {
	id: number | string
}

export interface DraggableComponentContainerProps<T extends DraggableItem> {
	items: T[]
	itemType: DragTypes
	Component: FC<{
		index: number
		id: T['id']
		data: T
		moveCard: (dragIndex: number, hoverIndex: number) => void
	}>
}

export const DraggableComponentContainer = <T extends DraggableItem>({
	items,
	itemType,
	Component
}: DraggableComponentContainerProps<T>): ReactElement => {
	const [cards, setCards] = useState<T[]>(items)

	const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
		setCards((prevCards: T[]) =>
			update(prevCards, {
				$splice: [
					[dragIndex, 1],
					[hoverIndex, 0, prevCards[dragIndex]]
				]
			})
		)
	}, [])

	const renderCard = useCallback(
		(item: T, index: number) => (
			<DraggableComponentWrapper
				key={item.id}
				id={item.id}
				index={index}
				data={item}
				moveCard={moveCard}
				itemType={itemType}
				Component={Component}
			/>
		),
		[moveCard, Component, itemType]
	)

	return <div>{cards.map(renderCard)}</div>
}
