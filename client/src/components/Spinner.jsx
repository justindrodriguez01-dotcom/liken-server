export default function Spinner({ size = 'sm', className = '' }) {
  const s = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-[3px]',
  }[size] || 'w-4 h-4 border-2'

  return (
    <span
      className={`${s} ${className} rounded-full border-[#0D7377]/20 border-t-[#0D7377] animate-spin inline-block flex-shrink-0`}
      aria-hidden="true"
    />
  )
}
