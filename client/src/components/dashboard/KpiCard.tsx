import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type KpiCardProps = {
  title: string;
  value: number;
  delay?: number;
  variant?: "default" | "radial" | "trend";
  radialPercent?: number;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
  light?: boolean;
  glassShine?: boolean;
};

function useCountUp(end: number, duration = 1200, delay = 0, run = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setCount(Math.round(eased * end));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, delay, run]);
  return count;
}

export function KpiCard({
  title,
  value,
  delay = 0,
  variant = "default",
  radialPercent = 0,
  trendUp = true,
  icon,
  className = "",
  light = true,
  glassShine = false,
}: KpiCardProps) {
  const count = useCountUp(value, 1000, delay + 200, true);
  const [radialAnimated, setRadialAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setRadialAnimated(radialPercent), 400 + delay);
    return () => clearTimeout(t);
  }, [radialPercent, delay]);

  const isLight = light;
  const bg = isLight ? "bg-white" : "bg-[#1E293B]";
  const text = isLight ? "text-slate-800" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 overflow-hidden ${bg} ${className}`}
    >
      {glassShine && (
        <div
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dashboard-glass-shine"
            style={{ width: "50%" }}
          />
        </div>
      )}
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-medium ${muted}`}>{title}</p>
            {variant === "radial" ? (
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${text}`}>
                  {radialAnimated}%
                </span>
                <span className={`text-sm ${muted}`}>Completed</span>
              </div>
            ) : (
              <p className={`mt-1 text-2xl font-bold ${text}`}>{count}</p>
            )}
            {variant === "trend" && (
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={`text-sm font-medium ${trendUp ? "text-emerald-500" : "text-red-500"}`}
                >
                  {trendUp ? "↑" : "↓"}
                </span>
                <span className={`text-xs ${muted}`}>vs last period</span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={`rounded-lg p-2 ${isLight ? "bg-indigo-50 text-indigo-600" : "bg-indigo-500/20 text-indigo-300"}`}
            >
              {icon}
            </div>
          )}
        </div>
        {variant === "radial" && (
          <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${radialAnimated}%` }}
              transition={{
                duration: 1,
                delay: 0.3 + delay / 1000,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
