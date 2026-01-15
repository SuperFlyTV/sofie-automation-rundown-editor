import { useContext, useMemo, type JSX } from 'react'
import { nanoid } from '@reduxjs/toolkit'
import { createContext, type RefObject } from 'react'
import type { ToastHeaderProps, ToastBodyProps } from 'react-bootstrap'
import type { Variant } from 'react-bootstrap/esm/types'

export interface ToastsHandle {
	show: (toastOptionsWithId: ToastOptionsWithId) => void
	hide: (id: ToastIdType) => void
}

export const ToastsContext = createContext<RefObject<ToastsHandle | null> | undefined>(undefined)

export type ToastIdType = string

export interface ToastOptions {
	headerContent: string
	bodyContent: string | JSX.Element
	toastHeaderProps?: ToastHeaderProps
	toastBodyProps?: ToastBodyProps
	autohide?: number // Default: 5000
	color?: Variant
}

export type ToastOptionsWithId = ToastOptions & { id: ToastIdType }

export function useToasts() {
	const ctx = useContext(ToastsContext)
	if (ctx === undefined) {
		throw Error(
			'`useToasts` must be used inside of a `ToastsProvider`, ' +
				'otherwise it will not function correctly.'
		)
	}

	return useMemo(() => {
		const show = (toastOptions: ToastOptions): ToastIdType => {
			const id = nanoid()
			ctx.current?.show({
				autohide: 5000,
				...toastOptions,
				id
			})
			return id
		}
		const hide = (id: ToastIdType) => {
			ctx.current?.hide(id)
		}

		return { show, hide }
	}, [ctx])
}
