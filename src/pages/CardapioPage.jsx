import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CartDrawer from "../components/CartDrawer.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";

const SIZE_MAP = {
  PEQUENA: "Broto",
  GRANDE: "Grande",
};

const fmt = (value) =>
  Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

/* ─── Size Picker Modal ─────────────────────────────────────── */
function SizePickerModal({ product, onClose }) {
  const { addItem, openCart } = useCart();
  const prices = (product.sizes ?? []).filter(
    (s) => s.size === "PEQUENA" || s.size === "GRANDE",
  );
  const [selectedSize, setSelectedSize] = useState(
    prices.find((s) => s.size === "GRANDE")?.size ??
      prices[0]?.size ??
      "GRANDE",
  );

  const selectedEntry = prices.find((s) => s.size === selectedSize);

  const handleAdd = () => {
    if (!selectedEntry) return;
    addItem({
      key: `${product.id}-${selectedSize}`,
      title: product.name,
      description: `${SIZE_MAP[selectedSize] ?? selectedSize}`,
      price: Number(selectedEntry.price),
      quantity: 1,
      payload: {
        type: "INTEIRA",
        size: selectedSize,
        crust: "TRADICIONAL",
        flavors: [product.id],
      },
    });
    openCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex gap-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
              🍕
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-tight text-gray-900">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {prices.map((s) => (
            <button
              key={s.size}
              type="button"
              onClick={() => setSelectedSize(s.size)}
              className={`flex-1 rounded-2xl border py-3.5 text-sm font-semibold transition-all ${
                selectedSize === s.size
                  ? "border-rosso bg-rosso text-white shadow-md"
                  : "border-gray-200 text-gray-700 hover:border-rosso/40"
              }`}
            >
              <span className="block">{SIZE_MAP[s.size] ?? s.size}</span>
              <span
                className={`mt-0.5 block text-xs ${selectedSize === s.size ? "text-white/80" : "text-gray-400"}`}
              >
                {fmt(s.price)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedEntry}
          className="mt-4 w-full rounded-2xl bg-rosso py-4 text-base font-bold text-white shadow-md transition hover:bg-ember disabled:opacity-40"
        >
          Adicionar ao Carrinho
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm text-gray-400 transition hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ─── Product Card ──────────────────────────────────────────── */
function MenuCard({ product }) {
  const [showModal, setShowModal] = useState(false);
  const brotPrice = product.sizes?.find((s) => s.size === "PEQUENA");
  const grandePrice = product.sizes?.find((s) => s.size === "GRANDE");

  return (
    <>
      <article
        className="flex cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-rosso/30 hover:shadow-md"
        onClick={() => setShowModal(true)}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-28 w-28 shrink-0 object-cover sm:w-36"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-gray-100 text-3xl sm:w-36">
            🍕
          </div>
        )}

        <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-gray-900 line-clamp-1 sm:text-[0.92rem]">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-end gap-4">
            {brotPrice && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Broto
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {fmt(brotPrice.price)}
                </p>
              </div>
            )}
            {grandePrice && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Grande
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {fmt(grandePrice.price)}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rosso text-lg font-bold text-white shadow-sm transition hover:bg-ember"
              aria-label="Adicionar"
            >
              +
            </button>
          </div>
        </div>
      </article>

      {showModal && (
        <SizePickerModal
          product={product}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await api.get("/products");
      return res.data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = [
    "Todos",
    ...Array.from(
      new Set(products.map((p) => p.category ?? "Geral").filter(Boolean)),
    ),
  ];

  const filtered =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => (p.category ?? "Geral") === activeCategory);

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
            <NavAuthLinks />
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="border-b border-gray-100 bg-gray-50/60 py-7 text-center">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold">
          Desde 1997 · 27 anos de tradição
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
          Nosso Cardápio
        </h1>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[61px] z-20 overflow-x-auto border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-8">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors sm:px-5 ${
                activeCategory === cat
                  ? "border-rosso text-rosso"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        )}

        {isError && (
          <p className="py-16 text-center text-gray-500">
            Não foi possível carregar o cardápio. Tente novamente.
          </p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="py-16 text-center text-gray-400">
            Nenhum item nesta categoria.
          </p>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((product) => (
              <MenuCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Pizzaria Fellice © 2024 · O seu momento de ser feliz!
      </footer>

      <CartDrawer />
    </main>
  );
}

function NavAuthLinks() {
  const { openCart, items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <>
      {isAuthenticated ? (
        <>
          <Link
            className="text-sm text-gray-500 transition-colors hover:text-rosso"
            to={
              user?.role === "ADMIN" || user?.role === "FUNCIONARIO"
                ? "/admin"
                : user?.role === "MOTOBOY"
                  ? "/motoboy"
                  : user?.role === "COZINHA"
                    ? "/cozinha"
                    : "/dashboard"
            }
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
    </>
  );
}

export default CardapioPage;
