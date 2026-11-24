type Props = {
  title: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
}

// Die Navigation und der Seitenkontext liegen zentral in DashboardShell.
// Der Bestand bleibt als leere Komponente kompatibel, damit keine doppelten
// Kopfleisten mehr zwischen Shell und eigentlichem Seiteninhalt entstehen.
export default function DashboardHeader(_props: Props) {
  return null
}
