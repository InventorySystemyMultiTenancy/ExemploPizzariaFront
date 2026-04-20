import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const MONTH_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const MONTH_LABEL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const STATUS_LABEL = {
  RECEBIDO: "Recebido",
  PREPARANDO: "Preparando",
  NO_FORNO: "No Forno",
  SAIU_PARA_ENTREGA: "Saiu para Entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  PAGO: "Pagos (aprovados)",
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatShortDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

const formatChartLabel = (date) => {
  if (date.length === 7) {
    return MONTH_SHORT[parseInt(date.slice(5, 7), 10) - 1];
  }
  return formatShortDate(date);
};

function MetricCard({ label, value, hint }) {
  return (
    <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
      <p className="text-xs uppercase tracking-[0.24em] text-smoke">{label}</p>
      <p className="mt-3 font-display text-3xl text-gold">{value}</p>
      <p className="mt-2 text-xs text-smoke">{hint}</p>
    </article>
  );
}

function SalesAnalyticsPage() {
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12 or 0 = whole year

  const { from, to } = useMemo(() => {
    if (filterMonth === 0) {
      return { from: `${filterYear}-01-01`, to: `${filterYear}-12-31` };
    }
    const lastDay = new Date(filterYear, filterMonth, 0).getDate();
    const mm = String(filterMonth).padStart(2, "0");
    return {
      from: `${filterYear}-${mm}-01`,
      to: `${filterYear}-${mm}-${lastDay}`,
    };
  }, [filterYear, filterMonth]);

  const yearOptions = useMemo(() => {
    const base = now.getFullYear();
    return [base - 2, base - 1, base];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-sales-analytics", from, to],
    queryFn: async () => {
      const response = await api.get("/admin/analytics", {
        params: { from, to },
      });
      return response.data?.data;
    },
    refetchInterval: 120_000,
  });

  const summary = data?.summary;
  const dailySales = data?.dailySales ?? [];
  const topProducts = data?.topProducts ?? [];
  const rawStatusCounts = data?.statusCounts ?? {};
  const statusCounts = summary
    ? { ...rawStatusCounts, PAGO: summary.paidOrdersCount }
    : rawStatusCounts;
  const maxRevenue = Math.max(...dailySales.map((item) => item.revenue), 1);
  const maxOrders = Math.max(...Object.values(statusCounts), 1);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 text-gray-900 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-gold">Análise de Vendas</h1>
          <p className="mt-1 text-sm text-smoke">
            Receita, volume de pedidos e sabores mais vendidos em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition hover:border-gold/40 focus:outline-none"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {/* Month selector */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition hover:border-gold/40 focus:outline-none"
          >
            <option value={0}>Ano todo</option>
            {MONTH_LABEL.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <Link
            to="/admin"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/40"
          >
            Painel
          </Link>
          <Link
            to="/admin/produtos"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/40"
          >
            Produtos
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl bg-gray-50"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <p className="mt-6 text-sm text-red-300">
          Falha ao carregar a análise de vendas.
        </p>
      ) : null}

      {summary ? (
        <>
          {/* Receita / Custo / Lucro — linha 1 */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Receita Total"
              value={formatCurrency(summary.totalRevenue)}
              hint="Pedidos com pagamento aprovado"
            />
            <MetricCard
              label="Custo Total"
              value={formatCurrency(summary.totalCost ?? 0)}
              hint="Soma do preço de custo dos itens"
            />
            <MetricCard
              label="Lucro Líquido"
              value={formatCurrency(summary.totalProfit ?? 0)}
              hint="Receita − Custo"
            />
          </section>

          {/* Hoje / Mês / Ticket médio — linha 2 */}
          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <p className="text-xs uppercase tracking-[0.24em] text-smoke">
                Hoje
              </p>
              <p className="mt-2 font-display text-2xl text-gold">
                {formatCurrency(summary.revenueToday)}
              </p>
              <div className="mt-1 flex justify-between text-xs text-smoke">
                <span>Custo: {formatCurrency(summary.costToday ?? 0)}</span>
                <span>Lucro: {formatCurrency(summary.profitToday ?? 0)}</span>
              </div>
            </article>
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <p className="text-xs uppercase tracking-[0.24em] text-smoke">
                Mês
              </p>
              <p className="mt-2 font-display text-2xl text-gold">
                {formatCurrency(summary.revenueThisMonth)}
              </p>
              <div className="mt-1 flex justify-between text-xs text-smoke">
                <span>Custo: {formatCurrency(summary.costThisMonth ?? 0)}</span>
                <span>
                  Lucro: {formatCurrency(summary.profitThisMonth ?? 0)}
                </span>
              </div>
            </article>
            <MetricCard
              label="Ticket Médio"
              value={formatCurrency(summary.averageTicket)}
              hint={`${summary.paidOrdersCount} pagos de ${summary.ordersCount} totais`}
            />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-gold">
                  {filterMonth === 0
                    ? `Por mês — ${filterYear}`
                    : `${MONTH_LABEL[filterMonth - 1]} ${filterYear}`}
                </h2>
                <div className="flex items-center gap-3 text-xs text-smoke">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    Receita
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                    Custo
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                    Lucro
                  </span>
                </div>
              </div>
              <div className="mt-6 flex h-64 items-end gap-2">
                {dailySales.map((item) => {
                  const revenueH = `${Math.max((item.revenue / maxRevenue) * 100, 4)}%`;
                  const costH = `${Math.max(((item.cost ?? 0) / maxRevenue) * 100, 0)}%`;
                  const profitH = `${Math.max(((item.profit ?? 0) / maxRevenue) * 100, 0)}%`;
                  return (
                    <div
                      key={item.date}
                      className="flex flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div className="text-xs text-gold">
                        {formatCurrency(item.revenue)}
                      </div>
                      <div className="flex h-full w-full items-end justify-center gap-0.5 rounded-2xl bg-black/25 p-1">
                        <div className="flex h-full flex-1 items-end">
                          <div
                            className="w-full rounded-t bg-amber-400/80 transition-all"
                            style={{ height: revenueH }}
                          />
                        </div>
                        <div className="flex h-full flex-1 items-end">
                          <div
                            className="w-full rounded-t bg-red-400/70 transition-all"
                            style={{ height: costH }}
                          />
                        </div>
                        <div className="flex h-full flex-1 items-end">
                          <div
                            className="w-full rounded-t bg-green-400/80 transition-all"
                            style={{ height: profitH }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-smoke">
                        {formatChartLabel(item.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <h2 className="font-display text-xl text-gold">
                Status dos Pedidos
              </h2>
              <div className="mt-5 space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-900">
                        {STATUS_LABEL[status] ?? status}
                      </span>
                      <span className="text-smoke">{count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-gold to-amber-300"
                        style={{ width: `${(count / maxOrders) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-gold">Top Sabores</h2>
              <span className="text-xs text-smoke">
                Baseado em pedidos pagos
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-black/25 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {product.name}
                    </span>
                  </div>
                  <span className="text-sm text-smoke">
                    {product.quantity} vendas
                  </span>
                </div>
              ))}
              {topProducts.length === 0 ? (
                <p className="text-sm text-smoke">
                  Ainda não há pedidos pagos para análise.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default SalesAnalyticsPage;
