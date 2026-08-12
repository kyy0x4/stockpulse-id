import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { usePalette } from '../../theme/ThemeProvider'

export default function PriceTrendChart({ data }) {
  const p = usePalette()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={p.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: p.axis, fontSize: 10, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={{ fill: p.axis, fontSize: 10, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 12, fontFamily: 'Fira Code', fontSize: 11 }}
          labelStyle={{ color: p.label }}
          itemStyle={{ color: p.info }}
        />
        <Line type="monotone" dataKey="close" stroke={p.info} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: p.info, stroke: p.stroke, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
