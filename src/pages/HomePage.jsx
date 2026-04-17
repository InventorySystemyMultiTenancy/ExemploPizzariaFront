import { Link } from "react-router-dom";
import CartDrawer from "../components/CartDrawer.jsx";
import PizzaSelector from "../components/PizzaSelector.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";

function HomePage() {
  const { openCart, items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-ink bg-texture pb-24 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <h1 className="font-display text-2xl text-gold sm:text-3xl">
          Pizzaria China
        </h1>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                className="rounded-xl border border-white/10 px-3 py-2 text-xs sm:text-sm"
                to={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
              >
                Painel
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-ember/40 px-3 py-2 text-xs text-red-300 sm:text-sm"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              className="rounded-xl bg-gold px-3 py-2 text-xs font-bold text-black sm:text-sm"
              to="/login"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 sm:grid-cols-[1.1fr,0.9fr] sm:px-6">
        <PizzaSelector />

        <div className="rounded-3xl border border-ember/30 bg-gradient-to-b from-ember/30 to-black/40 p-5">
          <h2 className="font-display text-2xl text-gold">Sabores da Semana</h2>
          <p className="mt-2 text-sm text-smoke">
            Experiencia oriental em cada fatia, com massa de fermentacao lenta e
            ingredientes premium.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/90">
            <li>• Frango Xadrez com gengibre fresco</li>
            <li>• Pepperoni de Hong Kong com pimenta doce</li>
            <li>• Borda vulcao de catupiry trufado</li>
          </ul>

          <button
            type="button"
            onClick={openCart}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-gold to-amber-300 px-5 py-4 text-base font-extrabold text-black"
          >
            Abrir Carrinho ({items.length})
          </button>
        </div>
      </section>

      <CartDrawer />
    </main>
  );
}

export default HomePage;
