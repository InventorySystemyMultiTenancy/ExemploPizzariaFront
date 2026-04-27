import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EstimatedTimeBadge from "../components/EstimatedTimeBadge.jsx";
import {
  getDesktopNotificationsEnabled,
  requestDesktopNotificationPermission,
  setDesktopNotificationsEnabled,
  supportsDesktopNotifications,
} from "../lib/desktopNotifications.js";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { compareOrdersByUrgency, getOrderEta } from "../lib/orderEta.js";
import {
  clearStaffUnreadCount,
  getStaffUnreadCount,
  subscribeToStaffUnreadCount,
} from "../lib/staffAlertsStore.js";
import { useTranslation } from "../context/I18nContext.jsx";

const currency = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminPanelPage() {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const [unreadCount, setUnreadCount] = useState(() => getStaffUnreadCount());
  const [desktopEnabled, setDesktopEnabled] = useState(() =>
    getDesktopNotificationsEnabled(),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => subscribeToStaffUnreadCount(setUnreadCount), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-orders-preview"],
    queryFn: async () => {
      const response = await api.get("/orders");
      return response.data?.data || [];
    },
  });

  const currentNow = new Date(now);

  // Mesas com pagamento pendente (derivado da mesma query, sem request extra)
  const pendingMesaOrders = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (o) =>
        o.mesaId && o.paymentStatus !== "APROVADO" && o.status !== "CANCELADO",
    );
  }, [data]);

  const prioritizedOrders = useMemo(
    () =>
      [...(data ?? [])]
        .sort((firstOrder, secondOrder) =>
          compareOrdersByUrgency(firstOrder, secondOrder, currentNow),
        )
        .slice(0, 5),
    [currentNow, data],
  );
  const overdueCount = useMemo(
    () =>
      (data ?? []).filter((order) => getOrderEta(order, currentNow)?.isOverdue)
        .length,
    [currentNow, data],
  );

  const handleDesktopToggle = async () => {
    if (!supportsDesktopNotifications()) {
      return;
    }

    if (desktopEnabled) {
      setDesktopNotificationsEnabled(false);
      setDesktopEnabled(false);
      return;
    }

    const permission = await requestDesktopNotificationPermission();
    const granted = permission === "granted";
    setDesktopNotificationsEnabled(granted);
    setDesktopEnabled(granted);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 text-gray-900 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gold">
            {t("ADMIN_PANEL_TITLE", "Painel Admin")}
          </h1>
          <p className="mt-1 text-sm text-smoke">
            {t(
              "ADMIN_PANEL_SUBTITLE",
              "Visao operacional para equipe da Pizzaria Fellice.",
            )}
          </p>
        </div>
        <Link
          to="/"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-800"
        >
          {t("ADMIN_PANEL_BACK_HOME", "← Início")}
        </Link>
      </div>
      <p className="text-xs text-red-300">
        {overdueCount
          ? t(
              "ADMIN_PANEL_OVERDUE_COUNT",
              "{{count}} pedidos exigem atencao imediata",
            ).replace("{{count}}", String(overdueCount))
          : t("ADMIN_PANEL_NO_DELAYS", "Operacao sem atrasos no momento")}
      </p>
      <p className="mt-1 text-xs text-gold/90">
        {unreadCount
          ? t(
              "ADMIN_PANEL_ALERTS_COUNT",
              "{{count}} novos alertas da equipe",
            ).replace("{{count}}", String(unreadCount))
          : t("ADMIN_PANEL_NO_ALERTS", "Nenhum alerta novo")}
      </p>
      <p className="mt-1 text-xs text-smoke">
        {t("ADMIN_PANEL_DESKTOP_LABEL", "Desktop")}:{" "}
        {desktopEnabled
          ? t("ADMIN_PANEL_DESKTOP_ON", "notificacoes ativas")
          : t("ADMIN_PANEL_DESKTOP_OFF", "notificacoes inativas")}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/produtos"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">🍕</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            {t("ADMIN_PANEL_CARD_PRODUCTS_TITLE", "Gerenciar Produtos")}
          </h2>
          <p className="mt-1 text-xs text-smoke">
            {t(
              "ADMIN_PANEL_CARD_PRODUCTS_DESC",
              "Cadastrar, editar e desativar itens do cardapio",
            )}
          </p>
        </Link>
        <Link
          to="/admin/vendas"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">📈</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            {t("ADMIN_PANEL_CARD_SALES_TITLE", "Análise de Vendas")}
          </h2>
          <p className="mt-1 text-xs text-smoke">
            {t(
              "ADMIN_PANEL_CARD_SALES_DESC",
              "Receita, ticket medio e sabores mais vendidos",
            )}
          </p>
        </Link>
        <Link
          to="/cozinha"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">👨‍🍳</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            {t("ADMIN_PANEL_CARD_KITCHEN_TITLE", "Painel da Cozinha")}
          </h2>
          <p className="mt-1 text-xs text-smoke">
            {t(
              "ADMIN_PANEL_CARD_KITCHEN_DESC",
              "Ver pedidos ativos e avançar status",
            )}
          </p>
        </Link>
        <Link
          to="/admin/historico"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">📋</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            {t("ADMIN_PANEL_CARD_HISTORY_TITLE", "Histórico de Pedidos")}
          </h2>
          <p className="mt-1 text-xs text-smoke">
            {t(
              "ADMIN_PANEL_CARD_HISTORY_DESC",
              "Todos os pedidos, cancelamentos e estornos",
            )}
          </p>
        </Link>
        <Link
          to="/admin/usuarios"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">👤</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            {t("ADMIN_PANEL_CARD_USERS_TITLE", "Criar Usuário")}
          </h2>
          <p className="mt-1 text-xs text-smoke">
            {t(
              "ADMIN_PANEL_CARD_USERS_DESC",
              "Cadastrar motoboy, cozinha, funcionário ou admin",
            )}
          </p>
        </Link>
        <Link
          to="/admin/mesas"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">🪑</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            {t("ADMIN_PANEL_CARD_TABLES_TITLE", "Mesas")}
          </h2>
          <p className="mt-1 text-xs text-smoke">
            {t(
              "ADMIN_PANEL_CARD_TABLES_DESC",
              "Cadastrar mesas, maquininhas e gerar QR codes",
            )}
          </p>
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-smoke">
          {t("ADMIN_PANEL_LOADING", "Carregando dados...")}
        </p>
      ) : null}
      {isError ? (
        <p className="mt-5 text-sm text-red-300">
          {t("ADMIN_PANEL_LOAD_ERROR", "Falha ao carregar dados do painel.")}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Fila Prioritária */}
        <section className="rounded-3xl border border-gold/20 bg-lacquer/70 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-gold">
              {t(
                "ADMIN_PANEL_PRIORITY_QUEUE_TITLE",
                "Fila Prioritaria (preview)",
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDesktopToggle}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  desktopEnabled
                    ? "border-gold/30 text-gold hover:bg-gold/10"
                    : "border-gray-200 text-smoke hover:border-gold/30 hover:text-gold"
                }`}
              >
                {t("ADMIN_PANEL_DESKTOP_LABEL", "Desktop")}{" "}
                {desktopEnabled
                  ? t("ADMIN_PANEL_DESKTOP_BUTTON_ON", "ligado")
                  : t("ADMIN_PANEL_DESKTOP_BUTTON_OFF", "desligado")}
              </button>
              <button
                type="button"
                onClick={() => clearStaffUnreadCount()}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-smoke transition hover:border-gold/30 hover:text-gold"
              >
                {t(
                  "ADMIN_PANEL_MARK_ALERTS_READ",
                  "Marcar alertas como vistos",
                )}{" "}
                {unreadCount ? `(${unreadCount})` : ""}
              </button>
            </div>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {prioritizedOrders.map((order) => (
              <li
                key={order.id}
                className={`rounded-xl border bg-gray-100 p-3 ${
                  getOrderEta(order, currentNow)?.isOverdue
                    ? "border-red-500/40"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">#{order.id.slice(0, 8)}</p>
                  <EstimatedTimeBadge compact now={currentNow} order={order} />
                </div>
                <p className="mt-1 text-smoke">
                  {t("ADMIN_PANEL_STATUS_LABEL", "Status")}: {""}
                  {t(`ORDER_STATUS_${order.status}`, order.status)}
                </p>
              </li>
            ))}
            {!prioritizedOrders.length && !isLoading ? (
              <li className="text-sm text-smoke">
                {t(
                  "ADMIN_PANEL_NO_ORDERS",
                  "Sem pedidos para exibir no momento.",
                )}
              </li>
            ) : null}
          </ul>
        </section>

        {/* Mesas com pagamento pendente */}
        <section className="rounded-3xl border border-amber-400/30 bg-lacquer/70 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl text-amber-500">
              💳{" "}
              {t("ADMIN_PANEL_PENDING_PAYMENTS_TITLE", "Pagamentos Pendentes")}
            </h2>
            {pendingMesaOrders.length > 0 && (
              <span className="animate-pulse rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {pendingMesaOrders.length}
              </span>
            )}
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {pendingMesaOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-amber-400/40 bg-amber-50 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-amber-800">
                    🪑 {order.mesa?.name ?? t("ADMIN_PANEL_MESA_LABEL", "Mesa")}
                  </p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {currency(order.total)}
                  </span>
                </div>
                <p className="mt-1 text-amber-700">
                  #{order.id.slice(0, 8)} ·{" "}
                  {t(
                    `PAYMENT_STATUS_${order.paymentStatus ?? "PENDENTE"}`,
                    order.paymentStatus ?? "PENDENTE",
                  )}
                </p>
              </li>
            ))}
            {!pendingMesaOrders.length && !isLoading ? (
              <li className="text-sm text-smoke">
                {t(
                  "ADMIN_PANEL_NO_PENDING_PAYMENTS",
                  "Nenhuma mesa com pagamento pendente.",
                )}
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default AdminPanelPage;
