/**
 * Tarjeta de subida para frente/atrás de cédula.
 */
export default function CedulaUploadCard({
  id,
  label,
  sideLabel,
  previewUrl,
  inputRef,
  onChange,
  done = false,
  compact = false,
}) {
  return (
    <div className={`cedula-card ${compact ? "cedula-card--compact" : ""}`}>
      <label className="cedula-card__label" htmlFor={id}>
        {label}
        <span className="cedula-card__required">*</span>
      </label>
      <button
        type="button"
        className={`cedula-card__dropzone ${done ? "cedula-card__dropzone--done" : ""}`}
        onClick={() => inputRef.current?.click()}
        aria-label={`Subir ${sideLabel} de la cédula`}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={sideLabel} className="cedula-card__preview" />
            <span className="cedula-card__overlay">
              <span className="cedula-card__change">Cambiar foto</span>
            </span>
          </>
        ) : (
          <div className="cedula-card__placeholder">
            <span className="cedula-card__icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <circle cx="8" cy="11" r="2" />
                <path d="M14 9h5M14 13h3" />
              </svg>
            </span>
            <span className="cedula-card__side">{sideLabel}</span>
            <span className="cedula-card__tap">Toca para subir</span>
          </div>
        )}
        {done && (
          <span className="cedula-card__check" aria-hidden="true">✓</span>
        )}
        <input
          type="file"
          accept="image/*"
          id={id}
          name={id}
          ref={inputRef}
          onChange={onChange}
          className="cedula-card__input"
        />
      </button>

      <style>{`
        .cedula-card {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .cedula-card__label {
          font-size: 0.72rem;
          color: #cbd5e1;
          font-weight: 600;
          margin-left: 2px;
        }
        .cedula-card__required { color: #f87171; margin-left: 2px; }
        .cedula-card__dropzone {
          position: relative;
          width: 100%;
          min-height: 108px;
          border-radius: 14px;
          border: 1.5px dashed rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.04);
          cursor: pointer;
          overflow: hidden;
          padding: 0;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .cedula-card__dropzone:hover {
          border-color: rgba(96, 165, 250, 0.55);
          background: rgba(59, 130, 246, 0.08);
        }
        .cedula-card__dropzone--done {
          border-style: solid;
          border-color: rgba(52, 211, 153, 0.45);
        }
        .cedula-card__placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 1rem 0.5rem;
          color: rgba(255,255,255,0.55);
        }
        .cedula-card__icon { opacity: 0.75; }
        .cedula-card__side {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
        }
        .cedula-card__tap { font-size: 0.65rem; opacity: 0.7; }
        .cedula-card__preview {
          width: 100%;
          height: 108px;
          object-fit: cover;
          display: block;
        }
        .cedula-card__overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 0.4rem;
          background: linear-gradient(transparent 50%, rgba(0,0,0,0.65));
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cedula-card__dropzone:hover .cedula-card__overlay { opacity: 1; }
        .cedula-card__change {
          font-size: 0.68rem;
          font-weight: 600;
          color: #fff;
          background: rgba(255,255,255,0.15);
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
        }
        .cedula-card__check {
          position: absolute;
          top: 0.45rem;
          right: 0.45rem;
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 50%;
          background: #10b981;
          color: #fff;
          font-size: 0.7rem;
          display: grid;
          place-items: center;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(16,185,129,0.4);
        }
        .cedula-card__input { display: none; }
        .cedula-card--compact .cedula-card__label { font-size: 0.65rem; }
        .cedula-card--compact .cedula-card__dropzone { min-height: 72px; border-radius: 10px; }
        .cedula-card--compact .cedula-card__preview { height: 72px; }
        .cedula-card--compact .cedula-card__placeholder { padding: 0.5rem; gap: 0.15rem; }
        .cedula-card--compact .cedula-card__icon svg { width: 20px; height: 20px; }
        .cedula-card--compact .cedula-card__side { font-size: 0.68rem; }
        .cedula-card--compact .cedula-card__tap { font-size: 0.58rem; }
      `}</style>
    </div>
  );
}
