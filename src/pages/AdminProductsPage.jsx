import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useTranslation } from "../context/I18nContext.jsx";

const SIZES = ["PEQUENA", "GRANDE"];
const SIZE_LABEL = {
  PEQUENA: "Broto",
  GRANDE: "Grande",
};

const PRODUCT_TYPE = {
  PIZZA: "PIZZA",
  CRUST: "CRUST",
  OTHER: "OTHER",
};

const emptyForm = () => ({
  name: "",
  description: "",
  imageUrl: "",
  category: "",
  isCrust: false,
  productType: PRODUCT_TYPE.PIZZA,
  sizes: SIZES.map((size) => ({ size, price: "", costPrice: "" })),
  singlePrice: "",
  singleCostPrice: "",
});

// ── Tradução automática de produtos ──────────────────────────────────────────
const I18N_URL =
  import.meta.env.VITE_I18N_URL ||
  "https://tradudor-i8n-languages.onrender.com";
const I18N_SISTEMA = "website";
const ALL_LOCALES = ["pt-BR", "pt-PT", "en-US", "it-IT", "es-ES", "ar-MA"];
const LOCALE_LABELS = {
  "pt-BR": "Portugues (Brasil)",
  "pt-PT": "Portugues (Portugal)",
  "en-US": "English",
  "it-IT": "Italiano",
  "es-ES": "Espanol",
  "ar-MA": "Arabic",
};

const CATEGORY_TRANSLATIONS = {
  Geral: {
    "pt-BR": "Geral",
    "pt-PT": "Geral",
    "en-US": "General",
    "it-IT": "Generale",
    "es-ES": "General",
    "ar-MA": "عام",
  },
  Pizzas: {
    "pt-BR": "Pizzas",
    "pt-PT": "Pizzas",
    "en-US": "Pizzas",
    "it-IT": "Pizze",
    "es-ES": "Pizzas",
    "ar-MA": "بيتزا",
  },
  Bebidas: {
    "pt-BR": "Bebidas",
    "pt-PT": "Bebidas",
    "en-US": "Drinks",
    "it-IT": "Bevande",
    "es-ES": "Bebidas",
    "ar-MA": "مشروبات",
  },
  Porções: {
    "pt-BR": "Porções",
    "pt-PT": "Porções",
    "en-US": "Sides",
    "it-IT": "Contorni",
    "es-ES": "Porciones",
    "ar-MA": "مقبلات",
  },
  Sobremesas: {
    "pt-BR": "Sobremesas",
    "pt-PT": "Sobremesas",
    "en-US": "Desserts",
    "it-IT": "Dessert",
    "es-ES": "Postres",
    "ar-MA": "حلويات",
  },
  Petiscos: {
    "pt-BR": "Petiscos",
    "pt-PT": "Petiscos",
    "en-US": "Snacks",
    "it-IT": "Stuzzichini",
    "es-ES": "Aperitivos",
    "ar-MA": "وجبات خفيفة",
  },
  Beirutes: {
    "pt-BR": "Beirutes",
    "pt-PT": "Beirutes",
    "en-US": "Sandwiches",
    "it-IT": "Panini",
    "es-ES": "Sándwiches",
    "ar-MA": "سندويشات",
  },
  Promoções: {
    "pt-BR": "Promoções",
    "pt-PT": "Promoções",
    "en-US": "Specials",
    "it-IT": "Offerte",
    "es-ES": "Promociones",
    "ar-MA": "عروض",
  },
};

function normalizeCategoryKey(cat) {
  return `CAT_${(cat ?? "GERAL")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")}`;
}

async function postI18n(chave, valor, idioma) {
  try {
    const res = await fetch(`${I18N_URL}/traducoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chave, valor, sistema: I18N_SISTEMA, idioma }),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function saveProductTranslations(
  id,
  name,
  description,
  category,
  baseLocale = "pt-BR",
) {
  const tasks = [];
  const locales = [...new Set([baseLocale, ...ALL_LOCALES])];

  // Nome e descrição: replica para todos os idiomas usando o texto base informado
  if (name) {
    for (const locale of locales) {
      tasks.push(postI18n(`PRODUCT_${id}_NAME`, name, locale));
    }
  }
  if (description) {
    for (const locale of locales) {
      tasks.push(postI18n(`PRODUCT_${id}_DESC`, description, locale));
    }
  }

  // Categoria: se conhecida usa traduções mapeadas; senão replica texto base
  if (category) {
    const catKey = normalizeCategoryKey(category);
    const known = CATEGORY_TRANSLATIONS[category];
    for (const locale of locales) {
      const value =
        locale === baseLocale ? category : (known?.[locale] ?? category);
      tasks.push(postI18n(catKey, value, locale));
    }
  }

  const results = await Promise.all(tasks);
  const succeeded = results.filter(Boolean).length;
  return {
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
  };
}
// ─────────────────────────────────────────────────────────────────────────────

function ProductModal({ product, onClose, existingCategories = [] }) {
  const { t, locale, refreshTranslations } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!product;
  const [translationBaseLocale, setTranslationBaseLocale] = useState(() =>
    ALL_LOCALES.includes(locale) ? locale : "pt-BR",
  );

  const [form, setForm] = useState(() => {
    if (!isEdit) return emptyForm();
    const productType = product.isCrust
      ? PRODUCT_TYPE.CRUST
      : (product.sizes?.length ?? 0) <= 1
        ? PRODUCT_TYPE.OTHER
        : PRODUCT_TYPE.PIZZA;
    const firstSize = product.sizes?.[0];
    return {
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      category: product.category ?? "",
      isCrust: Boolean(product.isCrust),
      productType,
      sizes: SIZES.map((size) => {
        const existing = product.sizes?.find((s) => s.size === size);
        return {
          size,
          price: existing ? String(existing.price) : "",
          costPrice:
            existing?.costPrice != null ? String(existing.costPrice) : "",
        };
      }),
      singlePrice:
        productType === PRODUCT_TYPE.OTHER && firstSize
          ? String(firstSize.price)
          : "",
      singleCostPrice:
        productType === PRODUCT_TYPE.OTHER && firstSize?.costPrice != null
          ? String(firstSize.costPrice)
          : "",
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(
        isEdit
          ? t("ADMIN_PRODUCTS_UPDATED", "Produto atualizado!")
          : t("ADMIN_PRODUCTS_CREATED", "Produto criado!"),
      );
      // Salva traduções no banco i18n (fire-and-forget, não bloqueia o admin)
      const saved = result?.data ?? result;
      if (saved?.id) {
        saveProductTranslations(
          saved.id,
          saved.name,
          saved.description,
          saved.category,
          translationBaseLocale,
        ).then(() => {
          refreshTranslations?.();
        });
      }
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ??
          t("ADMIN_PRODUCTS_SAVE_ERROR", "Erro ao salvar produto"),
      );
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
    if (form.productType === PRODUCT_TYPE.OTHER) {
      if (
        form.singlePrice === "" ||
        isNaN(Number(form.singlePrice)) ||
        Number(form.singlePrice) <= 0
      ) {
        errs.singlePrice = "Preço inválido";
      }
      if (
        form.singleCostPrice !== "" &&
        (isNaN(Number(form.singleCostPrice)) ||
          Number(form.singleCostPrice) < 0)
      ) {
        errs.singleCostPrice = "Custo inválido";
      }
    } else {
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
    }
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
      isCrust: form.productType === PRODUCT_TYPE.CRUST,
      sizes:
        form.productType === PRODUCT_TYPE.OTHER
          ? [
              {
                size: "GRANDE",
                price: Number(form.singlePrice),
                ...(form.singleCostPrice !== ""
                  ? { costPrice: Number(form.singleCostPrice) }
                  : {}),
              },
            ]
          : form.sizes
              .filter((s) => s.price !== "")
              .map((s) => ({
                size: s.size,
                price: Number(s.price),
                ...(s.costPrice !== ""
                  ? { costPrice: Number(s.costPrice) }
                  : {}),
              })),
    };
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 my-auto w-full max-w-lg rounded-3xl border border-gold/20 bg-white p-6 shadow-2xl">
        <h2 className="font-display text-2xl text-gold">
          {isEdit
            ? t("ADMIN_PRODUCTS_EDIT_TITLE", "Editar Produto")
            : t("ADMIN_PRODUCTS_NEW_TITLE", "Novo Produto")}
        </h2>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              {t("ADMIN_PRODUCTS_NAME_LABEL", "Nome *")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder={t(
                "ADMIN_PRODUCTS_NAME_PLACEHOLDER",
                "Ex: Calabresa Imperial",
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              {t("ADMIN_PRODUCTS_DESCRIPTION_LABEL", "Descrição")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder={t(
                "ADMIN_PRODUCTS_DESCRIPTION_PLACEHOLDER",
                "Breve descrição do sabor...",
              )}
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              {t("ADMIN_PRODUCTS_CATEGORY_LABEL", "Categoria")}
            </label>
            <input
              list="category-options"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
              placeholder={t(
                "ADMIN_PRODUCTS_CATEGORY_PLACEHOLDER",
                "Ex: Doce, Salgado, Bebidas...",
              )}
            />
            <datalist id="category-options">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Translation base language */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              {t("ADMIN_PRODUCTS_BASE_LANGUAGE", "Idioma base do cadastro")}
            </label>
            <select
              value={translationBaseLocale}
              onChange={(e) => setTranslationBaseLocale(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gold/50"
            >
              {ALL_LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_LABELS[loc] ?? loc}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-smoke">
              {t(
                "ADMIN_PRODUCTS_BASE_LANGUAGE_HINT",
                "O texto digitado sera salvo neste idioma e replicado automaticamente para os outros.",
              )}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-smoke">
              {t("ADMIN_PRODUCTS_TYPE_LABEL", "Tipo do produto")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, productType: PRODUCT_TYPE.PIZZA }))
                }
                className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                  form.productType === PRODUCT_TYPE.PIZZA
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-gray-200 bg-gray-100 text-smoke hover:border-gold/20"
                }`}
              >
                {t("ADMIN_PRODUCTS_TYPE_PIZZA", "Pizza")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, productType: PRODUCT_TYPE.CRUST }))
                }
                className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                  form.productType === PRODUCT_TYPE.CRUST
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-gray-200 bg-gray-100 text-smoke hover:border-gold/20"
                }`}
              >
                {t("ADMIN_PRODUCTS_TYPE_CRUST", "Borda recheada")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, productType: PRODUCT_TYPE.OTHER }))
                }
                className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                  form.productType === PRODUCT_TYPE.OTHER
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-gray-200 bg-gray-100 text-smoke hover:border-gold/20"
                }`}
              >
                {t("ADMIN_PRODUCTS_TYPE_OTHER", "Outros")}
              </button>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-smoke">
              {t("ADMIN_PRODUCTS_IMAGE_URL", "URL da Imagem")}
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

          {/* Prices */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-smoke">
              {form.productType === PRODUCT_TYPE.OTHER
                ? t("ADMIN_PRODUCTS_PRICE_COST", "Preço e custo *")
                : t("ADMIN_PRODUCTS_PRICES_BY_SIZE", "Preços por Tamanho *")}
            </label>
            {form.productType === PRODUCT_TYPE.OTHER ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-xs text-smoke">
                    {t("ADMIN_PRODUCTS_SALE_PRICE", "Preço de venda")}
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-smoke">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.singlePrice}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, singlePrice: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gold/50"
                      placeholder="0,00"
                    />
                  </div>
                  {errors.singlePrice && (
                    <p className="mt-0.5 text-xs text-red-400">
                      {errors.singlePrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-smoke">
                    {t("ADMIN_PRODUCTS_COST_OPTIONAL", "Custo (opcional)")}
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-smoke">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.singleCostPrice}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          singleCostPrice: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gold/50"
                      placeholder="0,00"
                    />
                  </div>
                  {errors.singleCostPrice && (
                    <p className="mt-0.5 text-xs text-red-400">
                      {errors.singleCostPrice}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {form.sizes.map(({ size, price, costPrice }) => (
                  <div key={size}>
                    <p className="mb-1 text-xs font-semibold text-smoke">
                      {t(`SIZE_${size}`, SIZE_LABEL[size])}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-0.5 block text-xs text-smoke">
                          {t("ADMIN_PRODUCTS_SALE_PRICE", "Preço de venda")}
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
                          {t(
                            "ADMIN_PRODUCTS_COST_OPTIONAL",
                            "Custo (opcional)",
                          )}
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
            )}
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
              {t("BTN_CANCEL", "Cancelar")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-2xl bg-gradient-to-r from-ember to-red-500 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending
                ? t("ADMIN_PRODUCTS_SAVING", "Salvando...")
                : isEdit
                  ? t("BTN_SAVE", "Salvar")
                  : t("ADMIN_PRODUCTS_CREATE", "Criar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit }) {
  const { t, locale, refreshTranslations } = useTranslation();
  const queryClient = useQueryClient();
  const productName = t(`PRODUCT_${product.id}_NAME`, product.name);
  const productDescription = product.description
    ? t(`PRODUCT_${product.id}_DESC`, product.description)
    : null;
  const translatedCategory = product.category
    ? t(normalizeCategoryKey(product.category), product.category)
    : null;
  const productTypeLabel = product.isCrust
    ? t("ADMIN_PRODUCTS_TYPE_CRUST", "Borda recheada")
    : (product.sizes?.length ?? 0) <= 1
      ? t("ADMIN_PRODUCTS_TYPE_OTHER", "Outros")
      : t("ADMIN_PRODUCTS_TYPE_FLAVOR", "Sabor");

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
        product.isActive
          ? t("ADMIN_PRODUCTS_DISABLED", "Produto desativado")
          : t("ADMIN_PRODUCTS_RESTORED", "Produto reativado"),
      );
    },
    onError: () =>
      toast.error(t("ADMIN_PRODUCTS_STATUS_ERROR", "Falha ao alterar status")),
  });

  const reapplyTranslations = useMutation({
    mutationFn: async () => {
      const baseLocale = ALL_LOCALES.includes(locale) ? locale : "pt-BR";
      const summary = await saveProductTranslations(
        product.id,
        product.name,
        product.description,
        product.category,
        baseLocale,
      );
      if (!summary.total || summary.succeeded === 0) {
        throw new Error("Translation sync failed");
      }
      return summary;
    },
    onSuccess: ({ succeeded, failed }) => {
      refreshTranslations?.();
      if (failed > 0) {
        toast.success(
          t(
            "ADMIN_PRODUCTS_REAPPLY_TRANSLATION_PARTIAL",
            "Traducoes reaplicadas parcialmente ({{ok}} OK, {{fail}} falharam).",
          )
            .replace("{{ok}}", String(succeeded))
            .replace("{{fail}}", String(failed)),
        );
        return;
      }
      toast.success(
        t(
          "ADMIN_PRODUCTS_REAPPLY_TRANSLATION_SUCCESS",
          "Traducoes reaplicadas com sucesso.",
        ),
      );
    },
    onError: () => {
      toast.error(
        t(
          "ADMIN_PRODUCTS_REAPPLY_TRANSLATION_ERROR",
          "Falha ao reaplicar traducoes.",
        ),
      );
    },
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
          alt={productName}
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
            {productName}
          </h3>
          {productDescription && (
            <p className="mt-0.5 line-clamp-2 text-xs text-smoke">
              {productDescription}
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
          {product.isActive
            ? t("ADMIN_PRODUCTS_ACTIVE", "Ativo")
            : t("ADMIN_PRODUCTS_INACTIVE", "Inativo")}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-xl bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
          {productTypeLabel}
        </span>
        {translatedCategory ? (
          <span className="rounded-xl bg-gray-200 px-2 py-0.5 text-xs text-smoke">
            {translatedCategory}
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
            {t(`SIZE_${s.size}`, SIZE_LABEL[s.size])} R${" "}
            {Number(s.price).toFixed(2)}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="rounded-2xl border border-gold/30 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10"
        >
          {t("EDIT", "Editar")}
        </button>
        <button
          type="button"
          disabled={reapplyTranslations.isPending}
          onClick={() => reapplyTranslations.mutate()}
          className="rounded-2xl border border-sky-400/30 py-2 text-xs font-semibold text-sky-600 transition hover:bg-sky-500/10 disabled:opacity-50"
        >
          {reapplyTranslations.isPending
            ? t("ADMIN_PRODUCTS_REAPPLY_TRANSLATION_LOADING", "Reaplicando...")
            : t("ADMIN_PRODUCTS_REAPPLY_TRANSLATION", "Reaplicar traducao")}
        </button>
        <button
          type="button"
          disabled={toggleActive.isPending}
          onClick={() => toggleActive.mutate()}
          className={`rounded-2xl border py-2 text-xs font-semibold transition ${
            product.isActive
              ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
              : "border-green-500/30 text-green-400 hover:bg-green-500/10"
          } disabled:opacity-50`}
        >
          {product.isActive
            ? t("ADMIN_PRODUCTS_DISABLE", "Desativar")
            : t("ADMIN_PRODUCTS_RESTORE", "Reativar")}
        </button>
      </div>
    </article>
  );
}

function AdminProductsPage() {
  const { t } = useTranslation();
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
          <h1 className="font-display text-3xl text-gold">
            {t("ADMIN_PRODUCTS_TITLE", "Produtos")}
          </h1>
          <p className="mt-1 text-sm text-smoke">
            {t(
              "ADMIN_PRODUCTS_SUBTITLE",
              "Gerencie o cardápio da Pizzaria Fellice",
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm transition hover:border-gold/30"
          >
            {t("NAV_PAINEL", "Painel")}
          </Link>
          <button
            type="button"
            onClick={() => setModal("new")}
            className="rounded-2xl bg-gradient-to-r from-ember to-red-500 px-4 py-2 text-sm font-bold text-gray-900 transition hover:opacity-90"
          >
            + {t("ADMIN_PRODUCTS_NEW_BUTTON", "Novo Produto")}
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
        <p className="mt-6 text-sm text-red-300">
          {t("ADMIN_PRODUCTS_LOAD_ERROR", "Falha ao carregar produtos.")}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <p className="mt-4 text-xs text-smoke">
            {t("ADMIN_PRODUCTS_ACTIVE_COUNT", "{{count}} ativos").replace(
              "{{count}}",
              String(products.filter((p) => p.isActive).length),
            )}
            {" · "}
            {t("ADMIN_PRODUCTS_INACTIVE_COUNT", "{{count}} inativos").replace(
              "{{count}}",
              String(products.filter((p) => !p.isActive).length),
            )}
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
                {t("ADMIN_PRODUCTS_EMPTY", "Nenhum produto cadastrado ainda.")}
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
