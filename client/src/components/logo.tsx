/**
 * Express Financial Services logo – matches provided design:
 * White background, "EXPRESS" in blue (#003399), "FINANCIAL SERVICES" in red (#ED1C24),
 * light gray vertical bar with pink/magenta swoosh on the left.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Express Financial Services"
    >
      {/* Light gray vertical rectangle (left graphic) */}
      <rect x="0" y="8" width="12" height="40" rx="1" fill="#E5E7EB" />

      {/* Pink/magenta swoosh overlapping top-left of the bar */}
      <path
        d="M 2 10 Q 14 8 16 18 Q 18 26 10 32 L 4 28 Q 8 22 6 14 Z"
        fill="#E879F9"
      />

      {/* EXPRESS – dark blue #003399 */}
      <text
        x="28"
        y="28"
        fill="#003399"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="0.02em"
      >
        EXPRESS
      </text>

      {/* FINANCIAL SERVICES – red #ED1C24 */}
      <text
        x="28"
        y="46"
        fill="#ED1C24"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="0.02em"
      >
        FINANCIAL SERVICES
      </text>
    </svg>
  );
}
