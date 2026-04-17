const STYLES = {
  High:   'bg-[#d4eced] text-[#0A5F63]',
  Medium: 'bg-amber-50 text-amber-700',
  Low:    'bg-gray-100 text-gray-500',
}

export default function MatchBadge({ level }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap ${STYLES[level] || STYLES.Low}`}>
      {level}
    </span>
  )
}
