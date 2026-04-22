export const SIZE_LABEL = {
  PEQUENA: "Broto",
  MEDIA: "Media",
  GRANDE: "Grande",
  FAMILIA: "Familia",
};

export function indexProductsById(products = []) {
  return new Map(products.map((product) => [product.id, product]));
}

export function getProductPriceBySize(product, size) {
  const sizeEntry = product?.sizes?.find((entry) => entry.size === size);
  return sizeEntry ? Number(sizeEntry.price) : 0;
}

export function getPizzaBasePrice({
  productsById,
  flavorIds,
  size,
  type,
}) {
  const prices = flavorIds
    .map((flavorId) => getProductPriceBySize(productsById.get(flavorId), size))
    .filter((price) => price > 0);

  if (!prices.length) return 0;

  if (type === "MEIO_A_MEIO") {
    return Math.max(...prices);
  }

  return prices[0];
}

export function getCrustPrice({ crustsById, crustProductId, size }) {
  if (!crustProductId) return 0;
  return getProductPriceBySize(crustsById.get(crustProductId), size);
}

export function buildPizzaDescription({
  productsById,
  crustsById,
  flavorIds,
  size,
  crustProductId,
}) {
  const flavorNames = flavorIds
    .map((flavorId) => productsById.get(flavorId)?.name)
    .filter(Boolean);

  const parts = [
    flavorNames.length ? flavorNames.join(" / ") : "Pizza personalizada",
    SIZE_LABEL[size] ?? size,
  ];

  if (crustProductId) {
    const crustName = crustsById.get(crustProductId)?.name;
    if (crustName) {
      parts.push(`Borda ${crustName}`);
    }
  }

  return parts.join(" | ");
}

export function getPizzaPrice({
  productsById,
  crustsById,
  flavorIds,
  size,
  type,
  crustProductId,
}) {
  return (
    getPizzaBasePrice({
      productsById,
      flavorIds,
      size,
      type,
    }) +
    getCrustPrice({ crustsById, crustProductId, size })
  );
}
