import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import {
  buildPizzaDescription,
  getPizzaBasePrice,
  getPizzaPrice,
  indexProductsById,
} from "../lib/pizzaBuilder.js";

// ─── Categoria helpers ─────────────────────────────────────────────────────────
const DRINK_KW = [
  "bebida",
  "refrigerante",
  "suco",
  "água",
  "agua",
  "coca",
  "pepsi",
  "guaraná",
  "guarana",
  "cerveja",
  "drink",
];
const DESSERT_KW = [
  "sobremesa",
  "doce",
  "chocolate",
  "brotinho",
  "nutella",
  "brigadeiro",
  "brownie",
  "sorvete",
  "pudim",
];
const PIZZA_KW = ["pizza", "salgada"];

function getProductCategory(product) {
  const cat = (product?.category ?? "").toLowerCase();
  if (DRINK_KW.some((k) => cat.includes(k))) return "drink";
  if (DESSERT_KW.some((k) => cat.includes(k))) return "dessert";
  if (PIZZA_KW.some((k) => cat.includes(k))) return "pizza";
  return "other";
}

const SIZE_ORDER = ["PEQUENA", "MEDIA", "GRANDE", "FAMILIA"];
function cheapestSize(product) {
  if (!product?.sizes?.length) return null;
  return [...product.sizes].sort(
    (a, b) =>
      SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size) ||
      Number(a.price) - Number(b.price),
  )[0];
}

// ─── Engine de sugestão ────────────────────────────────────────────────────────
function buildSuggestion(items, products) {
  if (!items.length || !products.length) return null;

  const nonCrust = products.filter((p) => !p.isCrust);
  const byId = Object.fromEntries(nonCrust.map((p) => [p.id, p]));

  // Categorias presentes no carrinho
  const cartProductIds = items.flatMap((item) => item.payload?.flavors ?? []);
  const cartCategories = new Set(
    cartProductIds.map((id) => getProductCategory(byId[id])),
  );

  // Se não tem produto mapeado ainda, inferir pelo título do item (fallback)
  const hasPizza =
    cartCategories.has("pizza") ||
    cartCategories.has("other") ||
    items.some(
      (i) => i.payload?.type === "INTEIRA" || i.payload?.type === "MEIO_A_MEIO",
    );
  const hasDrink = cartCategories.has("drink");
  const hasDessert = cartCategories.has("dessert");

  // Cross-sell 1: tem pizza, não tem bebida
  if (hasPizza && !hasDrink) {
    const drinks = nonCrust.filter(
      (p) => getProductCategory(p) === "drink" && p.isActive !== false,
    );
    if (drinks.length) {
      const pick = drinks[Math.floor(Math.random() * drinks.length)];
      const size = cheapestSize(pick);
      const price = size ? Number(size.price) : null;
      const priceLabel =
        price != null
          ? price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "";
      const msgs = [
        `Pizza sem bebida? 🥤 Adicione ${pick.name}${priceLabel ? ` por ${priceLabel}` : ""} e mata a sede!`,
        `Sua pizza tá chegando... 🍕 Que tal um ${pick.name} geladinho pra acompanhar?`,
        `Combinação perfeita! 🔥 Adicione ${pick.name} com um clique e vai ser outro nível.`,
      ];
      return {
        mensagem: msgs[Math.floor(Math.random() * msgs.length)],
        sugestao_nome: pick.name,
        sugestao_id: pick.id,
        tipo_gatilho: "bebida",
        product: pick,
        size,
      };
    }
  }

  // Cross-sell 2: tem pizza e bebida, não tem sobremesa
  if (hasPizza && hasDrink && !hasDessert) {
    const desserts = nonCrust.filter(
      (p) => getProductCategory(p) === "dessert" && p.isActive !== false,
    );
    if (desserts.length) {
      const pick = desserts[Math.floor(Math.random() * desserts.length)];
      const size = cheapestSize(pick);
      const price = size ? Number(size.price) : null;
      const priceLabel =
        price != null
          ? price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "";
      const msgs = [
        `Falta o toque final! ✨ ${pick.name}${priceLabel ? ` por ${priceLabel}` : ""} pra adoçar sua noite. 🍫`,
        `Pedido quase perfeito... 😋 Fecha com ${pick.name} e vai ser memorável!`,
        `Chave de ouro! 🏆 Adicione ${pick.name} e complete o combo dos sonhos.`,
      ];
      return {
        mensagem: msgs[Math.floor(Math.random() * msgs.length)],
        sugestao_nome: pick.name,
        sugestao_id: pick.id,
        tipo_gatilho: "doce",
        product: pick,
        size,
      };
    }
  }

  return null;
}

// ─── Banner de sugestão ────────────────────────────────────────────────────────
const TIPO_COLORS = {
  bebida: "from-sky-500/10 to-blue-500/5 border-sky-400/40",
  doce: "from-amber-500/10 to-yellow-400/5 border-amber-400/40",
  repeticao: "from-gold/10 to-amber-300/5 border-gold/40",
  novidade: "from-emerald-500/10 to-green-400/5 border-emerald-400/40",
};

function SuggestionBanner({ suggestion, onAdd, adding, onDismiss }) {
  if (!suggestion) return null;
  const gradient = TIPO_COLORS[suggestion.tipo_gatilho] ?? TIPO_COLORS.novidade;
  const priceLabel = suggestion.size
    ? Number(suggestion.size.price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : null;

  return (
    <div
      className={`relative mb-3 rounded-2xl border bg-gradient-to-br ${gradient} p-3`}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
        aria-label="Fechar sugestão"
      >
        ✕
      </button>
      <p className="pr-5 text-sm font-medium leading-snug text-gray-800">
        {suggestion.mensagem}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-gray-700">
            {suggestion.sugestao_nome}
          </span>
          {priceLabel && (
            <span className="ml-1 text-xs text-smoke">{priceLabel}</span>
          )}
        </div>
        <button
          type="button"
          disabled={adding}
          onClick={onAdd}
          className="flex min-w-[110px] items-center justify-center rounded-xl bg-rosso px-3 py-2 text-xs font-bold text-white transition hover:bg-ember disabled:opacity-60"
        >
          {adding ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "＋ Adicionar"
          )}
        </button>
      </div>
    </div>
  );
}

function CartDrawer() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    items,
    isCartOpen,
    closeCart,
    addItem,
    updateItem,
    updateQuantity,
    removeItem,
    formatted,
    total,
  } = useCart();

  const [addingSuggestion, setAddingSuggestion] = useState(false);
  const [dismissed, setDismissed] = useState(null); // sugestao_id descartada

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products");
      return response.data?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const crusts = products.filter((product) => product.isCrust);
  const flavorsById = indexProductsById(
    products.filter((product) => !product.isCrust),
  );
  const crustsById = indexProductsById(crusts);

  // ── Sugestão de upsell/cross-sell ──────────────────────────────────────────
  const suggestion = useMemo(
    () => buildSuggestion(items, products),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length, products.length],
  );
  const activeSuggestion =
    suggestion && suggestion.sugestao_id !== dismissed ? suggestion : null;

  const handleAddSuggestion = async () => {
    if (!activeSuggestion?.product || !activeSuggestion?.size) return;
    setAddingSuggestion(true);
    await new Promise((r) => setTimeout(r, 400)); // micro-delay UX
    const { product, size } = activeSuggestion;
    addItem({
      key: `${product.id}-${size.size}`,
      title: product.name,
      description: size.size,
      basePrice: Number(size.price),
      price: Number(size.price),
      quantity: 1,
      payload: {
        type: "INTEIRA",
        size: size.size,
        crustProductId: undefined,
        flavors: [product.id],
      },
    });
    setDismissed(product.id);
    setAddingSuggestion(false);
  };

  const handleCrustChange = (item, crustProductId) => {
    const flavorIds = item.payload?.flavors ?? [];
    const size = item.payload?.size;
    const type = item.payload?.type ?? "INTEIRA";

    if (!size || !flavorIds.length) return;

    const nextCrustProductId = crustProductId || undefined;
    const basePrice =
      item.basePrice ??
      getPizzaBasePrice({
        productsById: flavorsById,
        flavorIds,
        size,
        type,
      });

    const price = getPizzaPrice({
      productsById: flavorsById,
      crustsById,
      flavorIds,
      size,
      type,
      crustProductId: nextCrustProductId,
    });

    updateItem(item.key, {
      basePrice,
      price,
      description: buildPizzaDescription({
        productsById: flavorsById,
        crustsById,
        flavorIds,
        size,
        crustProductId: nextCrustProductId,
      }),
      payload: {
        ...item.payload,
        crustProductId: nextCrustProductId,
      },
    });
  };

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
          <SuggestionBanner
            suggestion={activeSuggestion}
            adding={addingSuggestion}
            onAdd={handleAddSuggestion}
            onDismiss={() => setDismissed(activeSuggestion?.sugestao_id)}
          />
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

                {item.payload?.size && item.payload?.flavors?.length ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-smoke">
                      Borda recheada
                    </label>
                    <select
                      value={item.payload?.crustProductId ?? ""}
                      onChange={(event) =>
                        handleCrustChange(item, event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gold/40"
                    >
                      <option value="">Sem borda</option>
                      {crusts.map((crust) => (
                        <option key={crust.id} value={crust.id}>
                          {crust.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-smoke">
                    Observação
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: sem cebola, sem azeitona..."
                    value={item.notes ?? ""}
                    onChange={(e) =>
                      updateItem(item.key, {
                        notes: e.target.value || undefined,
                      })
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gold/40"
                  />
                </div>

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
              if (user?.role === "MESA") {
                navigate("/mesa/checkout");
              } else if (!isAuthenticated) {
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
