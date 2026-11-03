import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Spinner } from 'react-bootstrap'
import type { MosPluginConfig } from '~backend/background/interfaces'
import { useAppSelector } from '~/store/app'
import { selectFrameRate } from '~/store/connectionStatus'
import type { MosItemFields } from '~/lib/mosItem'
import {
	buildAck,
	buildAppInfo,
	buildItemRequest,
	readPluginMessage
} from '~/lib/mosPluginMessages'
import { useToasts } from '../toasts/useToasts'

const READY_TIMEOUT_MS = 10_000
const SAVE_TIMEOUT_MS = 5_000

export function MosPluginFrame(props: {
	// Must have a valid http(s) URL: use plugins from useMosPlugins, which filters the rest out
	plugin: MosPluginConfig
	initialItemXml?: string // present means EDIT, absent means CREATE
	onItem: (item: MosItemFields) => void // called after the user presses Save
	onCancel: () => void
	submitLabel?: string // text of the Save button
	autoFocus?: boolean // focus the plugin when it loads
}) {
	const { plugin, initialItemXml, onItem, onCancel, submitLabel = 'Save', autoFocus = true } = props
	const frameRate = useAppSelector(selectFrameRate)
	const toasts = useToasts()
	// Needed to check who sent a message and to postMessage into the frame
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [ready, setReady] = useState(false) // plugin has sent appInfoRequest
	const [timedOutAttempt, setTimedOutAttempt] = useState<number>() // attempt that never became ready
	const [awaiting, setAwaiting] = useState(false) // Save pressed, waiting for the item reply
	const [attempt, setAttempt] = useState(0) // changing this remounts the iframe (Retry)
	const [error, setError] = useState<string>() // last Save/message failure, cleared on next Save
	const timedOut = timedOutAttempt === attempt

	const url = new URL(plugin.url)
	const pluginOrigin = url.origin
	// The plugin posts its messages to this origin, so it must be ours
	url.searchParams.set('origin', window.location.origin)
	const src = url.toString()

	// Keep the latest values in refs so the message listener below can subscribe once
	// and still see current props and state.
	const latest = useRef({ onItem, onCancel, awaiting, initialItemXml, frameRate })
	useEffect(() => {
		latest.current = { onItem, onCancel, awaiting, initialItemXml, frameRate }
	})

	const send = useCallback(
		(xml: string) => iframeRef.current?.contentWindow?.postMessage(xml, pluginOrigin),
		[pluginOrigin]
	)

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			// Other windows can post messages to us; source identifies our iframe,
			// and the origin check (in readPluginMessage) rejects a frame that navigated elsewhere.
			if (event.source !== iframeRef.current?.contentWindow) return
			const { onItem, onCancel, awaiting, initialItemXml, frameRate } = latest.current

			// Only a problem with the plugin's message is reported back to the plugin as ERROR
			let msg
			try {
				msg = readPluginMessage(event, pluginOrigin, frameRate)
			} catch (e) {
				console.error(e)
				const reason = e instanceof Error ? e.message : String(e)
				send(buildAck('ERROR', reason))
				const text = `Received an invalid message from ${plugin.name}: ${reason}`
				setError(text)
				toasts.show({ headerContent: 'MOS plugin', bodyContent: text })
				return
			}
			if (!msg) return

			if (msg.type === 'appInfoRequest') {
				setReady(true)
				send(buildAppInfo(initialItemXml))
			} else if (msg.type === 'item') {
				send(buildAck('ACK'))
				// Only act on the reply to our own request
				if (awaiting) {
					setAwaiting(false)
					try {
						onItem(msg.item)
					} catch (e) {
						// Our own failure, not the plugin's: do not tell the plugin
						console.error(e)
						const text = `${plugin.name}: could not use the item: ${e instanceof Error ? e.message : String(e)}`
						setError(text)
						toasts.show({ headerContent: `MOS plugin: ${plugin.name}`, bodyContent: text })
					}
				}
			} else {
				send(buildAck('ACK'))
				onCancel()
			}
		}
		window.addEventListener('message', listener)
		return () => window.removeEventListener('message', listener)
	}, [pluginOrigin, send, plugin.name, toasts])

	// Show a warning if the plugin never says hello
	useEffect(() => {
		if (ready) return // only matters while not ready
		const timer = setTimeout(() => setTimedOutAttempt(attempt), READY_TIMEOUT_MS)
		return () => clearTimeout(timer)
	}, [attempt, ready])

	// Give up waiting for the item reply so Save does not stay disabled forever
	useEffect(() => {
		if (!awaiting) return
		const timer = setTimeout(() => {
			setAwaiting(false)
			setError(`${plugin.name} did not reply to the save request. Try again.`)
		}, SAVE_TIMEOUT_MS)
		return () => clearTimeout(timer)
	}, [awaiting, plugin.name])

	const save = () => {
		setError(undefined)
		setAwaiting(true)
		send(buildItemRequest)
	}

	const retry = () => {
		setReady(false)
		setAttempt((a) => a + 1)
	}

	return (
		<>
			{!ready &&
				(timedOut ? (
					<Alert variant="warning">
						{plugin.name} did not respond. It may be unreachable, or it may block embedding
						(frame-ancestors / X-Frame-Options). Check the URL in Settings.
						<div className="text-break">URL: {plugin.url}</div>
						<div className="d-flex gap-2 mt-2">
							<Button type="button" variant="outline-secondary" onClick={retry}>
								Retry
							</Button>
							<Button
								as="a"
								variant="outline-secondary"
								href={plugin.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								Open in new tab
							</Button>
						</div>
					</Alert>
				) : (
					<div role="status" className="d-flex align-items-center gap-2 mb-2">
						<Spinner size="sm" aria-hidden="true" /> Waiting for {plugin.name}...
					</div>
				))}
			<iframe
				key={attempt}
				ref={iframeRef}
				src={src}
				title={`${plugin.name} plugin`}
				onLoad={(e) => autoFocus && e.currentTarget.focus()}
				// Capped so the Save/Cancel buttons below stay on screen
				style={{ width: '100%', height: '60vh', maxHeight: 'calc(100vh - 220px)', border: 0 }}
			/>
			{error && (
				<Alert variant="danger" className="mt-2 mb-0" role="alert">
					{error}
				</Alert>
			)}
			<div className="d-flex justify-content-end gap-2 mt-2">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" variant="primary" disabled={!ready || awaiting} onClick={save}>
					{awaiting ? 'Working...' : submitLabel}
				</Button>
			</div>
		</>
	)
}
