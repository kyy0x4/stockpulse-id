import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ihsgHistory } from '../../data/stocks'

export default function IHSGChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={ihsgHistory} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ihsgFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          domain={['dataMin - 50', 'dataMax + 50']}
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Fira Code' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={{
            background: '#0b1526',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            fontFamily: 'Fira Code',
            fontSize: 12,
          }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#22c55e' }}
          formatter={(v) => [v.toLocaleString('id-ID'), 'IHSG']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#ihsgFill)"
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e', stroke: '#020617', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
