import { useId } from 'react';
import { Gauge as MuiGauge, gaugeClasses, useGaugeState } from '@mui/x-charts';
interface GaugeProps {
  size?: number;
  startAngle?: number;
  endAngle?: number;
  value: number;
  color?: string;
  gradientFrom?: string;
}

const GaugeValue = ({ displayValue }: { displayValue: number }) => {
  const { cx, cy } = useGaugeState();
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan style={{ fontSize: 'var(--fs-4xl)', fontWeight: 'var(--w-black)' }}>
        {Math.round(displayValue)}
      </tspan>
      <tspan style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--w-semibold)' }} dy="-0.9em">
        %
      </tspan>
    </text>
  );
};

const Gauge = ({
  size = 300,
  startAngle = -145,
  endAngle = 145,
  value,
  color,
  gradientFrom,
}: GaugeProps) => {
  const gradientId = `gauge-gradient-${useId()}`;
  return (
    <div style={{ position: 'relative', alignSelf: 'center' }}>
      {/* Injetamos um SVG invisível apenas para carregar as definições de gradiente e sombra */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientFrom ? gradientFrom : color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="gauge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            {/* Cria o borrão da sombra */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            {/* Desloca a sombra um pouco para baixo e para o lado (dx, dy) */}
            <feOffset dx="0" dy="0" result="offsetblur" />
            {/* Define a cor e a opacidade da sombra */}
            <feFlood floodColor={color} floodOpacity="0.8" />
            <feComposite in2="offsetblur" operator="in" />
            {/* Combina a sombra com o arco original */}
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <MuiGauge
        width={size}
        height={size}
        value={Math.min(value, 100)}
        text={() => null}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius="80%"
        cornerRadius="50%"
        sx={{
          '& text': {
            fill: 'var(--foreground) !important',
            fontFamily: 'var(--font-sans) !important',
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: `url(#${gradientId})`,
            filter: 'url(#gauge-shadow)',
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: 'color-mix(in srgb, var(--foreground) 12%, transparent)',
          },
        }}
      >
        <GaugeValue displayValue={value} />
      </MuiGauge>
    </div>
  );
};

export default Gauge;
