export default function StatCard({ label, value, color, accent }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': accent || color }}>
      <div className="stat-label"><span className="num t-soft">{label}</span></div>
      <div className="stat-value">{value}</div>
    </div>
  )
}