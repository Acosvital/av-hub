import { Gauge as MuiGauge, gaugeClasses } from "@mui/x-charts"
interface GaugeProps {
  size?: number;
  startAngle?: number;
  endAngle?: number;
  value: number;
  color?: string;
}

const Gauge = ({
  size = 300,
  startAngle = -120,
  endAngle = 120,
  value,
  color
}: GaugeProps) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* Injetamos um SVG invisível apenas para carregar a definição do filtro de sombra */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
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
        value={value}
        text={({ value }) => `${value}%`}
        startAngle={value <= 100 ? startAngle: -180}
        endAngle={value <= 100 ? endAngle : 180}
        cornerRadius="50%"
        sx={{
          '& text': {
            fill: 'var(--foreground) !important',
            fontSize: 'var(--fs-4xl) !important',
            fontFamily: 'var(--font-sans) !important',
            fontWeight: 'var(--w-semibold) !important',
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: color,
            filter: 'url(#gauge-shadow)',
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: '#111827',
          },
        }}
      />
    </div>
  )
};

export default Gauge;