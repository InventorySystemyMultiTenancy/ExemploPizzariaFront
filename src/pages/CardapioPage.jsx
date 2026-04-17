import { Link } from "react-router-dom";
import CartDrawer from "../components/CartDrawer.jsx";
import PizzaSelector from "../components/PizzaSelector.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";

function CardapioPage() {
  const { openCart, items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <Link to="/">
            <img
              src="/logo-fellice.png"
              alt="Pizzaria Fellice"
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/cardapio"
              className="text-sm font-semibold text-rosso underline underline-offset-4"
            >
              Cardápio
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  className="text-sm text-gray-500 transition-colors hover:text-rosso"
                  to={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
                >
                  Painel
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm text-gray-400 transition-colors hover:text-rosso"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                className="text-sm text-gray-600 transition-colors hover:text-rosso"
                to="/login"
              >
                Entrar
              </Link>
            )}
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center gap-2 rounded-xl bg-rosso px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-ember"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Carrinho</span>
              {items.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-black text-black">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Page title */}
      <div className="border-b border-gray-100 bg-gray-50/60 py-8 text-center">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold">
          Desde 1997 · 27 anos de tradição
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
          Nosso Cardápio
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Escolha o tamanho, a borda e até dois sabores para montar a pizza
          perfeita.
        </p>
      </div>

      {/* Main grid */}
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:grid-cols-[1.3fr,0.7fr] sm:px-8">
        <PizzaSelector />

        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-6 shadow-sm">
          <h2 className="font-display text-2xl text-rosso">
            Sabores da Semana
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            27 anos de tradição italiana em cada fatia, com massa de fermentação
            lenta e ingredientes selecionados.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-rosso">●</span>
              Mussarela de búfala com manjericão fresco
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-rosso">●</span>
              Calabresa artesanal com cebola caramelizada
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-rosso">●</span>
              Borda recheada de catupiry trufado
            </li>
          </ul>

          <div className="mt-6 border-t border-rose-100 pt-5">
            <p className="text-center font-script text-xl italic text-rosso/80">
              O seu momento de ser feliz!
            </p>
          </div>

          <button
            type="button"
            onClick={openCart}
            className="mt-5 w-full rounded-2xl bg-rosso px-5 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-ember"
          >
            Abrir Carrinho{items.length > 0 ? ` (${items.length})` : ""}
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Pizzaria Fellice © 2024 · O seu momento de ser feliz!
      </footer>

      <CartDrawer />
    </main>
  );
}

export default CardapioPage;
