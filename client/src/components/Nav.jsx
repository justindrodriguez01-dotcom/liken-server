const TABS = [
  { id: 'find',    label: 'Find' },
  { id: 'tracker', label: 'Outreach Tracker' },
  { id: 'settings', label: 'Settings' },
]

export default function Nav({ tab, onTab, email }) {
  return (
    <header className="bg-white border-b border-[#E8E6E3] sticky top-0 z-20">
      <div className="flex items-stretch h-[54px] px-6 max-w-6xl mx-auto">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 mr-10 no-underline flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="20" fill="#F5F4F1"/>
            <path d="M72.63 72.63A32 32 0 1 1 72.63 27.37" stroke="#0D7377" strokeWidth="11" strokeLinecap="round" fill="none"/>
          </svg>
          <span className="text-[14px] font-bold tracking-tight text-gray-900">ColdMatch</span>
        </a>

        {/* Center tabs */}
        <nav className="flex items-stretch -mb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`px-4 text-[13px] font-medium border-b-2 transition-all duration-150 outline-none cursor-pointer bg-transparent ${
                tab === t.id
                  ? 'text-[#0D7377] border-[#0D7377]'
                  : 'text-gray-500 border-transparent hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          {email && <span className="text-xs text-gray-400 hidden sm:block">{email}</span>}
          <button
            onClick={() => { localStorage.removeItem('cm_token'); window.location.href = '/' }}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors duration-150 cursor-pointer bg-transparent border-0 outline-none"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
