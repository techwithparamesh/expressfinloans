import { motion } from "framer-motion";

const ITEMS = [
  { id: 1, title: "New lead assigned", desc: "Lead #2847 from Web", time: "2m ago" },
  { id: 2, title: "Ticket completed", desc: "Support ticket #892 resolved", time: "15m ago" },
  { id: 3, title: "Payment received", desc: "₹12,500 from Customer A", time: "1h ago" },
  { id: 4, title: "Profile updated", desc: "Parameswar updated contact", time: "2h ago" },
  { id: 5, title: "New signup", desc: "Trial started – Acme Corp", time: "3h ago" },
];

export function Timeline({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-xl bg-[#1E293B] p-5 border border-slate-700/50 overflow-hidden"
    >
      <h3 className="text-sm font-semibold text-slate-200 mb-4">
        Activity
      </h3>
      <ul className="space-y-0">
        {ITEMS.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: delay / 1000 + i * 0.06,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="group flex gap-3 py-3 border-b border-slate-700/50 last:border-0 last:pb-0 first:pt-0"
          >
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <span className="text-xs text-slate-500 shrink-0">{item.time}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
