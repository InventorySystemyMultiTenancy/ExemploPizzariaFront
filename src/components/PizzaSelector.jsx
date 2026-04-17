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
      <section className="rounded-3xl border border-gold/20 bg-lacquer/70 p-6 shadow-glow">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-1/3 rounded bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-2xl bg-gray-50" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !products.length) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-lacquer/70 p-6 shadow-glow">
        <p className="text-center text-smoke">
          Nao foi possivel carregar os sabores. Tente novamente.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gold/20 bg-lacquer/70 p-4 shadow-glow sm:p-6">
      <header className="mb-4">
        <h2 className="font-display text-xl text-gold sm:text-2xl">
          Monte sua Pizza
        </h2>
        <p className="mt-1 text-sm text-smoke">
          Tamanho - Borda - Sabores (maximo 2)
        </p>
      </header>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">
            Tamanho
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedSizeKey(option.id)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  selectedSizeKey === option.id
                    ? "scale-[1.02] border-gold bg-gold/15 text-gold"
                    : "border-gray-200 bg-gray-50 text-gray-900 hover:border-gold/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">
            Borda
          </p>
          <div className="grid gap-2">
            {crusts.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCrust(option)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                  crust.id === option.id
                    ? "border-ember bg-ember/20 text-gray-900"
                    : "border-gray-200 bg-gray-50 text-smoke hover:border-ember/40"
                }`}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="ml-2 text-xs text-gold">
                  +{formatCurrency(option.extra)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-smoke">
              Sabores
            </p>
            <p className="text-xs text-gold">{selectedFlavors.length}/2</p>
          </div>
          <div className="grid gap-2">
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
                      ? "scale-[1.01] border-gold bg-gold/15 text-gray-900"
                      : "border-gray-200 bg-gray-50 text-smoke hover:border-gold/30"
                  } ${blocked ? "opacity-45" : "opacity-100"}`}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-28 w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <span className="font-semibold">{product.name}</span>
                      {product.description && (
                        <p className="mt-0.5 text-xs opacity-60 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-3 shrink-0 text-sm text-gold">
                      {formatCurrency(priceForSize)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-6 rounded-2xl border border-gold/25 bg-gray-100 p-4">
        <p className="text-sm text-smoke">{description}</p>
        <p className="mt-2 text-2xl font-bold text-gold">
          {formatCurrency(pizzaPrice)}
        </p>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedFlavors.length}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-ember to-red-500 px-5 py-4 text-base font-bold text-white transition-all duration-200 hover:scale-[1.01] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar ao Carrinho
        </button>
      </footer>
    </section>
  );
}

export default PizzaSelector;
