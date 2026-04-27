import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useTranslation } from "../context/I18nContext.jsx";

const formatCurrency = (value, locale) =>
  Number(value || 0).toLocaleString(locale || "pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatShortDate = (date, locale) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(locale || "pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

const formatChartLabel = (date, monthShort, locale) => {
  if (date.length === 7) {
    return monthShort[parseInt(date.slice(5, 7), 10) - 1];
  }
  return formatShortDate(date, locale);
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
  const { t, locale } = useTranslation();
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1); // 1-12 or 0 = whole year

  const monthShort = useMemo(
    () => [
      t("MONTH_SHORT_JAN", "Jan"),
      t("MONTH_SHORT_FEB", "Fev"),
      t("MONTH_SHORT_MAR", "Mar"),
      t("MONTH_SHORT_APR", "Abr"),
      t("MONTH_SHORT_MAY", "Mai"),
      t("MONTH_SHORT_JUN", "Jun"),
      t("MONTH_SHORT_JUL", "Jul"),
      t("MONTH_SHORT_AUG", "Ago"),
      t("MONTH_SHORT_SEP", "Set"),
      t("MONTH_SHORT_OCT", "Out"),
      t("MONTH_SHORT_NOV", "Nov"),
      t("MONTH_SHORT_DEC", "Dez"),
    ],
    [t],
  );

  const monthLabel = useMemo(
    () => [
      t("MONTH_LABEL_JAN", "Janeiro"),
      t("MONTH_LABEL_FEB", "Fevereiro"),
      t("MONTH_LABEL_MAR", "Março"),
      t("MONTH_LABEL_APR", "Abril"),
      t("MONTH_LABEL_MAY", "Maio"),
      t("MONTH_LABEL_JUN", "Junho"),
      t("MONTH_LABEL_JUL", "Julho"),
      t("MONTH_LABEL_AUG", "Agosto"),
      t("MONTH_LABEL_SEP", "Setembro"),
      t("MONTH_LABEL_OCT", "Outubro"),
      t("MONTH_LABEL_NOV", "Novembro"),
      t("MONTH_LABEL_DEC", "Dezembro"),
    ],
    [t],
  );

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
          <h1 className="font-display text-3xl text-gold">
            {t("SALES_ANALYTICS_TITLE", "Análise de Vendas")}
          </h1>
          <p className="mt-1 text-sm text-smoke">
            {t(
              "SALES_ANALYTICS_SUBTITLE",
              "Receita, volume de pedidos e sabores mais vendidos em tempo real.",
            )}
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
            <option value={0}>
              {t("SALES_ANALYTICS_FULL_YEAR", "Ano todo")}
            </option>
            {monthLabel.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <Link
            to="/admin"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/40"
          >
            {t("SALES_ANALYTICS_BACK_PANEL", "Painel")}
          </Link>
          <Link
            to="/admin/produtos"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/40"
          >
            {t("SALES_ANALYTICS_GO_PRODUCTS", "Produtos")}
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
          {t(
            "SALES_ANALYTICS_LOAD_ERROR",
            "Falha ao carregar a análise de vendas.",
          )}
        </p>
      ) : null}

      {summary ? (
        <>
          {/* Receita / Custo / Lucro — linha 1 */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricCard
              label={t("SALES_ANALYTICS_REVENUE_TOTAL", "Receita Total")}
              value={formatCurrency(summary.totalRevenue, locale)}
              hint={t(
                "SALES_ANALYTICS_REVENUE_HINT",
                "Pedidos com pagamento aprovado",
              )}
            />
            <MetricCard
              label={t("SALES_ANALYTICS_COST_TOTAL", "Custo Total")}
              value={formatCurrency(summary.totalCost ?? 0, locale)}
              hint={t(
                "SALES_ANALYTICS_COST_HINT",
                "Soma do preço de custo dos itens",
              )}
            />
            <MetricCard
              label={t("SALES_ANALYTICS_PROFIT_TOTAL", "Lucro Líquido")}
              value={formatCurrency(summary.totalProfit ?? 0, locale)}
              hint={t("SALES_ANALYTICS_PROFIT_HINT", "Receita − Custo")}
            />
          </section>

          {/* Hoje / Mês / Ticket médio — linha 2 */}
          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <p className="text-xs uppercase tracking-[0.24em] text-smoke">
                {t("SALES_ANALYTICS_TODAY", "Hoje")}
              </p>
              <p className="mt-2 font-display text-2xl text-gold">
                {formatCurrency(summary.revenueToday, locale)}
              </p>
              <div className="mt-1 flex justify-between text-xs text-smoke">
                <span>
                  {t("SALES_ANALYTICS_COST_PREFIX", "Custo")}:{" "}
                  {formatCurrency(summary.costToday ?? 0, locale)}
                </span>
                <span>
                  {t("SALES_ANALYTICS_PROFIT_PREFIX", "Lucro")}:{" "}
                  {formatCurrency(summary.profitToday ?? 0, locale)}
                </span>
              </div>
            </article>
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <p className="text-xs uppercase tracking-[0.24em] text-smoke">
                {t("SALES_ANALYTICS_MONTH", "Mês")}
              </p>
              <p className="mt-2 font-display text-2xl text-gold">
                {formatCurrency(summary.revenueThisMonth, locale)}
              </p>
              <div className="mt-1 flex justify-between text-xs text-smoke">
                <span>
                  {t("SALES_ANALYTICS_COST_PREFIX", "Custo")}:{" "}
                  {formatCurrency(summary.costThisMonth ?? 0, locale)}
                </span>
                <span>
                  {t("SALES_ANALYTICS_PROFIT_PREFIX", "Lucro")}:{" "}
                  {formatCurrency(summary.profitThisMonth ?? 0, locale)}
                </span>
              </div>
            </article>
            <MetricCard
              label={t("SALES_ANALYTICS_AVG_TICKET", "Ticket Médio")}
              value={formatCurrency(summary.averageTicket, locale)}
              hint={t(
                "SALES_ANALYTICS_TICKET_HINT",
                "{{paid}} pagos de {{total}} totais",
              )
                .replace("{{paid}}", String(summary.paidOrdersCount))
                .replace("{{total}}", String(summary.ordersCount))}
            />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-gold">
                  {filterMonth === 0
                    ? `${t("SALES_ANALYTICS_BY_MONTH", "Por mês")} — ${filterYear}`
                    : `${monthLabel[filterMonth - 1]} ${filterYear}`}
                </h2>
                <div className="flex items-center gap-3 text-xs text-smoke">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    {t("SALES_ANALYTICS_LEGEND_REVENUE", "Receita")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                    {t("SALES_ANALYTICS_LEGEND_COST", "Custo")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                    {t("SALES_ANALYTICS_LEGEND_PROFIT", "Lucro")}
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
                        {formatCurrency(item.revenue, locale)}
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
                        {formatChartLabel(item.date, monthShort, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl border border-gold/20 bg-lacquer/70 p-5 shadow-glow">
              <h2 className="font-display text-xl text-gold">
                {t("SALES_ANALYTICS_STATUS_TITLE", "Status dos Pedidos")}
              </h2>
              <div className="mt-5 space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-900">
                        {status === "PAGO"
                          ? t(
                              "SALES_ANALYTICS_STATUS_PAID",
                              "Pagos (aprovados)",
                            )
                          : t(`ORDER_STATUS_${status}`, status)}
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
              <h2 className="font-display text-xl text-gold">
                {t("SALES_ANALYTICS_TOP_FLAVORS", "Top Sabores")}
              </h2>
              <span className="text-xs text-smoke">
                {t(
                  "SALES_ANALYTICS_TOP_FLAVORS_HINT",
                  "Baseado em pedidos pagos",
                )}
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
                    {t(
                      "SALES_ANALYTICS_SALES_COUNT",
                      "{{count}} vendas",
                    ).replace("{{count}}", String(product.quantity))}
                  </span>
                </div>
              ))}
              {topProducts.length === 0 ? (
                <p className="text-sm text-smoke">
                  {t(
                    "SALES_ANALYTICS_NO_PAID_ORDERS",
                    "Ainda não há pedidos pagos para análise.",
                  )}
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
