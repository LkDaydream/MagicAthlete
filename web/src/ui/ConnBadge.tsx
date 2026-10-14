import { useGameStore } from '../store/gameStore'

/** 连接状态徽标（内联在 header / 大厅里，不再是悬浮角标，避免遮挡按钮）。 */
export function ConnBadge() {
  const connected = useGameStore((s) => s.connected)
  const roomCode = useGameStore((s) => s.roomCode)
  const cls = connected ? 'ok' : roomCode ? 'warn' : 'bad'
  const text = connected ? '已连接' : roomCode ? '重连中…' : '连接中…'
  return <span className={`conn-badge ${cls}`}>{text}</span>
}
