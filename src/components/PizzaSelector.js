import { useMemo, useState } from "react";
import { useCart } from "../context/CartContext.js";

const sizes = [
  { id: "PEQUENA", label: "Pequena", multiplier: 1 },
  { id: "MEDIA", label: "Media", multiplier: 1.25 },
  { id: "GRANDE", label: "Grande", multiplier: 1.45 },
  { id: "FAMILIA", label: "Familia", multiplier: 1.8 }
];

const crusts = [
  { id: "TRADICIONAL", label: "Tradicional", extra: 0 },
  { id: "CATUPIRY", label: "Recheada Catupiry", extra: 8 },
  { id: "CHEDDAR", label: "Recheada Cheddar", extra: 10 }
];

const flavors = [
  { id: "calabresa", name: "Calabresa Imperial", price: 36 },
  { id: "frango", name: "Frango Xadrez", price: 39 },
  { id: "marguerita", name: "Marguerita Dragao", price: 34 },
  { id: "pepperoni", name: "Pepperoni de Hong Kong", price: 42 },
  { id: "quatro-queijos", name: "4 Queijos de Jade", price: 44 }
];

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PizzaSelector() {
  const { addItem, openCart } = useCart();
  const [size, setSize] = useState(sizes[2]);
  const [crust, setCrust] = useState(crusts[0]);
  const [selectedFlavors, setSelectedFlavors] = useState([]);

  const isHalfHalf = selectedFlavors.length === 2;

  const pizzaPrice = useMemo(() => {
    if (!selectedFlavors.length) {
      return 0;
    }

    const flavorPrices = selectedFlavors.map((flavorId) =>
      flavors.find((flavor) => flavor.id === flavorId)
    );

    const baseFlavor = isHalfHalf
      ? Math.max(...flavorPrices.map((flavor) => flavor.price))
      : flavorPrices[0].price;

    return Math.round((baseFlavor * size.multiplier + crust.extra) * 100) / 100;
  }, [selectedFlavors, size, crust, isHalfHalf]);

  const description = useMemo(() => {
    if (!selectedFlavors.length) {
      return "Escolha seus sabores";
    }

    const names = selectedFlavors
      .map((id) => flavors.find((flavor) => flavor.id === id)?.name)
      .filter(Boolean);

    return names.join(" / ");
  }, [selectedFlavors]);

  const toggleFlavor = (flavorId) => {
    setSelectedFlavors((prev) => {
      if (prev.includes(flavorId)) {
        return prev.filter((id) => id !== flavorId);
      }

      if (prev.length >= 2) {
        return prev;
      }

      return [...prev, flavorId];
    });
  };

  const handleAddToCart = () => {
    if (!selectedFlavors.length) {
      return;
    }

    const key = `${size.id}-${crust.id}-${selectedFlavors.sort().join("-")}`;

    addItem({
      key,
      title: isHalfHalf ? "Pizza Meio a Meio" : "Pizza Inteira",
      description: `${description} | ${size.label} | ${crust.label}`,
      price: pizzaPrice,
      quantity: 1,
      payload: {
        type: isHalfHalf ? "MEIO_A_MEIO" : "INTEIRA",
        size: size.id,
        crust: crust.id,
        flavors: selectedFlavors
      }
    });

    openCart();
  };

  return (
    <section className="rounded-3xl border border-gold/20 bg-lacquer/70 p-4 shadow-glow sm:p-6">
      <header className="mb-4">
        <h2 className="font-display text-xl text-gold sm:text-2xl">Monte sua Pizza</h2>
        <p className="mt-1 text-sm text-smoke">Tamanho -> Borda -> Sabores (maximo 2)</p>
      </header>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">Tamanho</p>
          <div className="grid grid-cols-2 gap-2">
            {sizes.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSize(option)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  size.id === option.id
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-white/10 bg-black/20 text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">Borda</p>
          <div className="grid gap-2">
            {crusts.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCrust(option)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  crust.id === option.id
                    ? "border-ember bg-ember/20 text-white"
                    : "border-white/10 bg-black/20 text-smoke"
                }`}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="ml-2 text-xs text-gold">+{formatCurrency(option.extra)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-smoke">Sabores</p>
            <p className="text-xs text-gold">{selectedFlavors.length}/2</p>
          </div>
          <div className="grid gap-2">
            {flavors.map((flavor) => {
              const selected = selectedFlavors.includes(flavor.id);
              const blocked = !selected && selectedFlavors.length === 2;

              return (
                <button
                  key={flavor.id}
                  type="button"
                  onClick={() => toggleFlavor(flavor.id)}
                  disabled={blocked}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-gold bg-gold/15 text-white"
                      : "border-white/10 bg-black/20 text-smoke"
                  } ${blocked ? "opacity-45" : "opacity-100"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{flavor.name}</span>
                    <span className="text-sm text-gold">{formatCurrency(flavor.price)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-6 rounded-2xl border border-gold/25 bg-black/30 p-4">
        <p className="text-sm text-smoke">{description}</p>
        <p className="mt-2 text-2xl font-bold text-gold">{formatCurrency(pizzaPrice)}</p>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedFlavors.length}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-ember to-red-500 px-5 py-4 text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar ao Carrinho
        </button>
      </footer>
    </section>
  );
}

export default PizzaSelector;
