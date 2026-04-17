import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const STATUS_LABEL = {
  RECEBIDO: "Recebido",
  PREPARANDO: "Preparando",
  NO_FORNO: "No Forno",
  SAIU_PARA_ENTREGA: "Saiu para Entrega",
  ENTREGUE: "Entregue",
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-sales-analytics"],
    queryFn: async () => {
      const response = await api.get("/admin/analytics");
      return response.data?.data;
    },
    refetchInterval: 120_000,
  });

  const summary = data?.summary;
  const dailySales = data?.dailySales ?? [];
  const topProducts = data?.topProducts ?? [];
  const statusCounts = data?.statusCounts ?? {};
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
        <div className="flex gap-3">
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
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Receita Total"
              value={formatCurrency(summary.totalRevenue)}
              hint="Considera pedidos com pagamento aprovado"
            />
            <MetricCard
              label="Hoje"
              value={formatCurrency(summary.revenueToday)}
              hint="Receita confirmada no dia atual"
            />
            <MetricCard
              label="Mês"
              value={formatCurrency(summary.revenueThisMonth)}
              hint="Receita confirmada no mês atual"
            />
            <MetricCard
              label="Ticket Médio"
              value={formatCurrency(summary.averageTicket)}
              hint={`${summary.paidOrdersCount} pedidos pagos de ${summary.ordersCount} totais`}
            />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-gold">
                  Últimos 7 dias
                </h2>
                <span className="text-xs text-smoke">
                  Receita aprovada por dia
                </span>
              </div>
              <div className="mt-6 flex h-64 items-end gap-3">
                {dailySales.map((item) => {
                  const height = `${Math.max((item.revenue / maxRevenue) * 100, 8)}%`;
                  return (
                    <div
                      key={item.date}
                      className="flex flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="text-xs text-gold">
                        {formatCurrency(item.revenue)}
                      </div>
                      <div className="flex h-full w-full items-end rounded-2xl bg-black/25 p-1">
                        <div
                          className="w-full rounded-xl bg-gradient-to-t from-ember to-gold transition-all duration-500"
                          style={{ height }}
                        />
                      </div>
                      <div className="text-xs text-smoke">
                        {formatShortDate(item.date)}
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
