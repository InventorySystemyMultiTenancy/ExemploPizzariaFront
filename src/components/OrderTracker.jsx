const statusSteps = [
  { key: "RECEBIDO", label: "Recebido" },
  { key: "PREPARANDO", label: "Preparando" },
  { key: "NO_FORNO", label: "No Forno" },
  { key: "SAIU_PARA_ENTREGA", label: "Saiu para Entrega" },
  { key: "ENTREGUE", label: "Entregue" },
];

function OrderTracker({ status = "RECEBIDO" }) {
  const activeIndex = statusSteps.findIndex((step) => step.key === status);

  return (
    <section className="rounded-3xl border border-gold/20 bg-lacquer/70 p-4 sm:p-6">
      <h3 className="font-display text-xl text-gold">Timeline do Pedido</h3>

      <ol className="mt-6 space-y-4">
        {statusSteps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li
              key={step.key}
              className="relative pl-10 transition-all duration-300"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span
                className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                  active
                    ? "animate-pulse border-gold bg-gold text-black shadow-[0_0_12px_rgba(212,169,77,0.6)]"
                    : done
                      ? "border-gold bg-gold text-black"
                      : "border-white/25 bg-black/20 text-smoke"
                }`}
              >
                {done ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <p
                className={`font-semibold transition-colors duration-300 ${
                  active ? "text-gold" : done ? "text-white" : "text-smoke"
                }`}
              >
                {step.label}
              </p>
              {index < statusSteps.length - 1 ? (
                <span
                  className={`absolute left-[13px] top-7 h-6 w-px transition-colors duration-500 ${
                    done ? "bg-gold/50" : "bg-white/15"
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default OrderTracker;
