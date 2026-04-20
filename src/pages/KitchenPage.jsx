import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EstimatedTimeBadge from "../components/EstimatedTimeBadge.jsx";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import {
  getDesktopNotificationsEnabled,
  requestDesktopNotificationPermission,
  setDesktopNotificationsEnabled,
  supportsDesktopNotifications,
} from "../lib/desktopNotifications.js";
import { compareOrdersByUrgency, getOrderEta } from "../lib/orderEta.js";
import { playKitchenAlertTone } from "../lib/playKitchenAlertTone.js";
import {
  clearStaffUnreadCount,
  getStaffUnreadCount,
  subscribeToStaffUnreadCount,
} from "../lib/staffAlertsStore.js";

const SOUND_STORAGE_KEY = "pc_kitchen_sound_enabled";
const NEW_ORDER_HIGHLIGHT_MS = 20000;

const COLUMNS = [
  {
    key: "AGUARDANDO_PAGAMENTO",
    label: "Aguardando Pagamento",
    virtual: true,
    color: "border-amber-500/40 bg-amber-500/10",
  },
  {
    key: "RECEBIDO",
    label: "Recebido",
    next: "PREPARANDO",
    color: "border-blue-500/40 bg-blue-500/10",
  },
  {
    key: "PREPARANDO",
    label: "Preparando",
    next: "NO_FORNO",
    color: "border-yellow-500/40 bg-yellow-500/10",
  },
  {
    key: "NO_FORNO",
    label: "No Forno",
    next: "SAIU_PARA_ENTREGA",
    color: "border-ember/40 bg-ember/10",
  },
  {
    key: "SAIU_PARA_ENTREGA",
    label: "Saiu p/ Entrega",
    next: "ENTREGUE",
    color: "border-green-500/40 bg-green-500/10",
  },
];

// Real order statuses (for drag/advance logic)
const STAGES = COLUMNS.filter((c) => !c.virtual);

const STAGE_BADGE = {
  RECEBIDO: "bg-blue-100 text-blue-700",
  PREPARANDO: "bg-yellow-100 text-yellow-700",
  NO_FORNO: "bg-orange-100 text-orange-700",
  SAIU_PARA_ENTREGA: "bg-green-100 text-green-700",
};

const NEXT_LABEL = {
  RECEBIDO: "Iniciar Preparo",
  PREPARANDO: "Enviar ao Forno",
  NO_FORNO: "Saiu para Entrega",
  SAIU_PARA_ENTREGA: "Marcar Entregue",
};

function getNextStageKey(status) {
  return STAGES.find((stage) => stage.key === status)?.next ?? null;
}

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function OrderCard({
  order,
  onAdvance,
  advancing,
  now,
  isFresh,
  dragging,
  onDragStart,
  onDragEnd,
  onConfirmPayment,
  onPayLater,
  confirmingPayment,
  onCancel,
  cancelling,
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const stage = STAGES.find((s) => s.key === order.status);
  const hasNext = !!stage?.next && !onConfirmPayment;
  const eta = getOrderEta(order, now);
  const isPaymentPending = order.paymentStatus === "PENDENTE";

  return (
    <article
      draggable={hasNext && !advancing}
      onDragStart={() => onDragStart(order)}
      onDragEnd={onDragEnd}
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        isFresh
          ? "animate-pulse border-gold/60 bg-gold/10 shadow-[0_0_18px_rgba(212,169,77,0.2)]"
          : eta?.isOverdue
            ? "border-red-500/50 bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
            : (stage?.color ?? "border-amber-500/40 bg-amber-500/10")
      } ${dragging ? "cursor-grabbing opacity-60" : hasNext ? "cursor-grab" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            {order.user?.name ?? "Cliente"}
          </p>
          <p className="text-xs text-gray-600">{formatTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`shrink-0 rounded-xl px-2 py-1 text-xs font-bold ${
              STAGE_BADGE[order.status] ?? "bg-gray-200 text-gray-900"
            }`}
          >
            {order.status.replace(/_/g, " ")}
          </span>
          {isPaymentPending && !onConfirmPayment && (
            <span className="rounded-xl bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              💰 Pag. pendente
            </span>
          )}
        </div>
      </div>

      {isFresh ? (
        <div className="mt-3 inline-flex rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
          Novo pedido
        </div>
      ) : null}

      <div className="mt-3">
        <EstimatedTimeBadge compact now={now} order={order} />
      </div>

      {/* Items */}
      <ul className="mt-3 space-y-1 border-t border-gray-200 pt-3">
        {order.items?.map((item) => (
          <li key={item.id} className="text-sm">
            {item.type === "MEIO_A_MEIO" ? (
              <span className="text-gold">
                Meio a Meio — {item.firstHalfProduct?.name ?? "?"} /{" "}
                {item.secondHalfProduct?.name ?? "?"}
              </span>
            ) : (
              <span className="text-gray-900">
                {item.product?.name ?? "Pizza"}
              </span>
            )}
            <span className="ml-2 text-xs text-gray-600">
              {item.size} &times; {item.quantity}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-2 rounded-xl bg-gray-200 px-3 py-1.5 text-xs text-gray-700">
          Obs: {order.notes}
        </p>
      )}

      {/* Payment pending column actions */}
      {onConfirmPayment && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={confirmingPayment}
            onClick={() => onConfirmPayment(order.id)}
            className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {confirmingPayment ? "..." : "✅ Confirmar Pgto"}
          </button>
          <button
            type="button"
            disabled={confirmingPayment}
            onClick={() => onPayLater(order.id)}
            className="flex-1 rounded-2xl border-2 border-amber-400 bg-amber-50 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
          >
            {confirmingPayment ? "..." : "⏳ Pagar Depois"}
          </button>
        </div>
      )}

      {/* Normal advance button */}
      {hasNext && (
        <button
          type="button"
          disabled={advancing}
          onClick={() => onAdvance(order.id, stage.next)}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-ember to-red-500 py-3 text-sm font-bold text-gray-900 transition hover:opacity-90 disabled:opacity-50"
        >
          {advancing ? "Atualizando..." : NEXT_LABEL[order.status]}
        </button>
      )}

      {/* Cancel button — shown in all columns including payment pending */}
      {onCancel &&
        (confirmCancel ? (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2">
            <span className="flex-1 text-xs text-red-600">
              Cancelar pedido #{order.id.slice(-6).toUpperCase()}?
            </span>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => {
                setConfirmCancel(false);
                onCancel(order.id);
              }}
              className="rounded-xl bg-red-500 px-3 py-1 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {cancelling ? "..." : "Sim"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-gray-100"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={cancelling || advancing || confirmingPayment}
            onClick={() => setConfirmCancel(true)}
            className="mt-2 w-full rounded-2xl border border-red-400/50 bg-red-500/10 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 disabled:opacity-40"
          >
            {cancelling ? "Cancelando..." : "Cancelar Pedido"}
          </button>
        ))}
    </article>
  );
}

function KitchenPage() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const [latestAlert, setLatestAlert] = useState(null);
  const [freshOrderIds, setFreshOrderIds] = useState([]);
  const [unreadCount, setUnreadCount] = useState(() => getStaffUnreadCount());
  const [desktopEnabled, setDesktopEnabled] = useState(() =>
    getDesktopNotificationsEnabled(),
  );
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [activeDropStage, setActiveDropStage] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const cached = localStorage.getItem(SOUND_STORAGE_KEY);
    return cached === null ? true : cached === "true";
  });
  const previousOverdueIdsRef = useRef([]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

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

  const handleDragStart = (order) => {
    setDraggedOrder({
      id: order.id,
      status: order.status,
      nextStatus: getNextStageKey(order.status),
    });
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setActiveDropStage(null);
  };

  useEffect(() => subscribeToStaffUnreadCount(setUnreadCount), []);

  useEffect(() => {
    const timeouts = new Map();

    const handleOrderCreated = (event) => {
      const payload = event.detail;

      setLatestAlert({
        orderId: payload.orderId,
        timestamp: Date.now(),
      });

      setFreshOrderIds((current) => {
        const next = current.filter((orderId) => orderId !== payload.orderId);
        return [payload.orderId, ...next];
      });

      if (soundEnabled) {
        playKitchenAlertTone("new-order");
      }

      const previousTimeout = timeouts.get(payload.orderId);
      if (previousTimeout) {
        window.clearTimeout(previousTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        setFreshOrderIds((current) =>
          current.filter((orderId) => orderId !== payload.orderId),
        );
        timeouts.delete(payload.orderId);
      }, NEW_ORDER_HIGHLIGHT_MS);

      timeouts.set(payload.orderId, timeoutId);
    };

    window.addEventListener("pc:order-created", handleOrderCreated);

    return () => {
      window.removeEventListener("pc:order-created", handleOrderCreated);
      for (const timeoutId of timeouts.values()) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [soundEnabled]);

  useEffect(() => {
    const handleRealtimeReconnected = () => {
      if (soundEnabled) {
        playKitchenAlertTone("reconnected");
      }
    };

    window.addEventListener(
      "pc:realtime-reconnected",
      handleRealtimeReconnected,
    );

    return () => {
      window.removeEventListener(
        "pc:realtime-reconnected",
        handleRealtimeReconnected,
      );
    };
  }, [soundEnabled]);

  const {
    data: orders = [],
    isLoading,
    isError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data?.data ?? [];
    },
    refetchInterval: 120_000,
  });

  const {
    mutate: advance,
    variables: advancingVars,
    isPending,
  } = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await api.patch(`/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Falha ao atualizar status"),
  });

  const {
    mutate: cancelOrder,
    variables: cancelVars,
    isPending: isCancelling,
  } = useMutation({
    mutationFn: async (orderId) => {
      const res = await api.patch(`/orders/${orderId}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Pedido cancelado");
    },
    onError: () => toast.error("Falha ao cancelar pedido"),
  });

  const {
    mutate: setPaymentStatus,
    variables: paymentVars,
    isPending: isPaymentPending,
  } = useMutation({
    mutationFn: async ({ orderId, paymentStatus, advanceTo }) => {
      await api.patch(`/orders/${orderId}/payment-status`, { paymentStatus });
      if (advanceTo) {
        await api.patch(`/orders/${orderId}/status`, { status: advanceTo });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Atualizado com sucesso");
    },
    onError: () => toast.error("Falha ao atualizar"),
  });

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--";
  const currentNow = new Date(now);
  const overdueCount = useMemo(
    () =>
      orders.filter((order) => getOrderEta(order, currentNow)?.isOverdue)
        .length,
    [currentNow, orders],
  );
  const overdueIds = useMemo(
    () =>
      orders
        .filter((order) => getOrderEta(order, currentNow)?.isOverdue)
        .map((order) => order.id),
    [currentNow, orders],
  );
  const getColumnOrders = (columnKey) => {
    if (columnKey === "AGUARDANDO_PAGAMENTO") {
      return orders.filter(
        (o) => o.status === "RECEBIDO" && o.paymentStatus === "PENDENTE",
      );
    }
    if (columnKey === "RECEBIDO") {
      return orders.filter(
        (o) => o.status === "RECEBIDO" && o.paymentStatus !== "PENDENTE",
      );
    }
    return orders.filter((o) => o.status === columnKey);
  };

  const stageCounts = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        count: getColumnOrders(col.key).length,
      })),
    [orders], // getColumnOrders is inline and only depends on orders
  );
  const previousStageCountsRef = useRef({});
  const [changedStageKeys, setChangedStageKeys] = useState([]);

  useEffect(() => {
    const previousIds = previousOverdueIdsRef.current;
    const newOverdueIds = overdueIds.filter(
      (orderId) => !previousIds.includes(orderId),
    );

    if (newOverdueIds.length && soundEnabled) {
      playKitchenAlertTone("overdue");
      toast.error(`${newOverdueIds.length} pedido(s) entraram em atraso`);
    }

    previousOverdueIdsRef.current = overdueIds;
  }, [overdueIds, soundEnabled]);

  useEffect(() => {
    const changedKeys = stageCounts
      .filter(
        (stage) => previousStageCountsRef.current[stage.key] !== undefined,
      )
      .filter(
        (stage) => previousStageCountsRef.current[stage.key] !== stage.count,
      )
      .map((stage) => stage.key);

    if (changedKeys.length) {
      setChangedStageKeys(changedKeys);
      const timeoutId = window.setTimeout(() => {
        setChangedStageKeys([]);
      }, 1400);

      previousStageCountsRef.current = Object.fromEntries(
        stageCounts.map((stage) => [stage.key, stage.count]),
      );

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    previousStageCountsRef.current = Object.fromEntries(
      stageCounts.map((stage) => [stage.key, stage.count]),
    );
  }, [stageCounts]);

  return (
    <main className="min-h-screen bg-ink px-4 py-6 text-gray-900 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gold">Cozinha</h1>
          <p className="mt-1 text-xs text-smoke">
            Atualizado em {lastUpdate} &bull; tempo real com fallback de 2 min
          </p>
          <p className="mt-1 text-xs text-red-300">
            {overdueCount
              ? `${overdueCount} pedidos em atraso`
              : "Sem pedidos em atraso"}
          </p>
          <p className="mt-1 text-xs text-gold/90">
            {unreadCount
              ? `${unreadCount} novos alertas nao lidos`
              : "Nenhum alerta pendente"}
          </p>
          <p className="mt-1 text-xs text-smoke">
            Desktop:{" "}
            {desktopEnabled ? "notificacoes ativas" : "notificacoes inativas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => clearStaffUnreadCount()}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-smoke transition hover:border-gold/30 hover:text-gold"
          >
            Limpar alertas {unreadCount ? `(${unreadCount})` : ""}
          </button>
          <button
            type="button"
            onClick={handleDesktopToggle}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              desktopEnabled
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-gray-200 bg-gray-50 text-smoke"
            }`}
          >
            Desktop {desktopEnabled ? "ligado" : "desligado"}
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled((current) => !current)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              soundEnabled
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-gray-200 bg-gray-50 text-smoke"
            }`}
          >
            Som {soundEnabled ? "ligado" : "desligado"}
          </button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <span className="text-xs text-smoke">Ao vivo</span>
          </div>
        </div>
      </header>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stageCounts.map((stage) => {
          const changed = changedStageKeys.includes(stage.key);

          return (
            <article
              key={stage.key}
              className={`rounded-2xl border p-4 transition-all duration-300 ${
                changed
                  ? "scale-[1.02] border-gold/50 bg-gold/10 shadow-glow"
                  : "border-gray-200 bg-lacquer/50"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-smoke">
                {stage.label}
              </p>
              <p className="mt-2 font-display text-3xl text-gray-900">
                {stage.count}
              </p>
              <p className="mt-1 text-xs text-smoke">Pedidos nesta etapa</p>
            </article>
          );
        })}
      </section>

      {latestAlert ? (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          <div>
            <p className="font-semibold">
              Novo pedido #{latestAlert.orderId.slice(-6).toUpperCase()} chegou
              na fila
            </p>
            <p className="text-xs text-gold/80">
              Destaque ativo por {Math.floor(NEW_ORDER_HIGHLIGHT_MS / 1000)}{" "}
              segundos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLatestAlert(null)}
            className="rounded-xl border border-gold/30 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10"
          >
            Fechar
          </button>
        </div>
      ) : null}

      {isLoading && (
        <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-50" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-300">Falha ao carregar pedidos.</p>
      )}

      {/* Kanban columns */}
      {!isLoading && !isError && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((col) => {
            const isVirtual = col.virtual;
            const stageOrders = getColumnOrders(col.key).sort((a, b) =>
              compareOrdersByUrgency(a, b, currentNow),
            );
            const canDropHere =
              !isVirtual && draggedOrder?.nextStatus === col.key;
            const isDropActive = activeDropStage === col.key && canDropHere;

            return (
              <section
                key={col.key}
                onDragOver={(event) => {
                  if (!canDropHere) return;
                  event.preventDefault();
                  setActiveDropStage(col.key);
                }}
                onDragLeave={() => {
                  if (activeDropStage === col.key) setActiveDropStage(null);
                }}
                onDrop={() => {
                  if (!draggedOrder || draggedOrder.nextStatus !== col.key) {
                    handleDragEnd();
                    return;
                  }
                  advance({ orderId: draggedOrder.id, status: col.key });
                  handleDragEnd();
                }}
                className={`rounded-3xl transition-all duration-200 ${
                  isDropActive
                    ? "bg-gold/10 ring-2 ring-gold/40"
                    : canDropHere
                      ? "ring-1 ring-dashed ring-gold/20"
                      : ""
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{col.label}</h2>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-smoke">
                    {stageOrders.length}
                  </span>
                </div>

                {isDropActive ? (
                  <div className="mb-3 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2 text-center text-xs font-semibold text-gold">
                    Solte aqui para mover para {col.label}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {stageOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-smoke">
                      Nenhum pedido
                    </div>
                  ) : (
                    stageOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        now={currentNow}
                        isFresh={freshOrderIds.includes(order.id)}
                        dragging={draggedOrder?.id === order.id}
                        advancing={
                          isPending && advancingVars?.orderId === order.id
                        }
                        onDragStart={isVirtual ? () => {} : handleDragStart}
                        onDragEnd={handleDragEnd}
                        onAdvance={(orderId, status) =>
                          advance({ orderId, status })
                        }
                        onConfirmPayment={
                          isVirtual
                            ? (orderId) =>
                                setPaymentStatus({
                                  orderId,
                                  paymentStatus: "APROVADO",
                                })
                            : undefined
                        }
                        onPayLater={
                          isVirtual
                            ? (orderId) =>
                                setPaymentStatus({
                                  orderId,
                                  paymentStatus: "PENDENTE",
                                  advanceTo: "PREPARANDO",
                                })
                            : undefined
                        }
                        confirmingPayment={
                          isPaymentPending && paymentVars?.orderId === order.id
                        }
                        onCancel={cancelOrder}
                        cancelling={isCancelling && cancelVars === order.id}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <p className="mt-10 text-center text-smoke">
          Sem pedidos ativos no momento.
        </p>
      )}
    </main>
  );
}

export default KitchenPage;
