import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { usePalette } from '../../theme/ThemeProvider'

function toChartData(history) {
  return (history || []).map((h, i) => ({
    date: i % 5 === 0 || i === history.length - 1 ? h.date.slice(5) : '',
    value: h.close,
  }))
}

export default function IHSGChart({ history }) {
  const data = toChartData(history)
  const p = usePalette()
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-faint font-mono">Belum ada data IHSG</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ihsgFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.up} stopOpacity={0.3} />
            <stop offset="100%" stopColor={p.up} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={p.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: p.axis, fontSize: 11, fontFamily: 'Fira Code' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          domain={['dataMin - 50', 'dataMax + 50']}
          tick={{ fill: p.axis, fontSize: 11, fontFamily: 'Fira Code' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={{
            background: p.tooltipBg,
            border: `1px solid ${p.tooltipBorder}`,
            borderRadius: 12,
            fontFamily: 'Fira Code',
            fontSize: 12,
          }}
          labelStyle={{ color: p.label }}
          itemStyle={{ color: p.up }}
          formatter={(v) => [Number(v).toLocaleString('id-ID'), 'IHSG']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={p.up}
          strokeWidth={2}
          fill="url(#ihsgFill)"
          dot={false}
          activeDot={{ r: 4, fill: p.up, stroke: p.stroke, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
