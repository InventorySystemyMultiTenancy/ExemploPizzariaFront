import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../lib/api.js";
import {
  buildPizzaDescription,
  getPizzaBasePrice,
  indexProductsById,
  SIZE_LABEL,
} from "../lib/pizzaBuilder.js";

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PizzaSelector() {
  const { addItem, openCart } = useCart();
  const [selectedSizeKey, setSelectedSizeKey] = useState("GRANDE");
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

  const flavorProducts = useMemo(
    () => products.filter((product) => !product.isCrust),
    [products],
  );
  const productsById = useMemo(
    () => indexProductsById(flavorProducts),
    [flavorProducts],
  );

  const sizeOptions = useMemo(() => {
    if (!flavorProducts.length) return [];
    return (flavorProducts[0].sizes ?? []).map((sizeEntry) => ({
      id: sizeEntry.size,
      label: SIZE_LABEL[sizeEntry.size] ?? sizeEntry.size,
    }));
  }, [flavorProducts]);

  const selectedSize =
    sizeOptions.find((option) => option.id === selectedSizeKey) ??
    sizeOptions[0];
  const maxFlavors = 2;

  const pizzaBasePrice = useMemo(
    () =>
      getPizzaBasePrice({
        productsById,
        flavorIds: selectedFlavors,
        size: selectedSizeKey,
        type: "MEIO_A_MEIO",
      }),
    [productsById, selectedFlavors, selectedSizeKey],
  );

  const description = useMemo(
    () =>
      buildPizzaDescription({
        productsById,
        flavorIds: selectedFlavors,
        size: selectedSizeKey,
      }),
    [productsById, selectedFlavors, selectedSizeKey],
  );

  const toggleFlavor = (productId) => {
    setSelectedFlavors((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length >= maxFlavors) {
        return prev;
      }

      return [...prev, productId];
    });
  };

  const handleAddToCart = () => {
    if (selectedFlavors.length !== 2 || !selectedSize) return;
    const flavorKey = [...selectedFlavors].sort().join("-");

    addItem({
      key: `MEIO_A_MEIO-${selectedSize.id}-${flavorKey}`,
      title: "Pizza Meio a Meio",
      description,
      basePrice: pizzaBasePrice,
      price: pizzaBasePrice,
      quantity: 1,
      payload: {
        type: "MEIO_A_MEIO",
        size: selectedSize.id,
        crustProductId: undefined,
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
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-gray-50" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !flavorProducts.length) {
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
          Escolha o tamanho e os 2 sabores. O preco sera sempre o da pizza maior.
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
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Sabores
            </p>
            <p className="text-xs font-bold text-rosso">
              {selectedFlavors.length}/{maxFlavors}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {flavorProducts.map((product) => {
              const selected = selectedFlavors.includes(product.id);
              const blocked = !selected && selectedFlavors.length === maxFlavors;
              const priceForSize = getPizzaBasePrice({
                productsById,
                flavorIds: [product.id],
                size: selectedSizeKey,
                type: "INTEIRA",
              });

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleFlavor(product.id)}
                  disabled={blocked}
                  className={`overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                    selected
                      ? "border-rosso bg-rose-50 text-gray-900 ring-2 ring-rosso/20"
                      : "border-gray-200 bg-white text-gray-700 hover:border-rosso/30 hover:shadow-sm"
                  } ${blocked ? "opacity-40" : "opacity-100"}`}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-32 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight">
                        {product.name}
                      </span>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
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
        <p className="mt-2 text-3xl font-bold text-rosso">
          {formatCurrency(pizzaBasePrice)}
        </p>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={selectedFlavors.length !== 2}
          className="mt-4 w-full rounded-2xl bg-rosso px-5 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-ember disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar ao Carrinho
        </button>
      </footer>
    </section>
  );
}

export default PizzaSelector;
