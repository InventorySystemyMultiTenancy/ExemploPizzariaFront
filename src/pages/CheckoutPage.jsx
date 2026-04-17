import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import CheckoutMock from "../components/CheckoutMock.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";

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
  const { isAuthenticated } = useAuth();
  const { items, formatted, total, clearCart } = useCart();

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        deliveryAddress: "Rua das Oliveiras, 27",
        notes: "Pedido via checkout mock",
        paymentMethod: "PIX",
        items: items.map(mapItemToApi),
      };

      const response = await api.post("/orders", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Pedido enviado com sucesso");
      clearCart();
      navigate("/dashboard");
    },
    onError: () => {
      toast.error("Erro no pagamento/pedido");
    },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 text-gray-900 sm:px-6">
      <h1 className="font-display text-3xl text-gold">Checkout</h1>

      {!items.length ? (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-sm text-smoke">
          Seu carrinho esta vazio.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
          </div>

          <CheckoutMock />
        </div>
      )}

      <button
        type="button"
        disabled={
          !items.length ||
          createOrderMutation.isPending ||
          !isAuthenticated ||
          !total
        }
        onClick={() => createOrderMutation.mutate()}
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-ember to-red-500 px-5 py-4 text-base font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAuthenticated ? "Finalizar Pedido" : "Faca login para finalizar"}
      </button>
    </main>
  );
}

export default CheckoutPage;
