import { nanoid } from '@reduxjs/toolkit'
import {
	createContext,
	forwardRef,
	useContext,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
	type JSX,
	type RefObject
} from 'react'
import { Toast, ToastContainer, type ToastBodyProps, type ToastHeaderProps } from 'react-bootstrap'
import type { Variant } from 'react-bootstrap/esm/types'

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

interface ToastsHandle {
	show: (toastOptionsWithId: ToastOptionsWithId) => void
	hide: (id: ToastIdType) => void
}

const ToastsContext = createContext<RefObject<ToastsHandle | null> | undefined>(undefined)

const Toasts = forwardRef<ToastsHandle>((_props, ref) => {
	const [toasts, setToasts] = useState<ToastOptionsWithId[]>([])

	useImperativeHandle(ref, () => ({
		show: (toastOptionsWithId: ToastOptionsWithId) => {
			setToasts((state) => {
				const clone = [...state]
				clone.push(toastOptionsWithId)
				// if (props.limit && clone.length > props.limit) {
				// 	clone.shift()
				// }
				return clone
			})
		},

		hide: (id: ToastIdType) => {
			setToasts((state) => [...state].filter((t) => t.id !== id))
		}
	}))

	return (
		<ToastContainer position="top-center" className="mt-2">
			{toasts.map((toast) => {
				// const { onClose } = toast.toastProps ?? {}
				// delete toast.toastProps?.onClose

				return (
					<Toast
						key={toast.id}
						// {...toast.toastProps}
						bg={toast.color}
						autohide={!!toast.autohide && toast.autohide > 0}
						delay={toast.autohide && toast.autohide > 0 ? toast.autohide : undefined}
						onClose={() => {
							setToasts((oldState) => oldState.filter((t) => t.id !== toast.id))
							// onClose?.()
						}}
					>
						<Toast.Header {...toast.toastHeaderProps}>{toast.headerContent}</Toast.Header>
						<Toast.Body {...toast.toastBodyProps}>{toast.bodyContent}</Toast.Body>
					</Toast>
				)
			})}
		</ToastContainer>
	)
})

export const ToastsProvider = ({ children }: React.PropsWithChildren<Record<string, never>>) => {
	const toastsRef = useRef<ToastsHandle>(null)

	return (
		<ToastsContext.Provider value={toastsRef}>
			{children}
			<Toasts ref={toastsRef}></Toasts>
		</ToastsContext.Provider>
	)
}

export function useToasts() {
	const ctx = useContext(ToastsContext)
	if (ctx === undefined) {
		throw Error(
			'`useToasts` must be used inside of a `ToastsProvider`, ' +
				'otherwise it will not function correctly.'
		)
	}

	const api = useMemo(() => {
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

		return {
			show,
			hide
		}
	}, [ctx])

	return api
}
