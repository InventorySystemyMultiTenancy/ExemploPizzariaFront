import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import EstimatedTimeBadge from "../components/EstimatedTimeBadge.jsx";
import OrderTracker from "../components/OrderTracker.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";

const STATUS_FILTERS = [
  { id: "TODOS", label: "Todos" },
  { id: "RECEBIDO", label: "Recebido" },
  { id: "PREPARANDO", label: "Preparando" },
  { id: "NO_FORNO", label: "No Forno" },
  { id: "SAIU_PARA_ENTREGA", label: "Saiu p/ Entrega" },
  { id: "ENTREGUE", label: "Entregue" },
  { id: "CANCELADO", label: "Cancelado" },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function ClientDashboardPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("TODOS");
  const [expandedId, setExpandedId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const response = await api.get("/orders/me");
      return response.data?.data || [];
    },
  });

  const filtered =
    activeFilter === "TODOS"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-gold">
          Ola, {user?.name?.split(" ")[0] || "Cliente"}
        </h1>
        <Link
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/40"
          to="/"
        >
          Voltar
        </Link>
      </header>

      {/* Filter bar */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              activeFilter === f.id
                ? "border-gold bg-gold/15 text-gold"
                : "border-gray-200 bg-gray-50 text-smoke hover:border-gold/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="mt-6 animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-50" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-6 text-sm text-red-300">Erro ao carregar pedidos.</p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-sm text-smoke">
          {activeFilter === "TODOS"
            ? "Voce ainda nao possui pedidos."
            : `Nenhum pedido com status "${STATUS_FILTERS.find((f) => f.id === activeFilter)?.label}".`}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          return (
            <div
              key={order.id}
              className="rounded-3xl border border-gold/20 bg-lacquer/70 shadow-glow transition-all duration-300"
            >
              {/* Order header — always visible */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Pedido #{order.id.slice(-6).toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-xs text-smoke">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <EstimatedTimeBadge
                    compact
                    now={new Date(now)}
                    order={order}
                  />
                  <span className="rounded-xl bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-bold text-gold">
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                  <svg
                    className={`h-4 w-4 text-smoke transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-gray-200 px-5 pb-5 pt-4">
                  <EstimatedTimeBadge now={new Date(now)} order={order} />

                  <OrderTracker status={order.status} />

                  <div className="mt-4 space-y-2">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between rounded-xl bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {item.type === "MEIO_A_MEIO"
                              ? "Meio a Meio"
                              : (item.product?.name ?? "Pizza")}
                          </p>
                          {item.type === "MEIO_A_MEIO" && (
                            <p className="text-xs text-smoke">
                              {item.firstHalf?.name} / {item.secondHalf?.name}
                            </p>
                          )}
                          <p className="text-xs text-smoke">
                            {item.size} {item.quantity}x
                          </p>
                        </div>
                        <span className="text-sm text-gold">
                          R$ {Number(item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-sm">
                    <span className="text-smoke">Pagamento</span>
                    <span
                      className={
                        order.paymentStatus === "APROVADO"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  {order.deliveryAddress && (
                    <p className="mt-2 text-xs text-smoke">
                      Entrega: {order.deliveryAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default ClientDashboardPage;
