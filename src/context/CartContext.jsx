import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

const FREIGHT_BASE = 0;
const CART_STORAGE_KEY = "pizzaria_cart";

const currency = (value) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persiste o carrinho no localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.key === item.key);

      if (existing) {
        return prev.map((entry) =>
          entry.key === item.key
            ? { ...entry, quantity: entry.quantity + (item.quantity || 1) }
            : entry,
        );
      }

      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });

    toast.success("Pizza adicionada ao carrinho");
  };

  const updateQuantity = (key, quantity) => {
    setItems((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  );

  const freight = useMemo(() => {
    if (!subtotal) {
      return 0;
    }

    return 0;
  }, [subtotal, items.length]);

  const total = subtotal + freight;

  const value = useMemo(
    () => ({
      items,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      freight,
      total,
      formatted: {
        subtotal: currency(subtotal),
        freight: currency(freight),
        total: currency(total),
      },
    }),
    [items, isCartOpen, subtotal, freight, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }

  return context;
};
