import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { DataPoint } from "../../types/coingecko";
import { formatPrice, formatDate } from "../../lib/formatters";

const CHART_HEIGHT = 160;
const LINE_COLOR = "#22c55e";
const STROKE_WIDTH = 1.5;
const TICK_COUNT = 7;
const Y_AXIS_WIDTH = 72;

const dayTickFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

interface PriceChartProps {
  prices: DataPoint[];
}

export function PriceChart({ prices }: PriceChartProps) {
  if (prices.length === 0) return null;

  const data = prices.map(([time, price]) => ({ time, price }));

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickCount={TICK_COUNT}
          tickFormatter={(ts: number) => dayTickFormatter.format(new Date(ts))}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatPrice(v)}
          tick={{ fontSize: 10, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={Y_AXIS_WIDTH}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const raw = payload[0]?.value;
            const price = typeof raw === "number" ? raw : null;
            const ts = typeof label === "number" ? label : Number(label);
            return (
              <div className="rounded bg-white px-3 py-2 text-sm shadow ring-1 ring-gray-200">
                <p className="font-medium text-gray-900">{formatPrice(price)}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(new Date(ts).toISOString())}
                </p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke={LINE_COLOR}
          strokeWidth={STROKE_WIDTH}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
