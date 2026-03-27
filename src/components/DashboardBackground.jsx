export default function DashboardBackground({ className = '' }) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Dark base */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Subtle radial glow top-right (brand accent) */}
      <div
        className="absolute"
        style={{
          top: '-20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Subtle radial glow bottom-left */}
      <div
        className="absolute"
        style={{
          bottom: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Thin grid lines overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}
