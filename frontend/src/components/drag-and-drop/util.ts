import type { HoverPosition } from './DraggableContainer'

/**
 * Returns the predicted new position of the dragged item.
 *
 * @param hoverClientY - {number}
 * @param hoveredRect - {DOMRect}
 * @returns HoverPosition or undefined if hovering in the dead zone.
 */
export function getNewPosition(
	hoverClientY: number,
	hoveredRect: DOMRect
): HoverPosition | undefined {
	// vertical middle of the currently hovered element
	const hoverMiddleY = (hoveredRect.bottom - hoveredRect.top) / 2

	if (isHoverInDeadZone(hoverClientY, hoverMiddleY, 0.1)) {
		return undefined
	}
	return hoverClientY > hoverMiddleY ? 'below' : 'above'
}

/**
 * If the result of the drop would be the current position of the dragged item then returns true
 *
 * @param dragIndex - {number} index of the dragged item
 * @param newPosition - {HoverPosition} predicted position relative to the hovered item
 * @param hoveredIndex - {number} index of the hovered item
 * @returns boolean
 */
export function isResultCurrentPosition(
	dragIndex: number,
	newPosition: HoverPosition,
	hoveredIndex: number
) {
	return (
		(hoveredIndex === dragIndex - 1 && newPosition === 'below') ||
		(hoveredIndex === dragIndex + 1 && newPosition === 'above')
	)
}
/**
 * Calculates if the cursor is in the dead zone
 *
 * @param hoverClientY - {number} vertical position of the cursor inside the currently hovered element
 * @param hoverMiddleY - {number} vertical middle of the currently hovered element
 * @param deadZonePercent - {number} floating point value of the deadzone (0-1)
 * @returns boolean
 */
export function isHoverInDeadZone(
	hoverClientY: number,
	hoverMiddleY: number,
	deadZonePercent: number
) {
	const deadZoneOffset = hoverMiddleY * deadZonePercent

	return (
		hoverClientY > hoverMiddleY - deadZoneOffset && hoverClientY < hoverMiddleY + deadZoneOffset
	)
}
