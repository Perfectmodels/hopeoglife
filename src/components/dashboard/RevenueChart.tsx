type RevenuePoint = {
  label: string;
  value: number;
};

function compactXAF(value: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)} F`;
}

export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const width = 820;
  const height = 250;
  const padding = { top: 20, right: 18, bottom: 34, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const roundedMax = Math.ceil(maxValue / 10000) * 10000 || 10000;

  const coordinates = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1 ? chartWidth / 2 : (index / Math.max(1, points.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - (point.value / roundedMax) * chartHeight;
    return { ...point, x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = coordinates.length
    ? `${linePath} L ${coordinates.at(-1)!.x.toFixed(2)} ${(padding.top + chartHeight).toFixed(
        2
      )} L ${coordinates[0].x.toFixed(2)} ${(padding.top + chartHeight).toFixed(2)} Z`
    : "";

  return (
    <div className="overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Évolution du chiffre d'affaires par tranche horaire"
        className="h-auto w-full"
      >
        <title>Évolution du chiffre d&apos;affaires du service</title>
        <defs>
          <linearGradient id="revenue-area-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8A15A" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#C8A15A" stopOpacity="0.01" />
          </linearGradient>
          <filter id="revenue-point-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - chartHeight * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#2B2925"
                strokeDasharray="3 6"
              />
              <text
                x={padding.left - 12}
                y={y + 4}
                fill="#7F7B74"
                fontSize="11"
                textAnchor="end"
              >
                {compactXAF(roundedMax * ratio)}
              </text>
            </g>
          );
        })}

        {areaPath ? <path d={areaPath} fill="url(#revenue-area-gold)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#D9B45F"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {coordinates.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4.5"
              fill="#101012"
              stroke="#E2C27B"
              strokeWidth="2.5"
              filter={point.value === maxValue && maxValue > 0 ? "url(#revenue-point-glow)" : undefined}
            >
              <title>
                {point.label} : {compactXAF(point.value)}
              </title>
            </circle>
            <text
              x={point.x}
              y={height - 10}
              fill="#9E9A92"
              fontSize="11"
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
