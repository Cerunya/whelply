import React from 'react'

// Unterstützte Syntax:
// **text** = fett
// *text* = kursiv
// ![alt](url) = Bild (zentriert, max-Breite)
// @youtube[id] = YouTube-Einbettung (responsive 16:9)
// Zeilenumbrüche = <br />

export function renderRichText(text: string): React.ReactNode {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // YouTube embed
    const ytMatch = line.match(/^@youtube\[([a-zA-Z0-9_-]{11})\]$/)
    if (ytMatch) {
      nodes.push(
        <div key={i} className="relative w-full my-4" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-xl"
          />
        </div>
      )
      continue
    }

    // Image
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgMatch) {
      const alt = imgMatch[1]
      const url = imgMatch[2]
      const isFilename = /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(alt)
      nodes.push(
        <div key={i} className="my-4 flex flex-col items-center gap-2">
          <img
            src={url}
            alt={alt}
            className="max-w-full rounded-xl shadow-sm"
            style={{ maxHeight: '500px' }}
          />
          {alt && !isFilename && (
            <p className="text-xs text-stone-400 italic">{alt}</p>
          )}
        </div>
      )
      continue
    }

    // Regular line with inline formatting
    if (line === '') {
      nodes.push(<br key={i} />)
    } else {
      nodes.push(
        <React.Fragment key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && lines[i + 1] !== '' && <br />}
        </React.Fragment>
      )
    }
  }

  return <>{nodes}</>
}

function renderInline(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex))
  }
  return parts
}
