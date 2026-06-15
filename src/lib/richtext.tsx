import React from 'react'

// Sehr einfacher, abhängigkeitsfreier Renderer für **fett** und *kursiv*.
// Zeilenumbrüche werden als <br /> dargestellt.
export function renderRichText(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {renderInline(line)}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ))
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
