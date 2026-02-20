/**
 * Express Financial Services logo – text-only professional mark.
 * "EXPRESS" in blue (#003399), "FINANCIAL SERVICES" in red (#ED1C24).
 * Properly spaced for visual balance.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Express Financial Services"
    >
      {/* EXPRESS – dark blue, larger as primary brand name */}
      <text
        x="0"
        y="20"
        fill="#003399"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="24"
        fontWeight="800"
        letterSpacing="0.05em"
      >
        EXPRESS
      </text>

      {/* FINANCIAL SERVICES – red, slightly smaller as tagline */}
      <text
        x="0"
        y="40"
        fill="#ED1C24"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="0.08em"
      >
        FINANCIAL SERVICES
      </text>
    </svg>
  );
}
