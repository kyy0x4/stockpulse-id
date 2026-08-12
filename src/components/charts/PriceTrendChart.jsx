import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function PriceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(148,163,184,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={{ background: '#0b1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontFamily: 'Fira Code', fontSize: 11 }}
          labelStyle={{ color: '#94a3b8' }}
          itemStyle={{ color: '#38bdf8' }}
        />
        <Line type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#38bdf8', stroke: '#020617', strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
