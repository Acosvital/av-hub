'use client';
import {
    LineChart,
} from '@mui/x-charts/LineChart';

import { chartsGridClasses } from '@mui/x-charts/ChartsGrid';

interface AppLineChartProps {
    title?: string;
    height?: number;
    width?: number;
    xLabels: string[];
    data: number[];
    label?: string;
    color?: string;
    showArea?: boolean;
    showGrid?: boolean;
    showMark?: boolean;
    curve?:
    | 'linear'
    | 'catmullRom'
    | 'monotoneX'
    | 'monotoneY'
    | 'natural'
    | 'step'
    | 'stepBefore'
    | 'stepAfter';
    valueFormatter?: (value: number | null) => string;
}

export default function AppLineChart({
    height = 300,
    width = 600,
    xLabels,
    data,
    label = 'Valores',
    color = 'var(--av-accent)',
    showArea = false,
    showGrid = true,
    showMark = true,
    curve = 'linear',
    valueFormatter,
}: AppLineChartProps) {
    const series = [
        {
            data,
            label,
            color,
            area: showArea,
            curve,
            showMark,
            valueFormatter,
        },
    ];

    return (
        <div
            style={{
                background: 'var(--card-bg)',
                paddingRight: 'var(--space-5)',
            }}
        >
            <LineChart
                height={height}
                width={width}
                grid={{
                    horizontal: showGrid,
                    vertical: showGrid,
                }}
                xAxis={[
                    {
                        scaleType: 'point',
                        data: xLabels,
                    },
                ]}
                series={series}
                sx={{
                    /*
                    ============================================
                    AXIS
                    ============================================
                    */

                    '& .MuiChartsAxis-line': {
                        stroke: 'var(--border-strong) !important',
                    },

                    '& .MuiChartsAxis-tick': {
                        stroke: 'var(--border-strong) !important',
                    },

                    '& .MuiChartsAxis-tickLabel': {
                        fill: 'var(--foreground) !important',
                    },

                    /*
                    ============================================
                    GRID
                    ============================================
                    */

                    [`& .${chartsGridClasses.line}`]: {
                        stroke: 'var(--border)',
                        strokeDasharray: '5 5',
                    },

                    /*
                    ============================================
                    LINE
                    ============================================
                    */

                    '& .MuiLineElement-root': {
                        strokeWidth: 2.5,
                        stroke: `${color} !important`,
                        transition: 'none !important',
                    },

                    '& .MuiLineHighlightElement-root': {
                        strokeWidth: 2.5,
                        stroke: `${color} !important`,
                        fill: 'none',
                    },

                    '& .MuiLineElement-root:hover': {
                        stroke: `${color} !important`,
                    },

                    '& .MuiLineElement-root:focus': {
                        stroke: `${color} !important`,
                    },

                    /*
                    ============================================
                    AREA
                    ============================================
                    */

                    '& .MuiAreaElement-root': {
                        opacity: 0.08,
                    },

                    /*
                    ============================================
                    POINTS / MARKERS
                    ============================================
                    */

                    '& .MuiMarkElement-root': {
                        fill: 'var(--card-bg) ',
                        stroke: color,
                        strokeWidth: 2,
                    },

                    /*
                    ============================================
                    TOOLTIP
                    ============================================
                    */

                    '& .MuiChartsTooltip-root': {
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                    },

                    '& .MuiChartsLegend-label': {
                        color: 'var(--foreground)',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 'var(--w-regular)'
                    },
                }}
            />
        </div>
    );
}