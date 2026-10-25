/** Read storefront distributor id from the marketplace JWT payload (no verify). */
export function getStorefrontDistributorId(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as {
      distributorId?: unknown;
    };
    const id =
      typeof decoded.distributorId === "number"
        ? decoded.distributorId
        : typeof decoded.distributorId === "string"
          ? Number(decoded.distributorId)
          : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
