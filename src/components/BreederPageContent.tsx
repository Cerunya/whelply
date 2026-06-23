export default function BreederPageContent({
  children,
  wide = false,
  bgColor,
}: {
  children: React.ReactNode
  wide?: boolean
  bgColor?: string | null
}) {
  const panelStyle = bgColor
    ? { backgroundColor: bgColor + 'CC' } // CC = ~80% opacity
    : undefined

  return (
    <div className={`${wide ? 'max-w-6xl' : 'max-w-5xl'} mx-auto px-4 py-8 md:py-12`}>
      <div
        className="rounded-3xl p-5 sm:p-8 md:p-10 backdrop-blur-sm"
        style={panelStyle ?? { backgroundColor: 'rgba(255,255,255,0.82)' }}
      >
        {children}
      </div>
    </div>
  )
}
