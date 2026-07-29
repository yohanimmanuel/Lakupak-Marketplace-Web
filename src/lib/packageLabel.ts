/** Hide piece/pcs-style package labels from the UI — we never define or show them. */
export function displayPackageType(raw?: string | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^(pc|pcs|piece|pieces)$/i.test(value)) return "";
  return value;
}
