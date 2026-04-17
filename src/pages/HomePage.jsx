import { Link } from "react-router-dom";
import CartDrawer from "../components/CartDrawer.jsx";
import PizzaSelector from "../components/PizzaSelector.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";

function HomePage() {
  const { openCart, items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-ink bg-texture pb-24 text-cream">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="rounded-xl bg-white px-3 py-1.5 shadow-md">
          <img
            src="/logo-fellice.png"
            alt="Pizzaria Fellice"
            className="h-9 w-auto sm:h-11"
          />
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                className="rounded-xl border border-cream/10 px-3 py-2 text-xs sm:text-sm"
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

        <div className="rounded-3xl border border-ember/20 bg-gradient-to-b from-amber-50 to-orange-50 p-5">
          <h2 className="font-display text-2xl text-gold">Sabores da Semana</h2>
          <p className="mt-2 text-sm text-smoke">
            27 anos de tradicao italiana em cada fatia, com massa de fermentacao
            lenta e ingredientes selecionados.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-cream/90">
            <li>• Mussarela de bufala com manjericao fresco</li>
            <li>• Calabresa artesanal com cebola caramelizada</li>
            <li>• Borda recheada de catupiry trufado</li>
          </ul>

          <p className="mt-5 text-center font-script text-lg text-gold/80 italic">
            O seu momento de ser feliz!
          </p>

          <button
            type="button"
            onClick={openCart}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-gold to-amber-400 px-5 py-4 text-base font-extrabold text-black"
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
