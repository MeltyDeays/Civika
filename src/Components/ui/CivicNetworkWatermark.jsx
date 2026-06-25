const MAROON = "#7A1835";

export default function CivicNetworkWatermark() {
  return (
    <div className="civic-network-wrap" aria-hidden="true">
      <svg className="civic-network-svg civic-network-svg--left" viewBox="0 0 420 420" fill="none">
        <g stroke={MAROON} strokeWidth="1.1" opacity="0.14">
          <ellipse cx="210" cy="210" rx="175" ry="175" />
          <ellipse cx="210" cy="210" rx="175" ry="60" />
          <ellipse cx="210" cy="210" rx="175" ry="110" />
          <ellipse cx="210" cy="210" rx="60" ry="175" />
          <ellipse cx="210" cy="210" rx="110" ry="175" />
          <ellipse cx="210" cy="210" rx="145" ry="175" transform="rotate(45 210 210)" />
          <ellipse cx="210" cy="210" rx="145" ry="175" transform="rotate(-45 210 210)" />
          <path d="M35 210 H385 M210 35 V385" />
        </g>
        <g fill={MAROON} opacity="0.22">
          {[
            [210, 35, 5], [210, 385, 4], [35, 210, 4], [385, 210, 5],
            [95, 95, 3], [325, 95, 4], [95, 325, 3], [325, 325, 5],
            [210, 120, 3], [210, 300, 4], [120, 210, 3], [300, 210, 4],
            [155, 155, 2.5], [265, 155, 3], [155, 265, 2.5], [265, 265, 3],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>
      <svg className="civic-network-svg civic-network-svg--right" viewBox="0 0 420 420" fill="none">
        <g stroke={MAROON} strokeWidth="0.9" opacity="0.08">
          <ellipse cx="210" cy="210" rx="160" ry="160" />
          <ellipse cx="210" cy="210" rx="160" ry="55" />
          <ellipse cx="210" cy="210" rx="55" ry="160" />
          <ellipse cx="210" cy="210" rx="130" ry="160" transform="rotate(30 210 210)" />
          <ellipse cx="210" cy="210" rx="130" ry="160" transform="rotate(-30 210 210)" />
        </g>
        <g fill={MAROON} opacity="0.12">
          {[
            [210, 50, 4], [210, 370, 3], [50, 210, 3], [370, 210, 4],
            [130, 130, 2.5], [290, 130, 3], [130, 290, 2.5], [290, 290, 3],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>
      <style>{`
        .civic-network-wrap {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .civic-network-svg {
          position: absolute;
          width: min(52vw, 520px);
          height: auto;
        }
        .civic-network-svg--left {
          top: -8%;
          left: -10%;
          animation: civic-network-drift 28s ease-in-out infinite;
        }
        .civic-network-svg--right {
          bottom: -12%;
          right: -8%;
          width: min(44vw, 440px);
          animation: civic-network-drift 32s ease-in-out infinite reverse;
        }
        @keyframes civic-network-drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(12px, -16px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
