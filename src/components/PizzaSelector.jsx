import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../lib/api.js";

const crusts = [
  { id: "TRADICIONAL", label: "Tradicional", extra: 0 },
  { id: "CATUPIRY", label: "Recheada Catupiry", extra: 8 },
  { id: "CHEDDAR", label: "Recheada Cheddar", extra: 10 },
];

const SIZE_LABEL = {
  PEQUENA: "Pequena",
  MEDIA: "Media",
  GRANDE: "Grande",
  FAMILIA: "Familia",
};

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PizzaSelector() {
  const { addItem, openCart } = useCart();
  const [selectedSizeKey, setSelectedSizeKey] = useState("GRANDE");
  const [crust, setCrust] = useState(crusts[0]);
  const [selectedFlavors, setSelectedFlavors] = useState([]);

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

  const sizeOptions = useMemo(() => {
    if (!products.length) return [];
    return (products[0].sizes ?? []).map((s) => ({
      id: s.size,
      label: SIZE_LABEL[s.size] ?? s.size,
    }));
  }, [products]);

  const selectedSize =
    sizeOptions.find((s) => s.id === selectedSizeKey) ?? sizeOptions[0];

  const isHalfHalf = selectedFlavors.length === 2;

  const getProductPrice = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    const sizeEntry = product.sizes?.find((s) => s.size === selectedSizeKey);
    return sizeEntry ? Number(sizeEntry.price) : 0;
  };

  const pizzaPrice = useMemo(() => {
    if (!selectedFlavors.length) return 0;
    const prices = selectedFlavors.map(getProductPrice);
    const basePrice = isHalfHalf ? Math.max(...prices) : prices[0];
    return Math.round((basePrice + crust.extra) * 100) / 100;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlavors, selectedSizeKey, crust, isHalfHalf, products]);

  const description = useMemo(() => {
    if (!selectedFlavors.length) return "Escolha seus sabores";
    const names = selectedFlavors
      .map((id) => products.find((p) => p.id === id)?.name)
      .filter(Boolean);
    return names.join(" / ");
  }, [selectedFlavors, products]);

  const toggleFlavor = (productId) => {
    setSelectedFlavors((prev) => {
      if (prev.includes(productId))
        return prev.filter((id) => id !== productId);
      if (prev.length >= 2) return prev;
      return [...prev, productId];
    });
  };

  const handleAddToCart = () => {
    if (!selectedFlavors.length || !selectedSize) return;
    const key = `${selectedSize.id}-${crust.id}-${[...selectedFlavors].sort().join("-")}`;
    addItem({
      key,
      title: isHalfHalf ? "Pizza Meio a Meio" : "Pizza Inteira",
      description: `${description} | ${selectedSize.label} | ${crust.label}`,
      price: pizzaPrice,
      quantity: 1,
      payload: {
        type: isHalfHalf ? "MEIO_A_MEIO" : "INTEIRA",
        size: selectedSize.id,
        crust: crust.id,
        flavors: selectedFlavors,
      },
    });
    openCart();
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-1/3 rounded bg-gray-100" />
          <div className="h-4 w-2/3 rounded bg-gray-100" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-50" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !products.length) {
    return (
      <section className="rounded-3xl border border-red-100 bg-red-50/40 p-6 shadow-sm">
        <p className="text-center text-gray-500">
          Nao foi possivel carregar os sabores. Tente novamente.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <header className="mb-5">
        <h2 className="font-display text-2xl text-gray-900 sm:text-3xl">
          Monte sua Pizza
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Escolha tamanho, borda e até 2 sabores
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Tamanho
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {sizeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedSizeKey(option.id)}
                className={`rounded-xl border py-3 text-sm font-semibold transition-all duration-200 ${
                  selectedSizeKey === option.id
                    ? "border-rosso bg-rosso/8 text-rosso ring-1 ring-rosso/30"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-rosso/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Borda
          </p>
          <div className="grid grid-cols-3 gap-2">
            {crusts.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCrust(option)}
                className={`rounded-xl border px-3 py-3 text-left text-xs transition-all duration-200 sm:text-sm ${
                  crust.id === option.id
                    ? "border-rosso bg-rosso/8 text-gray-900 ring-1 ring-rosso/30"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-rosso/40"
                }`}
              >
                <span className="block font-semibold">{option.label}</span>
                {option.extra > 0 && (
                  <span className="text-[10px] text-gold">
                    +{formatCurrency(option.extra)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Sabores
            </p>
            <p className="text-xs font-bold text-rosso">
              {selectedFlavors.length}/2
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product) => {
              const selected = selectedFlavors.includes(product.id);
              const blocked = !selected && selectedFlavors.length === 2;
              const priceForSize = getProductPrice(product.id);

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleFlavor(product.id)}
                  disabled={blocked}
                  className={`rounded-2xl border text-left transition-all duration-200 overflow-hidden ${
                    selected
                      ? "border-rosso ring-2 ring-rosso/20 bg-rose-50 text-gray-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-rosso/30 hover:shadow-sm"
                  } ${blocked ? "opacity-40" : "opacity-100"}`}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-32 w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="min-w-0">
                      <span className="block font-semibold text-sm leading-tight">
                        {product.name}
                      </span>
                      {product.description && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-2 shrink-0 text-xs font-bold text-rosso">
                      {formatCurrency(priceForSize)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
        <p className="text-sm text-gray-400">{description}</p>
        <p className="mt-1 text-3xl font-bold text-rosso">
          {formatCurrency(pizzaPrice)}
        </p>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedFlavors.length}
          className="mt-4 w-full rounded-2xl bg-rosso px-5 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-ember hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar ao Carrinho
        </button>
      </footer>
    </section>
  );
}

export default PizzaSelector;
