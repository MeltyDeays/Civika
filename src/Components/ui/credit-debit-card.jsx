import React from "react";

export const FlippableCreditCard = React.forwardRef(
  ({ cardholderName, cardNumber, expiryDate, cvv, isFlipped = false, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        style={{ perspective: '1000px', width: '100%', height: '180px', margin: '0 auto 16px auto', cursor: 'pointer' }}
        className={`flippable-card-container ${isFlipped ? 'flipped' : ''}`}
        {...props}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .flippable-card-container:hover .flippable-card-inner,
          .flippable-card-container.flipped .flippable-card-inner {
            transform: rotateY(180deg) !important;
          }
        `}} />
        
        <div className="flippable-card-inner" style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
          borderRadius: '16px',
          transform: 'rotateY(0deg)'
        }}>
          
          {/* Frente de la tarjeta */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #5c0f26 0%, #1c050c 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            border: '1px solid rgba(194, 159, 104, 0.35)'
          }}>
            {/* Encabezado: Chip y Logo Textual */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <svg style={{ height: '32px', width: '42px', opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 40">
                <rect width="50" height="36" rx="8" fill="#c29f68" />
                <path d="M 0 12 L 15 12 M 0 24 L 15 24 M 35 12 L 50 12 M 35 24 L 50 24 M 15 0 L 15 36 M 35 0 L 35 36" stroke="#a17f4b" strokeWidth="2" fill="none" />
              </svg>
              <p style={{ fontWeight: '800', letterSpacing: '0.1em', fontSize: '13px', margin: 0, color: '#f8fafc', opacity: 0.9 }}>MASTERCARD</p>
            </div>
            
            {/* Número de Tarjeta */}
            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '20px', letterSpacing: '3px', textShadow: '0 1px 2px rgba(0,0,0,0.5)', marginTop: 'auto', marginBottom: '16px' }}>
              {cardNumber || "•••• •••• •••• ••••"}
            </div>

            {/* Pie de Tarjeta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6, margin: '0 0 2px 0' }}>Titular</p>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>{cardholderName || "NOMBRE APELLIDO"}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6, margin: '0 0 2px 0' }}>Expira</p>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600', margin: 0 }}>{expiryDate || "MM/AA"}</p>
              </div>
            </div>
          </div>
          
          {/* Reverso de la tarjeta */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #1c050c 0%, #0b0104 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(194, 159, 104, 0.2)'
          }}>
            {/* Banda Magnética */}
            <div style={{ marginTop: '20px', height: '36px', width: '100%', backgroundColor: '#000000', opacity: 0.8 }} />
            
            {/* CVV Section */}
            <div style={{ margin: '12px 16px 0 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', height: '30px', width: '100%', alignItems: 'center', justifyContent: 'flex-end', borderRadius: '4px', backgroundColor: '#e2e8f0', paddingRight: '12px' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', color: '#0f172a', margin: 0, fontStyle: 'italic', fontWeight: 'bold' }}>{cvv || "•••"}</p>
              </div>
            </div>
            <p style={{ alignSelf: 'flex-end', paddingRight: '16px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.5, marginTop: '4px', marginBottom: 0 }}>CVV</p>

            {/* Logo de Firma */}
            <div style={{ marginTop: 'auto', padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
              <svg style={{ height: '32px', width: '32px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z" />
                <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z" />
                <path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FlippableCreditCard.displayName = "FlippableCreditCard";
