import { useEffect, useMemo, useState } from 'react'

interface CharEntry {
  id: string
  name: string
  nameEn?: string
  skill: string
}

/** 「角色速查」按钮：弹出全部角色，支持模糊查询。 */
export function CharacterLookup() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<CharEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open || list.length > 0) return
    fetch(`${import.meta.env.BASE_URL}api/characters`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? (data as CharEntry[]) : []))
      .catch(() => setList([]))
  }, [open, list.length])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameEn ?? '').toLowerCase().includes(q) ||
        c.skill.toLowerCase().includes(q),
    )
  }, [list, query])

  return (
    <>
      <button className="focus-btn" onClick={() => setOpen(true)}>
        角色速查
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal lookup-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>角色速查（{list.length}）</h3>
              <button className="link" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            <input
              className="lookup-input"
              value={query}
              placeholder="输入 中文名 / 英文名 / 技能关键词…"
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            <div className="lookup-list">
              {filtered.map((c) => (
                <div key={c.id} className="lookup-row">
                  <div className="lookup-title">
                    <span className="lookup-name">{c.name}</span>
                    <span className="lookup-en">{c.nameEn ?? ''}</span>
                  </div>
                  <div className="lookup-skill">{c.skill}</div>
                </div>
              ))}
              {filtered.length === 0 && <div className="lookup-empty">无匹配角色</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
