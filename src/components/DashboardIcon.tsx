type IconName = 'overview' | 'litter' | 'dog' | 'listing' | 'profile' | 'messages' | 'settings' | 'website' | 'eye' | 'mail' | 'plus' | 'import' | 'calendar' | 'location' | 'check' | 'shield' | 'arrow' | 'news' | 'gallery' | 'palette' | 'user' | 'logout' | 'trend'

const paths: Record<IconName, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  litter: <><ellipse cx="12" cy="16" rx="4.5" ry="5"/><ellipse cx="5" cy="9" rx="2" ry="2.7"/><ellipse cx="9" cy="5" rx="2" ry="2.7"/><ellipse cx="15" cy="5" rx="2" ry="2.7"/><ellipse cx="19" cy="9" rx="2" ry="2.7"/></>,
  dog: <><path d="M4 11V6l4 3h8l4-3v5c0 5-3 9-8 9s-8-4-8-9Z"/><path d="M8 13h.01M16 13h.01M10 16h4"/></>,
  listing: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>,
  profile: <><path d="M3 21v-8l9-7 9 7v8"/><path d="M9 21v-6h6v6M3 10l9-7 9 7"/></>,
  messages: <><path d="M21 12a8 8 0 0 1-8 8H5l-3 2V12a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.55-1.03H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1.03-1.55V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9c.16.6.7 1 1.55 1.03H21v4h-.08c-.85.03-1.39.43-1.52.97Z"/></>,
  website: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  import: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 15v5h16v-5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  shield: <><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  news: <><path d="M4 4h13v16H4zM17 8h3v10a2 2 0 0 1-2 2h-1"/><path d="M8 8h5M8 12h5M8 16h5"/></>,
  gallery: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H13a2 2 0 0 1 0-4h3a5 5 0 0 0 5-5c0-3-4-6-9-6Z"/><circle cx="7.5" cy="10.5" r=".7"/><circle cx="10" cy="6.5" r=".7"/><circle cx="15" cy="7" r=".7"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
}

export default function DashboardIcon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
