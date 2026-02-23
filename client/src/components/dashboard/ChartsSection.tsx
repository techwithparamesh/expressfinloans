import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  open: "#6366f1",
  disbursed: "#22c55e",
  rejected: "#ef4444",
  sanctioned: "#8b5cf6",
  closed_won: "#0ea5e9",
};
function getStatusColor(s: string): string {
  return STATUS_COLORS[s.toLowerCase()] ?? "#94a3b8";
}

type BarDataPoint = { date: string; count: number };

export function BarChartCard({
  delay = 0,
  data = [],
  title = "Leads trend (last 14 days)",
}: {
  delay?: number;
  data?: BarDataPoint[];
  title?: string;
}) {
  const chartData =
    data.length > 0 ? data.map((d) => ({ day: d.date.slice(5), value: d.count })) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl bg-white p-5 shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
      <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="h-[220px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [value, "Leads"]}
              />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
                animationBegin={300}
                animationDuration={800}
                animationEasing="ease-out"
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No leads in the last 14 days
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function RadialProgressCard({
  delay = 0,
  value = 0,
  title = "Completion rate",
}: {
  delay?: number;
  value?: number;
  title?: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, value) / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl bg-[#1E293B] p-5 border border-slate-700/50 overflow-hidden"
    >
      <h3 className="text-sm font-semibold text-slate-200 mb-4">{title}</h3>
      <div className="relative flex justify-center items-center h-[140px]">
        <svg className="w-[120px] h-[120px] -rotate-90 absolute" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="10"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#radialGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, delay: 0.3 + delay / 1000, ease: [0.4, 0, 0.2, 1] }}
            style={{ strokeDasharray: circumference }}
          />
          <defs>
            <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <span className="relative z-10 text-2xl font-bold text-white">
          {Math.round(Math.min(100, value))}%
        </span>
      </div>
    </motion.div>
  );
}

export function DonutChartCard({
  delay = 0,
  data = [],
  title = "Leads by status (last 30 days)",
}: {
  delay?: number;
  data?: { status: string; count: number }[];
  title?: string;
}) {
  const donutData =
    data.length > 0
      ? data.map((d) => ({
          name: d.status,
          value: d.count,
          color: getStatusColor(d.status),
        }))
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl bg-white p-5 shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
      <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="h-[200px]">
        {donutData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationBegin={400}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [value, "Leads"]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No leads by status
          </div>
        )}
      </div>
      {donutData.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
          {donutData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-xs text-slate-600">{d.name}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
