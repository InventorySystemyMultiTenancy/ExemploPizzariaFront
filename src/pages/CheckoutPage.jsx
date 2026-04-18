import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";

const POLL_INTERVAL_MS = 4000;

const mapItemToApi = (item) => {
  const payload = item.payload || {};
  if (payload.type === "MEIO_A_MEIO") {
    return {
      type: "MEIO_A_MEIO",
      firstHalfProductId: payload.flavors[0],
      secondHalfProductId: payload.flavors[1],
      size: payload.size,
      quantity: item.quantity,
    };
  }
  return {
    type: "INTEIRA",
    productId: payload.flavors[0],
    size: payload.size,
    quantity: item.quantity,
  };
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { items, formatted, total, clearCart } = useCart();
  const [paymentMode, setPaymentMode] = useState("online");
  const [waitingOrderId, setWaitingOrderId] = useState(null);
  const [pollStatus, setPollStatus] = useState("PENDENTE");
  const pollRef = useRef(null);

  useEffect(() => {
    if (!waitingOrderId) return;
    const poll = async () => {
      try {
        const res = await api.get(`/orders/${waitingOrderId}`);
        const order = res.data?.data || res.data;
        const status = order?.paymentStatus;
        setPollStatus(status);
        if (status === "APROVADO") {
          clearInterval(pollRef.current);
          clearCart();
          toast.success("Pagamento confirmado! Preparando seu pedido 🍕");
          navigate("/dashboard");
        } else if (status === "RECUSADO") {
          clearInterval(pollRef.current);
          toast.error("Pagamento recusado. Tente novamente.");
          setWaitingOrderId(null);
        }
      } catch {
        // ignore transient errors
      }
    };
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll();
    return () => clearInterval(pollRef.current);
  }, [waitingOrderId, clearCart, navigate]);

  const createOrderMutation = useMutation({
    mutationFn: async (paymentMethod) => {
      const response = await api.post("/orders", {
        deliveryAddress: user?.address || "Endereço não informado",
        notes: "",
        paymentMethod,
        items: items.map(mapItemToApi),
      });
      return response.data?.data || response.data;
    },
  });

  const preferenceMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post("/payments/preference", { orderId });
      return response.data?.data;
    },
  });

  const handleOnlineCheckout = async () => {
    try {
      const order = await createOrderMutation.mutateAsync("PIX");
      const pref = await preferenceMutation.mutateAsync(order.id);
      window.open(pref.initPoint, "_blank", "noopener,noreferrer");
      setWaitingOrderId(order.id);
    } catch {
      toast.error("Erro ao gerar pagamento. Tente novamente.");
    }
  };

  const handlePresencialCheckout = async () => {
    try {
      await createOrderMutation.mutateAsync("PRESENCIAL");
      toast.success("Pedido confirmado! Aguarde a cobrança presencial.");
      clearCart();
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao criar pedido. Tente novamente.");
    }
  };

  const isLoading =
    createOrderMutation.isPending || preferenceMutation.isPending;

  if (waitingOrderId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-gray-900">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <svg
              className="h-8 w-8 animate-spin text-gold"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-2xl text-gold">
            Aguardando pagamento
          </h1>
          <p className="mt-2 text-sm text-smoke">
            A página do Mercado Pago foi aberta em outra aba. Conclua o
            pagamento por lá e aguarde a confirmação aqui.
          </p>
          <p className="mt-4 rounded-xl bg-gray-50 px-4 py-2 font-mono text-xs text-smoke">
            Pedido: #{waitingOrderId.slice(-8).toUpperCase()}
          </p>
          <p className="mt-3 text-xs text-smoke">
            Esta página atualiza automaticamente a cada poucos segundos.
          </p>
        </div>
        <img
          src="/logo-fellice.png"
          alt="Pizzaria Fellice"
          className="mt-8 h-10 w-auto opacity-40"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 text-gray-900 sm:px-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-800"
        >
          ← Voltar
        </button>
        <h1 className="font-display text-3xl text-gold">Checkout</h1>
      </div>

      {!items.length ? (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-sm text-smoke">
          Seu carrinho está vazio.
        </p>
      ) : (
        <div className="mt-2 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-gold/20 bg-lacquer/70 p-4 sm:p-6">
            <h2 className="font-display text-xl text-gold">Resumo</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-smoke">{item.description}</p>
                  </div>
                  <p className="font-semibold text-gold">x{item.quantity}</p>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-gray-200 pt-4 text-sm">
              <div className="flex justify-between text-smoke">
                <span>Subtotal</span>
                <span>{formatted.subtotal}</span>
              </div>
              <div className="mt-1 flex justify-between text-smoke">
                <span>Frete</span>
                <span>{formatted.freight}</span>
              </div>
              <div className="mt-2 flex justify-between text-lg font-bold text-gold">
                <span>Total</span>
                <span>{formatted.total}</span>
              </div>
            </div>
            {user?.address && (
              <p className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-xs text-smoke">
                📍 {user.address}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-gold">Pagamento</h2>
            <div className="flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setPaymentMode("online")}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                  paymentMode === "online"
                    ? "bg-rosso text-white shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                💳 Pagar Online
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("presencial")}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
                  paymentMode === "presencial"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                💵 Pagar Presencial
              </button>
            </div>

            {paymentMode === "online" ? (
              <div className="rounded-2xl border border-gold/20 bg-lacquer/70 p-5">
                <img
                  src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.71/mercadopago/logo__large@2x.png"
                  alt="Mercado Pago"
                  className="h-6 w-auto"
                />
                <p className="mt-3 text-sm text-smoke">
                  Pague com Pix, cartão de crédito ou débito via Mercado Pago.
                  Uma nova aba será aberta para o pagamento.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-smoke">
                  <li>✅ Pagamento 100% seguro</li>
                  <li>✅ Pix, crédito, débito aceitos</li>
                  <li>✅ Preparo inicia automaticamente após confirmação</li>
                </ul>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
                <p className="text-sm font-bold text-amber-800">
                  ⚠️ Atenção — leia antes de confirmar
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  O pagamento presencial é cobrado pelo entregador ou no balcão
                  no momento da entrega.
                </p>
                <p className="mt-3 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
                  🚫 O preparo do seu pedido{" "}
                  <span className="underline">só começa</span> depois que o
                  pagamento for confirmado por nossa equipe. Pedidos sem
                  pagamento confirmado serão cancelados.
                </p>
                <p className="mt-3 text-xs text-amber-600">
                  Aceitamos: dinheiro, cartão na maquininha.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <button
          type="button"
          disabled={isLoading || !isAuthenticated || !total}
          onClick={
            paymentMode === "online"
              ? handleOnlineCheckout
              : handlePresencialCheckout
          }
          className="mt-6 w-full rounded-2xl bg-rosso px-5 py-4 text-base font-bold text-white shadow-md transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? "Processando..."
            : paymentMode === "online"
              ? "Pagar com Mercado Pago →"
              : "Confirmar Pedido Presencial"}
        </button>
      )}
    </main>
  );
}

export default CheckoutPage;
