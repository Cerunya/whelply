import React from 'react'

export default function BreederPageContent({
  children,
  wide = false,
  bgColor,
  sidebar,
}: {
  children: React.ReactNode
  wide?: boolean
  bgColor?: string | null
  sidebar?: React.ReactNode
}) {
  const panelStyle = bgColor
    ? { backgroundColor: bgColor + 'CC' }
    : undefined

  return (
    <div className={`${wide ? 'max-w-6xl' : 'max-w-5xl'} mx-auto px-4 py-8 md:py-12`}>
      {sidebar ? (
        <div className="flex gap-6 items-start">
          {/* Hauptinhalt */}
          <div
            className="flex-1 min-w-0 rounded-3xl p-5 sm:p-8 md:p-10 backdrop-blur-sm"
            style={panelStyle ?? { backgroundColor: 'rgba(255,255,255,0.82)' }}
          >
            {children}
          </div>
          {/* Sidebar — nur auf Desktop sichtbar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            {sidebar}
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl p-5 sm:p-8 md:p-10 backdrop-blur-sm"
          style={panelStyle ?? { backgroundColor: 'rgba(255,255,255,0.82)' }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
