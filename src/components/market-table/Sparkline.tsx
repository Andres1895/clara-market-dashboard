import { LineChart, Line } from "recharts";

const WIDTH = 80;
const HEIGHT = 32;
const STROKE_WIDTH = 1.5;
const COLOR_POSITIVE = "#22c55e";
const COLOR_NEGATIVE = "#ef4444";

interface SparklineProps {
  prices: number[];
  positive: boolean;
}

export function Sparkline({ prices, positive }: SparklineProps) {
  const data = prices.map((price) => ({ price }));
  const color = positive ? COLOR_POSITIVE : COLOR_NEGATIVE;

  return (
    <LineChart width={WIDTH} height={HEIGHT} data={data}>
      <Line
        type="monotone"
        dataKey="price"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
