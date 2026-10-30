import React from 'react';

interface PercentBarWidgetProps {
  label: string;
  value?: number | null; // 0 to 150
}

export const PercentBarWidget: React.FC<PercentBarWidgetProps> = ({ label, value }) => {
  const clampedValue = Math.max(0, value ?? 0);
  const exceeded = clampedValue >= 100.0;
  const fillRatio = Math.min(clampedValue / 150.0, 1.0);
  const fillColor = exceeded ? '#CC2222' : '#90AF13';
  const markerLeftPercent = (100.0 / 150.0) * 100; // 66.67%

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      marginBottom: '6px'
    }}>
      {/* Label above */}
      {label && (
        <span style={{
          fontSize: '11px',
          color: 'var(--text-main)',
          lineHeight: '1.25',
          userSelect: 'none'
        }}>
          {label}
        </span>
      )}

      {/* Bar Row: [ Track with 100% marker ] [ XX% ] */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Track Container */}
        <div style={{
          flex: 1,
          height: '6px',
          background: '#D8D8D8',
          borderRadius: '3px',
          position: 'relative',
          overflow: 'visible'
        }}>
          {/* Filled Pill */}
          <div
            style={{
              width: `${fillRatio * 100}%`,
              height: '100%',
              background: fillColor,
              borderRadius: '3px',
              transition: 'width 0.25s ease-out, background-color 0.25s ease'
            }}
          />

          {/* 100% Limit Marker Line */}
          <div
            style={{
              position: 'absolute',
              left: `${markerLeftPercent}%`,
              top: '-2px',
              bottom: '-2px',
              width: '2px',
              background: '#222222',
              zIndex: 2,
              pointerEvents: 'none'
            }}
            title="100% Limit"
          />
        </div>

        {/* Value Label (fixed 46px width) */}
        <span style={{
          width: '46px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          color: 'var(--text-main)',
          userSelect: 'none',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {Math.round(clampedValue)}%
        </span>
      </div>
    </div>
  );
};
