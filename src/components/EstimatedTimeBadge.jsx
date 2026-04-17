import { formatExpectedTime, getOrderEta } from "../lib/orderEta.js";

const TONE_STYLES = {
  info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  danger: "border-red-500/30 bg-red-500/10 text-red-200",
  success: "border-green-500/30 bg-green-500/10 text-green-200",
  neutral: "border-white/10 bg-white/5 text-smoke",
};

function EstimatedTimeBadge({ order, now, compact = false }) {
  const eta = getOrderEta(order, now);

  if (!eta) {
    return null;
  }

  const toneClass = TONE_STYLES[eta.tone] ?? TONE_STYLES.neutral;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}
      >
        {eta.shortLabel}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border px-3 py-2 text-sm ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">Tempo estimado</span>
        <span className="font-bold">{eta.shortLabel}</span>
      </div>
      {!eta.isFinal && eta.expectedAt ? (
        <p className="mt-1 text-xs opacity-80">
          Previsão aproximada: {formatExpectedTime(eta.expectedAt)}
        </p>
      ) : null}
      {eta.isOverdue ? (
        <p className="mt-1 text-xs opacity-80">
          Pedido acima do tempo previsto.
        </p>
      ) : null}
    </div>
  );
}

export default EstimatedTimeBadge;
