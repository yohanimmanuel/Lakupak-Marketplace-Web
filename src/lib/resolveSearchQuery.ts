import en from "@/i18n/locales/en.json";
import id from "@/i18n/locales/id.json";

/**
 * Maps localized category search terms to canonical English product types,
 * matching Laku-Marketplace/utils/resolveSearchQuery.ts.
 */

type ProductTypeEntry = { key: string; en: string; id: string };

function normTerm(value: string): string {
  return value.trim().toLowerCase().normalize("NFC");
}

function categoryMap(locale: { category?: Record<string, string> }): Record<string, string> {
  return locale.category ?? {};
}

function getProductTypeEntries(): ProductTypeEntry[] {
  const enMap = categoryMap(en);
  const idMap = categoryMap(id);
  const keys = new Set([...Object.keys(enMap), ...Object.keys(idMap)]);

  return Array.from(keys).map((key) => ({
    key,
    en: enMap[key] ?? key,
    id: idMap[key] ?? enMap[key] ?? key,
  }));
}

/** Map a user-facing category label (any locale) to the canonical English DB product type. */
export function resolveProductTypeKey(input: string): string | null {
  const q = normTerm(input);
  if (!q) return null;

  const entries = getProductTypeEntries();

  for (const { key, en: enLabel, id: idLabel } of entries) {
    if (normTerm(key) === q || normTerm(enLabel) === q || normTerm(idLabel) === q) {
      return key;
    }
  }

  let bestKey: string | null = null;
  let bestScore = -1;
  const consider = (key: string, label: string, baseScore: number) => {
    const l = normTerm(label);
    if (!l) return;

    let score = -1;
    if (l === q) score = baseScore + 200;
    else if (l.includes(q)) score = baseScore + 120 - l.length + q.length * 2;
    else if (q.includes(l) && l.length >= 3) score = baseScore + 90;
    else {
      const tokens = l.split(/[\s&]+/).filter(Boolean);
      if (
        tokens.some(
          (token) =>
            token === q ||
            (q.length >= 4 && token.startsWith(q)) ||
            (token.length >= 4 && q.startsWith(token)),
        )
      ) {
        score = baseScore + 100;
      }
    }

    if (score >= 0 && score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  };

  for (const { key, en: enLabel, id: idLabel } of entries) {
    consider(key, key, 50);
    consider(key, enLabel, 60);
    consider(key, idLabel, 75);
  }

  return bestKey;
}

/** Whether a canonical product type matches a lowercased query (English key or localized label). */
export function productTypeMatchesQuery(categoryKey: string, queryLower: string): boolean {
  const q = normTerm(queryLower);
  if (!q) return false;

  const key = categoryKey.trim();
  if (!key) return false;
  if (normTerm(key).includes(q)) return true;

  const enMap = categoryMap(en);
  const idMap = categoryMap(id);
  const labels = [enMap[key], idMap[key]].filter(Boolean) as string[];
  return labels.some((label) => normTerm(label).includes(q));
}

export function resolveSearchQuery(raw: string): {
  displayQuery: string;
  apiQuery: string;
  category?: string;
} {
  const displayQuery = raw.trim();
  if (!displayQuery) {
    return { displayQuery: "", apiQuery: "" };
  }

  const productTypeKey = resolveProductTypeKey(displayQuery);
  if (productTypeKey) {
    return {
      displayQuery,
      apiQuery: productTypeKey,
      category: productTypeKey,
    };
  }

  return { displayQuery, apiQuery: displayQuery };
}
