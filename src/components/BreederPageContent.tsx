export default function BreederPageContent({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={`${wide ? 'max-w-6xl' : 'max-w-5xl'} mx-auto px-4 py-8 md:py-12`}>
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 sm:p-8 md:p-10">
        {children}
      </div>
    </div>
  )
}
