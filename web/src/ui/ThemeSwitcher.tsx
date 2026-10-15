import { useGameStore } from '../store/gameStore'

const THEMES = [
  { id: 'comic', label: '美漫' },
  { id: 'neon', label: '霓虹' },
  { id: 'modern', label: '现代' },
  { id: 'wood', label: '木质' },
]

/** 风格切换：合并为单个下拉（省空间），本地偏好保存在 localStorage。 */
export function ThemeSwitcher() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)

  return (
    <select
      className="theme-select"
      value={theme}
      title="页面风格"
      onChange={(event) => setTheme(event.target.value)}
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          主题·{t.label}
        </option>
      ))}
    </select>
  )
}
