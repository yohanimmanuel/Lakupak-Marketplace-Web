/** WhatsApp helpers — mirrors Laku-Marketplace/utils/whatsapp.ts */

function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export function normalizePhoneForWhatsApp(rawPhone: string): string | null {
  const raw = String(rawPhone ?? "").trim();
  if (!raw) return null;

  const d = digitsOnly(raw);
  if (!d) return null;

  if (d.startsWith("0") && d.length >= 9) return `62${d.slice(1)}`;
  if (d.startsWith("8") && d.length >= 8) return `62${d}`;
  return d;
}

export function buildWhatsAppUrl(params: {
  phone: string;
  text?: string;
}): string | null {
  const phone = normalizePhoneForWhatsApp(params.phone);
  if (!phone) return null;
  const base = `https://wa.me/${phone}`;
  const text = (params.text ?? "").trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
