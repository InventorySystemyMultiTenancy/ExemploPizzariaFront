import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";

function CartDrawer() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    formatted,
    total,
  } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-white p-4 shadow-2xl transition-transform duration-300 ease-in-out sm:p-6 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="font-display text-2xl text-gray-900">Seu Carrinho</h3>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
          >
            ✕ Fechar
          </button>
        </div>

        <div className="mt-5 space-y-3 overflow-y-auto pb-44">
          {!items.length ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-smoke">
              Seu carrinho esta vazio.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.key}
                className="rounded-2xl border border-gray-200 bg-gray-100 p-3 transition-all duration-200 hover:border-gold/30 hover:bg-gray-200"
              >
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="mt-1 text-xs text-smoke">{item.description}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-xl border border-gray-200 text-lg"
                      onClick={() =>
                        updateQuantity(item.key, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-xl border border-gray-200 text-lg"
                      onClick={() =>
                        updateQuantity(item.key, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-gold">
                      {(item.price * item.quantity).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-xs text-red-400"
                    >
                      remover
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 sm:p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-smoke">
              <span>Subtotal</span>
              <span>{formatted.subtotal}</span>
            </div>
            <div className="flex justify-between text-smoke">
              <span>Frete</span>
              <span>{formatted.freight}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gold">
              <span>Total</span>
              <span>{formatted.total}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!total}
            onClick={() => {
              closeCart();
              if (!isAuthenticated) {
                navigate("/login?redirect=/checkout");
              } else {
                navigate("/checkout");
              }
            }}
            className={`mt-4 block w-full rounded-2xl px-5 py-4 text-center text-base font-bold transition ${
              total
                ? "bg-rosso text-white shadow-md hover:bg-ember"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            Finalizar Compra
          </button>
        </footer>
      </aside>
    </>
  );
}

export default CartDrawer;
