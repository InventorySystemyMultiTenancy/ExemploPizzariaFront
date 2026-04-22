import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext.jsx";

const CartContext = createContext(null);

const FREIGHT_BASE = 0;

const currency = (value) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function storageKey(userId) {
  return userId ? `pizzaria_cart_${userId}` : "pizzaria_cart_guest";
}

function loadCartFromStorage(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const userId = user?.id ?? null;

  const [items, setItems] = useState(() => loadCartFromStorage(userId));
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Quando o usuário mudar (login/logout), carrega o carrinho do novo usuário
  useEffect(() => {
    setItems(loadCartFromStorage(userId));
  }, [userId]);

  // Persiste o carrinho no localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  }, [items, userId]);

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

  const updateItem = (key, updater) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? typeof updater === "function"
            ? updater(item)
            : { ...item, ...updater }
          : item,
      ),
    );
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
      updateItem,
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
