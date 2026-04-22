import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const SIZES = ["PEQUENA", "GRANDE"];
const SIZE_LABEL = {
  PEQUENA: "Broto",
  GRANDE: "Grande",
};

const emptyForm = () => ({
  name: "",
  description: "",
  imageUrl: "",
  category: "",
  isCrust: false,
  sizes: SIZES.map((size) => ({ size, price: "", costPrice: "" })),
});

function ProductModal({ product, onClose, existingCategories = [] }) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState(() => {
    if (!isEdit) return emptyForm();
    return {
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      category: product.category ?? "",
      isCrust: Boolean(product.isCrust),
      sizes: SIZES.map((size) => {
        const existing = product.sizes?.find((s) => s.size === size);
        return {
          size,
          price: existing ? String(existing.price) : "",
          costPrice:
            existing?.costPrice != null ? String(existing.costPrice) : "",
        };
      }),
    };
  });

  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        const res = await api.put(`/admin/products/${product.id}`, payload);
        return res.data;
      }
      const res = await api.post("/admin/products", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(isEdit ? "Produto atualizado!" : "Produto criado!");
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Erro ao salvar produto");
    },
  });

  const setPrice = (size, field, value) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s) =>
        s.size === size ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Nome obrigatório";
    const filledSizes = form.sizes.filter((s) => s.price !== "");
    if (!filledSizes.length)
      errs.sizes = "Informe o preço de ao menos um tamanho";
    filledSizes.forEach(({ size, price, costPrice }) => {
      if (isNaN(Number(price)) || Number(price) <= 0)
        errs[`price_${size}`] = "Preço inválido";
      if (
        costPrice !== "" &&
        (isNaN(Number(costPrice)) || Number(costPrice) < 0)
      )
        errs[`cost_${size}`] = "Custo inválido";
    });
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl))
      errs.imageUrl = "URL inválida (deve começar com http)";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      category: form.category.trim() || undefined,
      isCrust: form.isCrust,
      sizes: form.sizes
        .filter((s) => s.price !== "")
        .map((s) => ({
          size: s.size,
          price: Number(s.price),
          ...(s.costPrice !== "" ? { costPrice: Number(s.costPrice) } : {}),
        })),
    };
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 my-auto w-full max-w-lg rounded-3xl border border-gold/20 bg-white p-6 shadow-2xl">
        <h2 className="font-display text-2xl text-gold">
          {isEdit ? "Editar Produto" : "Novo Produto"}
        </h2>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              Nome *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder="Ex: Calabresa Imperial"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder="Breve descrição do sabor..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              Categoria
            </label>
            <input
              list="category-options"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder="Ex: Doce, Salgado, Bebidas..."
            />
            <datalist id="category-options">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-smoke">
              Tipo do produto
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isCrust: false }))}
                className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                  !form.isCrust
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-gray-200 bg-gray-100 text-smoke hover:border-gold/20"
                }`}
              >
                Sabor / Pizza
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isCrust: true }))}
                className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                  form.isCrust
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-gray-200 bg-gray-100 text-smoke hover:border-gold/20"
                }`}
              >
                Borda recheada
              </button>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              URL da Imagem
            </label>
            <input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, imageUrl: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder="https://..."
            />
            {errors.imageUrl && (
              <p className="mt-1 text-xs text-red-400">{errors.imageUrl}</p>
            )}
            {form.imageUrl && !errors.imageUrl && (
              <img
                src={form.imageUrl}
                alt="preview"
                className="mt-2 h-20 w-full rounded-2xl object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>

          {/* Prices per size */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-smoke">
              Preços por Tamanho *
            </label>
            <div className="space-y-3">
              {form.sizes.map(({ size, price, costPrice }) => (
                <div key={size}>
                  <p className="mb-1 text-xs font-semibold text-smoke">
                    {SIZE_LABEL[size]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-0.5 block text-xs text-smoke">
                        Preço de venda
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-smoke">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={(e) =>
                            setPrice(size, "price", e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gold/50"
                          placeholder="0,00"
                        />
                      </div>
                      {errors[`price_${size}`] && (
                        <p className="mt-0.5 text-xs text-red-400">
                          {errors[`price_${size}`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-smoke">
                        Custo (opcional)
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-smoke">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={costPrice}
                          onChange={(e) =>
                            setPrice(size, "costPrice", e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gold/50"
                          placeholder="0,00"
                        />
                      </div>
                      {errors[`cost_${size}`] && (
                        <p className="mt-0.5 text-xs text-red-400">
                          {errors[`cost_${size}`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.sizes && (
              <p className="mt-1 text-xs text-red-400">{errors.sizes}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm text-smoke transition hover:border-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-2xl bg-gradient-to-r from-ember to-red-500 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit }) {
  const queryClient = useQueryClient();

  const toggleActive = useMutation({
    mutationFn: async () => {
      if (product.isActive) {
        await api.delete(`/admin/products/${product.id}`);
      } else {
        await api.patch(`/admin/products/${product.id}/restore`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(
        product.isActive ? "Produto desativado" : "Produto reativado",
      );
    },
    onError: () => toast.error("Falha ao alterar status"),
  });

  return (
    <article
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        product.isActive
          ? "border-gray-200 bg-lacquer/70"
          : "border-gray-100 bg-gray-50 opacity-50"
      }`}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="mb-3 h-32 w-full rounded-xl object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : (
        <div className="mb-3 flex h-32 w-full items-center justify-center rounded-xl bg-gray-100 text-3xl">
          🍕
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-smoke">
              {product.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-xl px-2 py-1 text-xs font-bold ${
            product.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-200 text-smoke"
          }`}
        >
          {product.isActive ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-xl bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
          {product.isCrust ? "Borda recheada" : "Sabor"}
        </span>
        {product.category ? (
          <span className="rounded-xl bg-gray-200 px-2 py-0.5 text-xs text-smoke">
            {product.category}
          </span>
        ) : null}
      </div>

      {/* Sizes */}
      <div className="mt-3 flex flex-wrap gap-1">
        {product.sizes?.map((s) => (
          <span
            key={s.size}
            className="rounded-xl bg-gold/10 px-2 py-0.5 text-xs text-gold"
          >
            {SIZE_LABEL[s.size]} R$ {Number(s.price).toFixed(2)}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex-1 rounded-2xl border border-gold/30 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10"
        >
          Editar
        </button>
        <button
          type="button"
          disabled={toggleActive.isPending}
          onClick={() => toggleActive.mutate()}
          className={`flex-1 rounded-2xl border py-2 text-xs font-semibold transition ${
            product.isActive
              ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
              : "border-green-500/30 text-green-400 hover:bg-green-500/10"
          } disabled:opacity-50`}
        >
          {product.isActive ? "Desativar" : "Reativar"}
        </button>
      </div>
    </article>
  );
}

function AdminProductsPage() {
  const [modal, setModal] = useState(null); // null | "new" | product object

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await api.get("/admin/products");
      return res.data?.data ?? [];
    },
  });

  const existingCategories = [
    ...new Set(
      products.map((p) => p.category).filter((c) => c && c !== "Geral"),
    ),
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 text-gray-900 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-gold">Produtos</h1>
          <p className="mt-1 text-sm text-smoke">
            Gerencie o cardápio da Pizzaria Fellice
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/30"
          >
            Painel
          </Link>
          <button
            type="button"
            onClick={() => setModal("new")}
            className="rounded-2xl bg-gradient-to-r from-ember to-red-500 px-4 py-2 text-sm font-bold text-gray-900 transition hover:opacity-90"
          >
            + Novo Produto
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-50" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-6 text-sm text-red-300">Falha ao carregar produtos.</p>
      )}

      {!isLoading && !isError && (
        <>
          <p className="mt-4 text-xs text-smoke">
            {products.filter((p) => p.isActive).length} ativos ·{" "}
            {products.filter((p) => !p.isActive).length} inativos
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(p) => setModal(p)}
              />
            ))}
            {products.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-smoke">
                Nenhum produto cadastrado ainda.
              </div>
            )}
          </div>
        </>
      )}

      {modal && (
        <ProductModal
          product={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          existingCategories={existingCategories}
        />
      )}
    </main>
  );
}

export default AdminProductsPage;
