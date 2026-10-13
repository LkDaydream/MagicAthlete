import { useGameStore } from '../store/gameStore'

const THEMES = [
  { id: 'comic', label: '美漫', color: '#e6392b' },
  { id: 'neon', label: '霓虹', color: '#22d3ee' },
  { id: 'modern', label: '现代', color: '#4f46e5' },
  { id: 'wood', label: '木质', color: '#8a5a2b' },
]

/** 风格切换：本地偏好，保存在 localStorage。 */
export function ThemeSwitcher() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)

  return (
    <div className="theme-switcher">
      {THEMES.map((t) => (
        <button
          key={t.id}
          className={theme === t.id ? 'active' : ''}
          onClick={() => setTheme(t.id)}
          title={t.label}
        >
          <span className="sw" style={{ background: t.color }} />
          {t.label}
        </button>
      ))}
    </div>
  )
}
