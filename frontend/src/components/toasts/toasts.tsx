import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'
import {
	ToastsContext,
	type ToastIdType,
	type ToastOptionsWithId,
	type ToastsHandle
} from './useToasts'

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

export const ToastsProvider = ({ children }: React.PropsWithChildren) => {
	const toastsRef = useRef<ToastsHandle>(null)

	return (
		<ToastsContext.Provider value={toastsRef}>
			{children}
			<Toasts ref={toastsRef} />
		</ToastsContext.Provider>
	)
}
