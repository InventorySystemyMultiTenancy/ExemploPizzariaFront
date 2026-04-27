import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import CartDrawer from "../components/CartDrawer.jsx";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import { useTranslation } from "../context/I18nContext.jsx";

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
function SizePickerModal({ product, pendingHalf, onSetPendingHalf, onClose }) {
  const { addItem, openCart } = useCart();
  const { t } = useTranslation();
  const SIZE_MAP = {
    PEQUENA: t("SIZE_BROTO", "Broto"),
    GRANDE: t("SIZE_GRANDE", "Grande"),
  };
  const prices = (product.sizes ?? []).filter(Boolean);
  const pendingMode = Boolean(pendingHalf);
  const [selectedSize, setSelectedSize] = useState(
    pendingHalf?.size ??
      prices.find((s) => s.size === "GRANDE")?.size ??
      prices[0]?.size ??
      "GRANDE",
  );
  const [selectionType, setSelectionType] = useState(
    pendingMode ? "METADE" : "INTEIRA",
  );

  useEffect(() => {
    if (!pendingHalf) return;
    setSelectedSize(pendingHalf.size);
    setSelectionType("METADE");
  }, [pendingHalf]);

  const selectedEntry = prices.find((s) => s.size === selectedSize);
  const selectedPrice = Number(selectedEntry?.price ?? 0);

  const selectedMode = pendingMode ? "METADE" : selectionType;

  const handleAdd = () => {
    if (!selectedEntry) return;

    if (selectedMode === "INTEIRA") {
      addItem({
        key: `${product.id}-${selectedSize}`,
        title: product.name,
        description: `${SIZE_MAP[selectedSize] ?? selectedSize}`,
        basePrice: Number(selectedEntry.price),
        price: Number(selectedEntry.price),
        quantity: 1,
        payload: {
          type: "INTEIRA",
          size: selectedSize,
          crustProductId: undefined,
          flavors: [product.id],
        },
      });
      openCart();
      onClose();
      return;
    }

    if (!pendingHalf) {
      onSetPendingHalf({
        productId: product.id,
        productName: product.name,
        size: selectedSize,
        price: selectedPrice,
      });
      toast.success(
        t(
          "FIRST_HALF_SAVED",
          "Primeira metade salva. Escolha o próximo sabor.",
        ),
      );
      onClose();
      return;
    }

    if (pendingHalf.productId === product.id) {
      toast.error("Escolha um sabor diferente para completar a outra metade.");
      return;
    }

    const flavorIds = [pendingHalf.productId, product.id];
    const flavorNames = [pendingHalf.productName, product.name];
    const flavorKey = [...flavorIds].sort().join("-");
    const finalPrice = Math.max(pendingHalf.price, selectedPrice);

    addItem({
      key: `MEIO_A_MEIO-${pendingHalf.size}-${flavorKey}`,
      title: t("PIZZA_HALF_HALF", "Pizza Meio a Meio"),
      description: `${flavorNames.join(" / ")} | ${SIZE_MAP[pendingHalf.size] ?? pendingHalf.size}`,
      basePrice: finalPrice,
      price: finalPrice,
      quantity: 1,
      payload: {
        type: "MEIO_A_MEIO",
        size: pendingHalf.size,
        crustProductId: undefined,
        flavors: flavorIds,
      },
    });

    onSetPendingHalf(null);
    toast.success(
      t("PIZZA_HALF_HALF", "Pizza Meio a Meio") + " adicionada ao carrinho.",
    );
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

        <div className="mb-3 grid grid-cols-2 gap-2">
          {[
            { id: "INTEIRA", label: t("SIZE_INTEIRA", "Inteira") },
            { id: "METADE", label: t("SIZE_METADE", "Metade") },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectionType(option.id)}
              disabled={pendingMode}
              className={`rounded-2xl border py-2.5 text-sm font-semibold transition-all ${
                selectedMode === option.id
                  ? "border-rosso bg-rosso text-white shadow"
                  : "border-gray-200 text-gray-600 hover:border-rosso/40"
              } ${pendingMode ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {pendingMode && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Primeira metade: <strong>{pendingHalf.productName}</strong> (
            {SIZE_MAP[pendingHalf.size] ?? pendingHalf.size}). Esta seleção
            completará a outra metade.
          </div>
        )}

        <div className="flex gap-2">
          {prices.map((s) => (
            <button
              key={s.size}
              type="button"
              onClick={() => setSelectedSize(s.size)}
              disabled={pendingMode && s.size !== pendingHalf?.size}
              className={`flex-1 rounded-2xl border py-3.5 text-sm font-semibold transition-all ${
                selectedSize === s.size
                  ? "border-rosso bg-rosso text-white shadow-md"
                  : "border-gray-200 text-gray-700 hover:border-rosso/40"
              } ${pendingMode && s.size !== pendingHalf?.size ? "cursor-not-allowed opacity-40" : ""}`}
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
          {selectedMode === "METADE" && !pendingHalf
            ? t("BTN_SAVE_FIRST_HALF", "Salvar primeira metade")
            : selectedMode === "METADE"
              ? t("BTN_COMPLETE_HALF", "Completar meio a meio")
              : t("BTN_ADD_CART", "Adicionar ao Carrinho")}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm text-gray-400 transition hover:text-gray-600"
        >
          {t("BTN_CANCEL", "Cancelar")}
        </button>
      </div>
    </div>
  );
}

/* ─── Product Card ──────────────────────────────────────────── */
function MenuCard({ product, pendingHalf, onSetPendingHalf }) {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();
  const SIZE_MAP = {
    PEQUENA: t("SIZE_BROTO", "Broto"),
    GRANDE: t("SIZE_GRANDE", "Grande"),
  };
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
          pendingHalf={pendingHalf}
          onSetPendingHalf={onSetPendingHalf}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [pendingHalf, setPendingHalf] = useState(null);
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: mesaOrders = [] } = useQuery({
    queryKey: ["mesa-orders"],
    queryFn: async () => {
      const res = await api.get("/mesa/orders");
      return res.data?.data ?? [];
    },
    enabled: user?.role === "MESA",
    refetchInterval: 30000,
  });

  const pendingTotal =
    user?.role === "MESA"
      ? mesaOrders
          .filter(
            (o) => o.paymentStatus !== "APROVADO" && o.status !== "CANCELADO",
          )
          .reduce((acc, o) => acc + Number(o.total), 0)
      : 0;

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

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const res = await api.get("/products/top?limit=4");
      return res.data?.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const categories = [
    t("CARDAPIO_CAT_ALL", "Todos"),
    ...Array.from(
      new Set(
        products
          .filter((product) => !product.isCrust)
          .map((p) => p.category ?? "Geral")
          .filter(Boolean),
      ),
    ),
  ];

  const flavorProducts = products.filter((product) => !product.isCrust);
  const normalizedSearch = search.trim().toLowerCase();
  const ALL_LABEL = t("CARDAPIO_CAT_ALL", "Todos");
  const filtered =
    activeCategory === ALL_LABEL || activeCategory === "Todos"
      ? flavorProducts
      : flavorProducts.filter(
          (p) => (p.category ?? "Geral") === activeCategory,
        );
  const searched = normalizedSearch
    ? filtered.filter((product) =>
        [product.name, product.description, product.category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
    : filtered;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Sticky Nav */}
      <Navbar activeLink="cardapio" />

      {/* Page header */}
      <div className="border-b border-gray-100 bg-gray-50/60 py-7 text-center">
        <p className="font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold">
          {t("CARDAPIO_SINCE", "Desde 1997 · 27 anos de tradição")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
          {t("CARDAPIO_TITLE", "Nosso Cardápio")}
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

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-8">
        <div className="mt-1">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            {t("CARDAPIO_SEARCH_LABEL", "Buscar no cardápio")}
          </label>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              "CARDAPIO_SEARCH_PH",
              "Ex: calabresa, frango, doce...",
            )}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-rosso/40"
          />
        </div>

        {pendingHalf && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-900">
              Primeira metade selecionada:{" "}
              <strong>{pendingHalf.productName}</strong> (
              {SIZE_MAP[pendingHalf.size] ?? pendingHalf.size}). Escolha a
              próxima pizza para completar.
            </p>
            <button
              type="button"
              onClick={() => setPendingHalf(null)}
              className="shrink-0 rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {t("CANCEL_HALF", "Cancelar metade")}
            </button>
          </div>
        )}
      </section>

      {/* Product grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {!isLoading && !isError && topProducts.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-[0.65rem] uppercase tracking-[0.35em] text-gold">
                  Favoritas da casa
                </p>
                <h2 className="mt-1 font-display text-2xl text-gray-900">
                  Mais Pedidas
                </h2>
              </div>
              <p className="text-xs text-gray-400">
                Os sabores que mais saem no momento
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {topProducts.map((product) => (
                <MenuCard
                  key={`top-${product.id}`}
                  product={product}
                  pendingHalf={pendingHalf}
                  onSetPendingHalf={setPendingHalf}
                />
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
            {t(
              "CARDAPIO_ERROR",
              "Não foi possível carregar o cardápio. Tente novamente.",
            )}
          </p>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="py-16 text-center text-gray-400">
            {t("CARDAPIO_EMPTY_CAT", "Nenhum item nesta categoria.")}
          </p>
        )}

        {!isLoading &&
          !isError &&
          filtered.length > 0 &&
          searched.length === 0 && (
            <p className="py-16 text-center text-gray-400">
              {t("CARDAPIO_EMPTY_CAT", "Nenhum item nesta categoria.")}
            </p>
          )}

        {!isLoading && !isError && searched.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {searched.map((product) => (
              <MenuCard
                key={product.id}
                product={product}
                pendingHalf={pendingHalf}
                onSetPendingHalf={setPendingHalf}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        {t(
          "FOOTER_COPYRIGHT",
          "Pizzaria Fellice © 2024 · O seu momento de ser feliz!",
        )}
      </footer>

      {/* Banner fixo de pagamento pendente (só MESA) */}
      {pendingTotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <Link
            to="/mesa/checkout"
            className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500 px-5 py-4 shadow-2xl text-white font-semibold"
          >
            <span className="flex items-center gap-2 text-sm">
              💳 {t("CARDAPIO_PAYMENT_PENDING", "Pagamento pendente")}
            </span>
            <span className="text-base font-bold">
              {Number(pendingTotal).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </Link>
        </div>
      )}

      <CartDrawer />
    </main>
  );
}

export default CardapioPage;
