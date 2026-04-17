import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function CheckoutReturnPage() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const status = searchParams.get("status"); // approved | failure | pending | null
  const orderId = searchParams.get("external_reference");

  const isApproved = status === "approved";
  const isPending = status === "pending" || status === "in_process";

  useEffect(() => {
    if (isApproved) {
      clearCart();
    }
  }, [isApproved, clearCart]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-gray-900">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
        {isApproved ? (
          <>
            <div className="text-6xl">🎉</div>
            <h1 className="mt-4 font-display text-3xl text-gold">
              Pagamento confirmado!
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Seu pedido foi recebido e já está sendo preparado com carinho.
            </p>
            {orderId && (
              <p className="mt-3 rounded-xl bg-gray-50 px-4 py-2 font-mono text-xs text-smoke">
                Pedido: #{orderId.slice(-8).toUpperCase()}
              </p>
            )}
            <Link
              to="/dashboard"
              className="mt-6 block rounded-2xl bg-rosso py-4 font-bold text-white transition hover:bg-ember"
            >
              Acompanhar meu pedido
            </Link>
          </>
        ) : isPending ? (
          <>
            <div className="text-6xl">⏳</div>
            <h1 className="mt-4 font-display text-3xl text-gold">
              Pagamento em análise
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Seu pagamento está sendo processado. Assim que confirmado, o
              preparo será iniciado.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 block rounded-2xl bg-rosso py-4 font-bold text-white transition hover:bg-ember"
            >
              Ver meus pedidos
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="mt-4 font-display text-3xl text-rosso">
              Pagamento não concluído
            </h1>
            <p className="mt-2 text-sm text-smoke">
              Houve um problema com o pagamento. Seu carrinho ainda está salvo.
            </p>
            <Link
              to="/checkout"
              className="mt-6 block rounded-2xl bg-rosso py-4 font-bold text-white transition hover:bg-ember"
            >
              Tentar novamente
            </Link>
            <Link
              to="/cardapio"
              className="mt-3 block text-sm text-gray-400 hover:text-rosso"
            >
              Voltar ao cardápio
            </Link>
          </>
        )}
      </div>

      <img
        src="/logo-fellice.png"
        alt="Pizzaria Fellice"
        className="mt-8 h-10 w-auto opacity-50"
      />
    </main>
  );
}

export default CheckoutReturnPage;
