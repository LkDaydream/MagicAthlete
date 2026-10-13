import type { Envelope } from '../protocol/messages'

type Handler = (message: Envelope) => void

/**
 * 轻量 WebSocket 客户端：自动重连 + 消息订阅。
 * 重连后由上层负责重新走 `room:join`（携带 token 复用身份）。
 */
export class GameSocket {
  private readonly url: string
  private ws: WebSocket | null = null
  private readonly messageHandlers = new Set<Handler>()
  private readonly openHandlers = new Set<() => void>()
  private readonly closeHandlers = new Set<() => void>()
  private reconnectTimer: number | null = null
  private reconnectDelay = 500
  private closedByUser = false

  constructor(url: string) {
    this.url = url
  }

  onMessage(handler: Handler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onOpen(handler: () => void): () => void {
    this.openHandlers.add(handler)
    return () => this.openHandlers.delete(handler)
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler)
    return () => this.closeHandlers.delete(handler)
  }

  connect(): void {
    this.closedByUser = false
    this.open()
  }

  private open(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => {
      this.reconnectDelay = 500
      this.openHandlers.forEach((handler) => handler())
    }
    ws.onmessage = (event) => {
      let message: Envelope
      try {
        message = JSON.parse(event.data as string) as Envelope
      } catch {
        return
      }
      this.messageHandlers.forEach((handler) => handler(message))
    }
    ws.onclose = () => {
      this.closeHandlers.forEach((handler) => handler())
      if (!this.closedByUser) {
        this.scheduleReconnect()
      }
    }
    ws.onerror = () => {
      try {
        ws.close()
      } catch {
        /* ignore */
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer != null) {
      return
    }
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.6, 5000)
      this.open()
    }, this.reconnectDelay)
  }

  send(type: string, payload: unknown = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }
    this.ws.send(JSON.stringify({ type, payload }))
  }

  close(): void {
    this.closedByUser = true
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
  }
}
