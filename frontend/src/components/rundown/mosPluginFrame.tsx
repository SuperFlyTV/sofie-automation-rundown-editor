import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import type { MosPluginConfig } from '~backend/background/interfaces'
import { useAppSelector } from '~/store/app'
import { selectFrameRate } from '~/store/connectionStatus'
import { parseUrl } from './useMosPlugins'
import type { MosItemFields } from '~/lib/mosItem'
import {
	buildAck,
	buildAppInfo,
	buildItemRequest,
	readPluginMessage
} from '~/lib/mosPluginMessages'

export function MosPluginFrame(props: {
	plugin: MosPluginConfig
	initialItemXml?: string // present means EDIT, absent means CREATE
	onItem: (item: MosItemFields) => void // called after the user presses Save
	onCancel: () => void
	onError: (e: unknown) => void
}) {
	const frameRate = useAppSelector(selectFrameRate)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const pending = useRef<MosItemFields | undefined>(undefined)
	const awaitingItem = useRef(false)
	const latest = useRef({ ...props, frameRate })
	latest.current = { ...props, frameRate }
	const [ready, setReady] = useState(false)

	const pluginUrl = parseUrl(props.plugin.url)
	const pluginOrigin = pluginUrl?.origin ?? ''
	const src = useMemo(() => {
		const u = new URL(props.plugin.url)
		u.searchParams.set('origin', window.location.origin)
		return u.toString()
	}, [props.plugin.url])

	const send = (xml: string) => iframeRef.current?.contentWindow?.postMessage(xml, pluginOrigin)

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			if (event.source !== iframeRef.current?.contentWindow) return
			const { initialItemXml, onItem, onCancel, onError, frameRate } = latest.current
			try {
				const msg = readPluginMessage(event, pluginOrigin, frameRate)
				if (msg.type === 'ignore') return
				setReady(true)
				if (msg.type === 'appInfoRequest') send(buildAppInfo(initialItemXml))
				else if (msg.type === 'item') {
					send(buildAck('ACK'))
					if (awaitingItem.current) {
						awaitingItem.current = false
						onItem(msg.item)
					} else pending.current = msg.item
				} else {
					send(buildAck('ACK'))
					onCancel()
				}
			} catch (e) {
				onError(e)
			}
		}
		window.addEventListener('message', listener)
		return () => window.removeEventListener('message', listener)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pluginOrigin])

	const save = () => {
		if (pending.current) props.onItem(pending.current)
		else {
			awaitingItem.current = true
			send(buildItemRequest())
		}
	}

	return (
		<>
			<iframe
				ref={iframeRef}
				src={src}
				title={props.plugin.name}
				style={{ width: '100%', height: '60vh', border: 0 }}
			/>
			<div className="d-flex justify-content-end gap-2 mt-2">
				<Button type="button" variant="secondary" onClick={props.onCancel}>
					Cancel
				</Button>
				<Button type="button" variant="primary" disabled={!ready} onClick={save}>
					Save
				</Button>
			</div>
		</>
	)
}
