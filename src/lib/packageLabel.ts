/** Hide piece/pcs-style package labels from the UI — we never define or show them. */
export function displayPackageType(raw?: string | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^(pc|pcs|piece|pieces)$/i.test(value)) return "";
  return value;
}

/** Normalize catalog stock units for quantity labels (pieces / boxes / cartons). */
export function displayStockUnit(raw?: string | null): string {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value || /^(pc|pcs|piece|pieces)$/.test(value)) return "pieces";
  if (/^(box|boxes)$/.test(value)) return "boxes";
  if (/^(carton|cartons)$/.test(value)) return "cartons";
  return value;
}

/** Title-case stock unit for “Stock: Pieces” style labels. */
export function displayStockUnitLabel(raw?: string | null): string {
  const unit = displayStockUnit(raw);
  return unit.charAt(0).toUpperCase() + unit.slice(1);
}
