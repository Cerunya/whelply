/**
 * Einfacher Markdown→HTML Renderer für Artikel-Inhalte.
 * Unterstützt: Überschriften (H1-H4), Fett, Kursiv, Links, Bilder, Listen,
 * nummerierte Listen, Tabellen, Tipp/Info/Warnung/Fazit/Custom-Farbboxen,
 * Produkt-Karten, YouTube-Embeds, Blockquotes, Schriftart-Blöcke (:::schrift[...]).
 *
 * Leerzeilen-Logik:
 * - 1 Enter (\n)         → <br> innerhalb des Absatzes
 * - 2 Enter (1 Leerzeile) → neuer Absatz (normaler Abstand via mb-*)
 * - 3+ Enter (2+ Leerzeilen) → jede zusätzliche Leerzeile = extra Spacer-Abstand,
 *   funktioniert auch zwischen Boxen bzw. Box ↔ Text
 *
 * Abstands-Logik rund um Listen:
 * - Text direkt VOR einer Liste bekommt nur minimalen Abstand (mb-1) —
 *   er gehört optisch zur Liste
 * - Der eigentliche Abstand kommt NACH der Liste (ul/ol haben mb-*)
 * - Muster: Text → eng → Liste → Abstand → nächster Block
 */

import { getFont } from './fonts'

export type ProductData = {
  asin: string
  name: string
  imageUrl: string | null
  description: string | null
  affiliateTag: string
  priceCents: number | null
  isAvailable: boolean
}

// Block-Level-HTML erkennen (darf nicht in <p> gewrappt werden)
const BLOCK_RE = /^<(?:div|h[1-6]|p[ >]|ul|ol|li|table|tr|td|th|blockquote|hr|img|iframe|figure|br)/i

/**
 * Wrappt einen Text-Block in <p>-Absätze:
 * - Block-Level-HTML (Listen, Überschriften, …) bleibt eigenständig
 * - zusammenhängende Textzeilen werden mit <br> zu einem <p> verbunden
 * - gilt auch für Text VOR, ZWISCHEN und NACH Block-Elementen im selben Block
 * - Text direkt VOR einer Liste bekommt pClassBeforeList (enger Abstand)
 */
function wrapParagraphBlocks(blockText: string, pClass: string, pClassBeforeList: string): string {
  const trimmed = blockText.trim()
  if (!trimmed) return ''
  const out: string[] = []
  let textBuf: string[] = []
  const flush = (beforeList = false) => {
    if (textBuf.length > 0) {
      out.push(`<p class="${beforeList ? pClassBeforeList : pClass}">${textBuf.join('<br>')}</p>`)
      textBuf = []
    }
  }
  for (const line of trimmed.split('\n')) {
    const l = line.trim()
    if (!l) continue
    if (BLOCK_RE.test(l)) {
      flush(/^<(?:ul|ol)/i.test(l))
      out.push(l)
    } else {
      textBuf.push(l)
    }
  }
  flush()
  return out.join('\n')
}

/** Extrahiert alle ASINs aus dem Markdown-Content */
export function extractAsins(md: string): string[] {
  const found: string[] = []
  const re = /:::produkt\[([A-Z0-9]{10})\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

/** Extrahiert alle verwendeten :::schrift[...]-Fonts (für Google-Fonts-Nachladen) */
export function extractFonts(md: string): string[] {
  const found: string[] = []
  const re = /:::schrift\[([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const font = getFont(m[1].trim())
    if (font && !found.includes(font.name)) found.push(font.name)
  }
  return found
}

/**
 * Verarbeitet Markdown innerhalb von Boxen (Tipp, Info, Fazit, Custom).
 * Keine hardcoded Textfarben — alles erbt vom Parent-Container.
 * inSchrift: true, wenn der Inhalt bereits in einem :::schrift-Block steht —
 *   Überschriften bekommen dann KEIN font-serif, damit die gewählte
 *   Schriftart nicht von der Klasse am h*-Element überschrieben wird.
 * articleColors: true für :::schrift im normalen Artikel-Fließtext —
 *   Absätze/Überschriften bekommen dann die Artikel-Farben (text-stone-700/-900),
 *   sonst erben sie die (zu dunkle) Standard-Farbe und stechen heraus.
 */
function renderBoxContent(raw: string, inSchrift = false, articleColors = false): string {
  let h = raw.trim()

  // Zeilenenden normalisieren
  h = h.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Leerzeilen normalisieren (Zeilen die nur Spaces/Tabs enthalten → echte Leerzeilen)
  // WICHTIG: nur [ \t], NICHT \s — \s würde Zeilenumbrüche mitfressen
  h = h.replace(/^[ \t]+$/gm, '')

  // Formatmarker, die einen Schrift-Block DIREKT umschließen, nach INNEN ziehen:
  // **:::schrift[X]t:::** → :::schrift[X]**t**::: (sonst <div> in <strong> → Browser zerbricht es)
  // WICHTIG: strikte Adjazenz — KEIN \s* dazwischen! Ein \s* würde Zeilenumbrüche erlauben
  // und so einen fetten Text, der zufällig VOR einem Schrift-Block steht, mit diesem
  // verknüpfen (frisst sich dann lazy über mehrere Blöcke → zerstört das ganze Dokument)
  h = h.replace(/(\*\*|__)(:::schrift\[[^\]]+\])\s*([\s\S]*?)\s*:::\1/g, '$2\n$1$3$1\n:::')
  // Überschriften-Zeile mit Schrift-Block: ## :::schrift[X]t::: → :::schrift[X]\n## t\n:::
  h = h.replace(/^(#{1,4})\s*(:::schrift\[[^\]]+\])\s*(.*?):::\s*$/gm, '$2\n$1 $3\n:::')

  // Schriftart-Blöcke: :::schrift[Font Name] ... :::
  h = h.replace(/:::schrift\[([^\]]+)\]\s*([\s\S]*?):::/g, (_, fontName, content) => {
    const font = getFont(fontName.trim())
    if (!font) return content
    return `<div style="font-family:'${font.name}', ${font.fallback}">${renderBoxContent(content, true, articleColors)}</div>`
  })

  // * Listen → - Listen
  h = h.replace(/^\* /gm, '- ')

  // Bullet-Zeichen: mitten im Text → eigene Zeile, am Zeilenanfang → Listensyntax
  h = h.replace(/(?<!^)(?<!\n)(\*?\*?[•●])/gm, '\n$1')
  h = h.replace(/^[•●]\s*/gm, '- ')
  h = h.replace(/^- [•●]\s*/gm, '- ')

  // Überschriften (ohne Farbklassen — erbt vom Box-Container)
  // inSchrift: kein font-serif, sonst überschreibt die Klasse die :::schrift-Schriftart
  const serif = inSchrift ? '' : 'font-serif '
  const hColor = articleColors ? 'text-stone-900 ' : ''
  h = h.replace(/^#### (.+)$/gm, `<h4 class="${serif}${hColor}text-lg font-bold mt-4 mb-1">$1</h4>`)
  h = h.replace(/^### (.+)$/gm, `<h3 class="${serif}${hColor}text-xl font-bold mt-5 mb-2">$1</h3>`)
  h = h.replace(/^## (.+)$/gm, `<h2 class="${serif}${hColor}text-2xl font-bold mt-6 mb-2">$1</h2>`)

  // Inline
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline hover:opacity-80" target="_blank" rel="noopener">$1</a>')

  // Listen
  // trailing \n am Ersatz: verhindert, dass Folgetext am Block-Element klebt
  h = h.replace(/((?:^\d+\.\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^\d+\.\s/, ''))
    return '<ol class="list-decimal list-outside pl-6 space-y-1 mb-3">' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>\n'
  })
  h = h.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^- /, ''))
    return '<ul class="list-disc list-outside pl-6 space-y-1 mb-3">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>\n'
  })

  // Absätze mit Zeilenumbruch-Unterstützung
  // Trenner mitbeachten: jede Leerzeile ÜBER der ersten erzeugt einen Spacer
  const parts = h.split(/(\n{2,})/)
  h = parts.map((part, idx) => {
    if (idx % 2 === 1) {
      // Trenner: n Zeilenumbrüche = n-1 Leerzeilen; erste = normaler Absatzabstand
      const extra = Math.max(0, part.length - 2)
      return Array.from({ length: extra }, () => '<div class="h-4" aria-hidden="true"></div>').join('\n')
    }
    return wrapParagraphBlocks(part, articleColors ? 'text-stone-700 leading-relaxed mb-3' : 'leading-relaxed mb-3', articleColors ? 'text-stone-700 leading-relaxed mb-1' : 'leading-relaxed mb-1')
  }).filter(Boolean).join('\n')

  return h
}

export function renderMarkdown(md: string, products?: Map<string, ProductData>): string {
  let html = md

  // ── Zeilenenden normalisieren (Windows \r\n → \n) ──
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // ── Markdown-Listen mit * normalisieren: * item → - item ──
  html = html.replace(/^\* /gm, '- ')

  // ── Bullet-Zeichen: mitten im Text → eigene Zeile, am Zeilenanfang → Listensyntax ──
  html = html.replace(/(?<!^)(?<!\n)(\*?\*?[•●])/gm, '\n$1')
  html = html.replace(/^[•●]\s*/gm, '- ')
  html = html.replace(/^- [•●]\s*/gm, '- ')

  // ── Produkt-Karten: :::produkt[ASIN] ──
  html = html.replace(/:::produkt\[([A-Z0-9]{10})\]/g, (_, asin) => {
    const p = products?.get(asin)
    if (!p) return `<p class="text-stone-400 text-sm my-4">[Produkt ${asin} nicht gefunden]</p>`
    if (!p.isAvailable) return ''

    const url = `https://www.amazon.de/dp/${p.asin}?tag=${p.affiliateTag}`
    const img = p.imageUrl
      ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-24 h-24 md:w-28 md:h-28 rounded-xl object-contain flex-shrink-0" />`
      : `<div class="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-cream flex items-center justify-center flex-shrink-0"><svg class="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>`
    const desc = p.description ? `<p class="text-stone-500 text-sm mt-1">${p.description}</p>` : ''

    return `<div class="my-6 bg-white border border-cream-deep rounded-2xl p-4 flex gap-4 items-center hover:shadow-sm transition-shadow"><a href="${url}" target="_blank" rel="noopener nofollow sponsored">${img}</a><div class="flex-1 min-w-0"><a href="${url}" target="_blank" rel="noopener nofollow sponsored" class="font-semibold text-stone-900 hover:text-forest transition-colors block">${p.name}</a>${desc}<a href="${url}" target="_blank" rel="noopener nofollow sponsored" class="inline-block mt-3 bg-honey text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-honey-light transition-colors">Bei Amazon ansehen →</a></div></div>`
  })

  // ── Schriftart-Vorverarbeitung ──
  // Formatmarker, die einen Schrift-Block DIREKT umschließen, nach INNEN ziehen:
  // **:::schrift[X]t:::** → :::schrift[X]**t**::: (sonst <div> in <strong> → Browser zerbricht es)
  // WICHTIG: strikte Adjazenz — KEIN \s* dazwischen! (s. Kommentar in renderBoxContent)
  html = html.replace(/(\*\*|__)(:::schrift\[[^\]]+\])\s*([\s\S]*?)\s*:::\1/g, '$2\n$1$3$1\n:::')
  // Überschriften-Zeile mit Schrift-Block: ## :::schrift[X]t::: → :::schrift[X]\n## t\n:::
  html = html.replace(/^(#{1,4})\s*(:::schrift\[[^\]]+\])\s*(.*?):::\s*$/gm, '$2\n$1 $3\n:::')

  // ── Tipp/Info/Warnung/Fazit/Custom-Boxen ──
  // BOX_CONTENT erlaubt komplette :::schrift[...] ... :::-Blöcke im Inneren,
  // stoppt aber an jedem anderen ::: (sonst würde der Box-Inhalt am schließenden
  // ::: des Schrift-Blocks enden). Deshalb laufen die Boxen VOR der Schrift-Regel:
  // Schrift in Boxen wird dann von renderBoxContent ohne Artikel-Farben gerendert
  // und erbt die Box-Farbe (wichtig für :::fazit / dunkle :::box).
  const BOX_CONTENT = '((?:(?!:::)[\\s\\S]|:::schrift\\[[^\\]]+\\][\\s\\S]*?:::)*)'
  html = html.replace(new RegExp(':::tipp\\s+' + BOX_CONTENT + ':::', 'g'), (_, content) =>
    `<div class="bg-green-50 border-l-4 border-green-500 rounded-r-xl px-5 py-4 my-8"><p class="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">💡 Tipp</p><div class="text-stone-700 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )
  html = html.replace(new RegExp(':::info\\s+' + BOX_CONTENT + ':::', 'g'), (_, content) =>
    `<div class="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-5 py-4 my-8"><p class="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">ℹ️ Info</p><div class="text-stone-700 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )
  html = html.replace(new RegExp(':::warnung\\s+' + BOX_CONTENT + ':::', 'g'), (_, content) =>
    `<div class="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-5 py-4 my-8"><p class="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">⚠️ Achtung</p><div class="text-stone-700 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )
  html = html.replace(new RegExp(':::fazit\\s+' + BOX_CONTENT + ':::', 'g'), (_, content) =>
    `<div class="bg-forest rounded-2xl px-6 py-5 my-10 shadow-sm"><p class="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">✍️ Fazit der Redaktion</p><div class="text-white/90 text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  )

  // ── Custom Farbbox: :::box[#hex] ... ::: ──
  html = html.replace(new RegExp(':::box\\[([^\\]]+)\\]\\s+' + BOX_CONTENT + ':::', 'g'), (_, color, content) => {
    const c = color.trim()
    const hex = c.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) || 0
    const g = parseInt(hex.substring(2, 4), 16) || 0
    const b = parseInt(hex.substring(4, 6), 16) || 0
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const textClass = luminance > 0.55 ? 'text-stone-800' : 'text-white/90'
    return `<div class="rounded-2xl px-6 py-5 my-8 ${textClass}" style="background-color:${c}"><div class="text-sm leading-relaxed">${renderBoxContent(content)}</div></div>`
  })

  // ── Schriftart-Blöcke im normalen Fließtext (mit Artikel-Farben) ──
  // Läuft NACH den Box-Regeln: was hier noch übrig ist, steht im Fließtext.
  html = html.replace(/:::schrift\[([^\]]+)\]\s*([\s\S]*?):::/g, (_, fontName, content) => {
    const font = getFont(fontName.trim())
    if (!font) return content
    return `<div class="my-4" style="font-family:'${font.name}', ${font.fallback}">${renderBoxContent(content, true, true)}</div>`
  })

  // ── YouTube-Embeds: @youtube[VIDEO_ID] ──
  html = html.replace(/@youtube\[([a-zA-Z0-9_-]{11})\]/g,
    '<div class="aspect-video rounded-xl overflow-hidden my-6"><iframe src="https://www.youtube-nocookie.com/embed/$1" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
  )

  // ── Tabellen: | col | col | ──
  html = html.replace(/((?:^\|[^\n]+\|$\n?)+)/gm, (table) => {
    const rows = table.trim().split('\n').filter((r) => r.trim())
    if (rows.length < 2) return table
    const isHeader = rows[1]?.match(/^\|[\s-:|]+\|$/)
    let out = '<div class="overflow-x-auto my-12"><table class="w-full text-sm border-collapse rounded-xl overflow-hidden">'
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
    return out + '\n' // trailing \n: verhindert, dass Folgetext am Block-Element klebt
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

  // ── Bilder mit optionaler Bildunterschrift: ![alt](url "Unterschrift") ──
  html = html.replace(/!\[([^\]]*)\]\(([^\s)]+)\s+"([^"]+)"\)/g,
    '<figure class="mt-6"><img src="$2" alt="$1" class="rounded-xl w-full" /><figcaption class="text-center text-xs text-stone-400 mt-2 italic">$3</figcaption></figure>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="rounded-xl my-10 w-full" />')

  // ── Links ──
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-forest underline hover:text-forest-light" target="_blank" rel="noopener">$1</a>')

  // ── Nummerierte Listen: 1. item ──
  // trailing \n am Ersatz: verhindert, dass Folgetext am Block-Element klebt
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^\d+\.\s/, ''))
    return '<ol class="list-decimal list-outside pl-6 space-y-1 mb-4 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ol>\n'
  })

  // ── Aufzählungslisten: - item ──
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map((l) => l.replace(/^- /, ''))
    return '<ul class="list-disc list-outside pl-6 space-y-1 mb-4 text-stone-700">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>\n'
  })

  // ── Horizontale Linie: --- ──
  html = html.replace(/^\s*---\s*$/gm, '<hr class="border-stone-200 my-10" />')

  // ── Absätze mit Zeilenumbruch-Unterstützung ──
  // 1 Enter (\n) → <br> innerhalb desselben Absatzes
  // 2 Enter (1 Leerzeile) → neuer Absatz (<p>)
  // 3+ Enter (2+ Leerzeilen) → jede zusätzliche Leerzeile erzeugt einen Spacer
  //   (sichtbarer Extra-Abstand, auch zwischen Boxen bzw. Box ↔ Text)

  // Leerzeilen normalisieren (Zeilen die nur Spaces/Tabs enthalten → echte Leerzeilen)
  // WICHTIG: nur [ \t], NICHT \s — \s würde Zeilenumbrüche mitfressen
  html = html.replace(/^[ \t]+$/gm, '')

  // Split MIT Trenner-Capture, damit die Anzahl der Leerzeilen erhalten bleibt
  const parts = html.split(/(\n{2,})/)
  html = parts.map((part, idx) => {
    if (idx % 2 === 1) {
      // Trenner zwischen Blöcken: n Zeilenumbrüche = n-1 Leerzeilen.
      // Die erste Leerzeile ist der normale Abstand (via my-*/mb-*-Klassen),
      // jede weitere wird ein sichtbarer Spacer.
      const extra = Math.max(0, part.length - 2)
      return Array.from({ length: extra }, () => '<div class="h-6" aria-hidden="true"></div>').join('\n')
    }
    return wrapParagraphBlocks(part, 'text-stone-700 leading-relaxed mb-4', 'text-stone-700 leading-relaxed mb-1')
  }).filter(Boolean).join('\n')

  return html
}
