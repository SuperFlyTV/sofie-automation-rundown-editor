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
}) {
	const { plugin, initialItemXml, onItem, onCancel } = props
	const frameRate = useAppSelector(selectFrameRate)
	const toasts = useToasts()
	// Needed to check who sent a message and to postMessage into the frame
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [ready, setReady] = useState(false) // plugin has sent appInfoRequest
	const [timedOut, setTimedOut] = useState(false) // plugin never became ready
	const [awaiting, setAwaiting] = useState(false) // Save pressed, waiting for the item reply
	const [attempt, setAttempt] = useState(0) // changing this remounts the iframe (Retry)

	const url = new URL(plugin.url)
	const pluginOrigin = url.origin
	// Plugins use this param as the postMessage target when talking to us
	url.searchParams.set('origin', window.location.origin)
	const src = url.toString()

	const send = useCallback(
		(xml: string) => iframeRef.current?.contentWindow?.postMessage(xml, pluginOrigin),
		[pluginOrigin]
	)

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			// Other windows can post messages to us; source identifies our iframe,
			// and the origin check (in readPluginMessage) rejects a frame that navigated elsewhere.
			if (event.source !== iframeRef.current?.contentWindow) return
			try {
				const msg = readPluginMessage(event, pluginOrigin, frameRate)
				if (msg.type === 'ignore') return
				if (msg.type === 'appInfoRequest') {
					setReady(true)
					send(buildAppInfo(initialItemXml))
				} else if (msg.type === 'item') {
					send(buildAck('ACK'))
					// Only act on the reply to our own request
					if (awaiting) {
						setAwaiting(false)
						onItem(msg.item)
					}
				} else {
					send(buildAck('ACK'))
					onCancel()
				}
			} catch (e) {
				console.error(e)
				const reason = e instanceof Error ? e.message : String(e)
				send(buildAck('ERROR', reason))
				toasts.show({
					headerContent: 'MOS plugin',
					bodyContent: `Received an invalid message from the plugin: ${reason}`
				})
			}
		}
		window.addEventListener('message', listener)
		return () => window.removeEventListener('message', listener)
	}, [pluginOrigin, send, frameRate, initialItemXml, awaiting, onItem, onCancel, toasts])

	// Show a warning if the plugin never says hello
	useEffect(() => {
		const timer = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS)
		return () => clearTimeout(timer)
	}, [attempt])

	// Give up waiting for the item reply so Save does not stay disabled forever
	useEffect(() => {
		if (!awaiting) return
		const timer = setTimeout(() => {
			setAwaiting(false)
			toasts.show({
				headerContent: 'MOS plugin',
				bodyContent: `${plugin.name} did not reply to the save request. Try again.`
			})
		}, SAVE_TIMEOUT_MS)
		return () => clearTimeout(timer)
	}, [awaiting, plugin.name, toasts])

	const save = () => {
		setAwaiting(true)
		send(buildItemRequest())
	}

	const retry = () => {
		setReady(false)
		setTimedOut(false)
		setAttempt((a) => a + 1)
	}

	return (
		<>
			{!ready &&
				(timedOut ? (
					<Alert variant="warning">
						{plugin.name} did not respond. It may be unreachable, or it may block embedding
						(frame-ancestors / X-Frame-Options).
						<div className="text-break">URL: {plugin.url}</div>
						<Button type="button" size="sm" variant="outline-secondary" onClick={retry}>
							Retry
						</Button>
					</Alert>
				) : (
					<div className="d-flex align-items-center gap-2 mb-2">
						<Spinner size="sm" /> Waiting for {plugin.name}...
					</div>
				))}
			<iframe
				key={attempt}
				ref={iframeRef}
				src={src}
				title={`${plugin.name} plugin`}
				onLoad={(e) => e.currentTarget.focus()}
				// Capped so the Save/Cancel buttons below stay on screen
				style={{ width: '100%', height: '60vh', maxHeight: 'calc(100vh - 220px)', border: 0 }}
			/>
			<div className="d-flex justify-content-end gap-2 mt-2">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" variant="primary" disabled={!ready || awaiting} onClick={save}>
					{awaiting ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</>
	)
}
