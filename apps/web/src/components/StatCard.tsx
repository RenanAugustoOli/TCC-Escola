interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red'
  trend?: 'up' | 'down'
}

const colorMap = {
  blue:   { bg: 'bg-primary-50',  text: 'text-primary-600',  border: 'border-primary-100' },
  green:  { bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-emerald-100' },
  orange: { bg: 'bg-amber-50',    text: 'text-amber-600',    border: 'border-amber-100' },
  red:    { bg: 'bg-red-50',      text: 'text-red-600',      border: 'border-red-100' },
}

export function StatCard({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text} border ${c.border}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
