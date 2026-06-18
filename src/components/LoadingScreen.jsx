import React from 'react'

export function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#2E2A2B',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <style>{`
        @keyframes nd-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes nd-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Isotipo NovaDomus — anillo girando + punto latiendo */}
      <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 28 }}>
        {/* Anillo exterior girando */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid rgba(167,198,237,0.15)',
          borderTopColor: 'var(--nd-light, #A7C6ED)',
          borderRadius: '50%',
          animation: 'nd-spin 1s linear infinite'
        }} />
        {/* Círculo interior fijo */}
        <div style={{
          position: 'absolute', inset: 10,
          border: '1.5px solid rgba(167,198,237,0.08)',
          borderRadius: '50%'
        }} />
        {/* Punto central latiendo */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 10, height: 10,
          background: 'var(--nd-light, #A7C6ED)',
          borderRadius: '50%',
          animation: 'nd-pulse 1.4s ease-in-out infinite'
        }} />
      </div>

      {/* Logotipo */}
      <div style={{
        fontFamily: "'Jost', system-ui, sans-serif",
        fontSize: 18, fontWeight: 700,
        letterSpacing: '0.14em', marginBottom: 6
      }}>
        <span style={{ color: '#fff' }}>ND</span>
        <span style={{ color: '#A7C6ED' }}>TRACKER</span>
        <span style={{ color: '#A7C6ED', marginLeft: 3 }}>5S</span>
      </div>

      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        fontFamily: "'DM Sans', system-ui, sans-serif"
      }}>
        NovaDomus · Obra
      </div>
    </div>
  )
}
