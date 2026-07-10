/**
 * Einfacher Markdown→HTML Renderer für Artikel-Inhalte.
 * Unterstützt: Überschriften (H1-H4), Fett, Kursiv, Links, Bilder, Listen,
 * nummerierte Listen, Tabellen, Tipp-Boxen (:::tipp), YouTube-Embeds, Blockquotes.
 */
export function renderMarkdown(md: string): string {
  let html = md

  // ── Tipp/Info-Boxen: :::tipp ... ::: (mehrzeilig oder einzeilig) ──
  html = html.replace(/:::tipp\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-forest/5 border-l-4 border-forest rounded-r-xl px-5 py-4 my-6"><p class="text-xs font-bold text-forest uppercase tracking-wide mb-1">💡 Tipp</p><div class="text-stone-700 text-sm leading-relaxed">${content.trim()}</div></div>`
  )
  html = html.replace(/:::info\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-5 py-4 my-6"><p class="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">ℹ️ Info</p><div class="text-stone-700 text-sm leading-relaxed">${content.trim()}</div></div>`
  )
  html = html.replace(/:::warnung\s+([\s\S]*?):::/g, (_, content) =>
    `<div class="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-5 py-4 my-6"><p class="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">⚠️ Achtung</p><div class="text-stone-700 text-sm leading-relaxed">${content.trim()}</div></div>`
  )

  // ── YouTube-Embeds: @youtube[VIDEO_ID] ──
  html = html.replace(/@youtube\[([a-zA-Z0-9_-]{11})\]/g,
    '<div class="aspect-video rounded-xl overflow-hidden my-6"><iframe src="https://www.youtube-nocookie.com/embed/$1" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
  )

  // ── Tabellen: | col | col | ──
  html = html.replace(/((?:^\|[^\n]+\|$\n?)+)/gm, (table) => {
    const rows = table.trim().split('\n').filter((r) => r.trim())
    if (rows.length < 2) return table
    const isHeader = rows[1]?.match(/^\|[\s-:|]+\|$/)
    let out = '<div class="overflow-x-auto my-6"><table class="w-full text-sm border-collapse rounded-xl overflow-hidden">'
    rows.forEach((row, i) => {
      if (i === 1 && isHeader) return
      const cells = row.split('|').filter((c, ci, arr) => ci > 0 && ci < arr.length - 1)
      const tag = i === 0 && isHeader ? 'th' : 'td'
      const cellClass = i === 0 && isHeader
        ? 'bg-forest/10 text-stone-800 font-semibold text-left px-4 py-2.5'
        : 'border-t border-cream-deep px-4 py-2.5 text-stone-600'
      out += '<tr>' + cells.map((c) => `<${tag} class="${cellClass}">${c.trim()}</${tag}>`).join('') + '</tr>'
    })
    out += '</table></div>'
    return out
  })

  // ── Blockquotes: > text ──
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-stone-300 pl-4 py-1 my-4 text-stone-500 italic">$1</blockquote>')

  // ── Überschriften ──
  html = html.replace(/^#### (.+)$/gm, '<h4 class="font-serif text-lg font-bold text-stone-900 mt-6 mb-2">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-serif text-xl font-bold text-stone-900 mt-8 mb-3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-serif text-3xl font-bold text-stone-900 mt-10 mb-4">$1</h1>')

  // ── Inline-Formatierung ──
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // ── Bilder ──
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-6 w-full" />')

  // ── Links ──
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-forest underline hover:text-forest-light" target="_blank" rel="noopener">$1</a>')

  // ── Nummerierte Listen: 1. item ──
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^\d+\.\s/, ''))
    return '<ol class="list-decimal list-inside space-y-1 my-4 ml-4 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>'
  })

  // ── Aufzählungslisten: - item ──
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^- /, ''))
    return '<ul class="list-disc list-inside space-y-1 my-4 ml-4 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>'
  })

  // ── Horizontale Linie: --- ──
  html = html.replace(/^\s*---\s*$/gm, '<hr class="border-cream-deep my-8" />')

  // ── Absätze (Zeilen die kein HTML-Tag sind) ──
  html = html.replace(/^(?!<[a-z/])((?!<).+)$/gm, '<p class="text-stone-700 leading-relaxed mb-4">$1</p>')
  html = html.replace(/<p class="text-stone-700 leading-relaxed mb-4"><\/p>/g, '')

  return html
}
