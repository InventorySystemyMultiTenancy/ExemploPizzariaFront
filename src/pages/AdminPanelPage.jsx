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

function AdminPanelPage() {
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
          <h1 className="font-display text-3xl text-gold">Painel Admin</h1>
          <p className="mt-1 text-sm text-smoke">
            Visao operacional para equipe da Pizzaria Fellice.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-800"
        >
          ← Início
        </Link>
      </div>
      <p className="text-xs text-red-300">
        {overdueCount
          ? `${overdueCount} pedidos exigem atencao imediata`
          : "Operacao sem atrasos no momento"}
      </p>
      <p className="mt-1 text-xs text-gold/90">
        {unreadCount
          ? `${unreadCount} novos alertas da equipe`
          : "Nenhum alerta novo"}
      </p>
      <p className="mt-1 text-xs text-smoke">
        Desktop:{" "}
        {desktopEnabled ? "notificacoes ativas" : "notificacoes inativas"}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/produtos"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">🍕</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            Gerenciar Produtos
          </h2>
          <p className="mt-1 text-xs text-smoke">
            Cadastrar, editar e desativar itens do cardapio
          </p>
        </Link>
        <Link
          to="/admin/vendas"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">📈</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            Análise de Vendas
          </h2>
          <p className="mt-1 text-xs text-smoke">
            Receita, ticket medio e sabores mais vendidos
          </p>
        </Link>
        <Link
          to="/cozinha"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">👨‍🍳</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            Painel da Cozinha
          </h2>
          <p className="mt-1 text-xs text-smoke">
            Ver pedidos ativos e avançar status
          </p>
        </Link>
        <Link
          to="/admin/historico"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">📋</p>
          <h2 className="mt-2 font-semibold text-gray-900">
            Histórico de Pedidos
          </h2>
          <p className="mt-1 text-xs text-smoke">
            Todos os pedidos, cancelamentos e estornos
          </p>
        </Link>
        <Link
          to="/admin/usuarios"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">👤</p>
          <h2 className="mt-2 font-semibold text-gray-900">Criar Usuário</h2>
          <p className="mt-1 text-xs text-smoke">
            Cadastrar motoboy, cozinha, funcionário ou admin
          </p>
        </Link>
        <Link
          to="/admin/mesas"
          className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5 transition hover:border-gold/50"
        >
          <p className="text-2xl">🪑</p>
          <h2 className="mt-2 font-semibold text-gray-900">Mesas</h2>
          <p className="mt-1 text-xs text-smoke">
            Cadastrar mesas, maquininhas e gerar QR codes
          </p>
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-smoke">Carregando dados...</p>
      ) : null}
      {isError ? (
        <p className="mt-5 text-sm text-red-300">
          Falha ao carregar dados do painel.
        </p>
      ) : null}

      <section className="mt-5 rounded-3xl border border-gold/20 bg-lacquer/70 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-gold">
            Fila Prioritaria (preview)
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
              Desktop {desktopEnabled ? "ligado" : "desligado"}
            </button>
            <button
              type="button"
              onClick={() => clearStaffUnreadCount()}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-smoke transition hover:border-gold/30 hover:text-gold"
            >
              Marcar alertas como vistos {unreadCount ? `(${unreadCount})` : ""}
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
              <p className="mt-1 text-smoke">Status: {order.status}</p>
            </li>
          ))}
          {!prioritizedOrders.length && !isLoading ? (
            <li className="text-sm text-smoke">
              Sem pedidos para exibir no momento.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}

export default AdminPanelPage;
