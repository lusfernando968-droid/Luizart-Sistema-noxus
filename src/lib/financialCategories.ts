export type FinancialCategory =
  | "tatuagem"
  | "sinal"
  | "mentoria"
  | "aula"
  | "produto"
  | "outros";

export interface CategoryMeta {
  key: FinancialCategory;
  label: string;
}

export const PRIMARY_FINANCIAL_CATEGORIES: CategoryMeta[] = [
  { key: "tatuagem", label: "Tatuagem" },
  { key: "sinal", label: "Sinal Recebido" },
  { key: "mentoria", label: "Mentoria" },
  { key: "aula", label: "Aula" },
  { key: "produto", label: "Produto" },
];

export const ALL_FINANCIAL_CATEGORIES: CategoryMeta[] = [
  ...PRIMARY_FINANCIAL_CATEGORIES,
  { key: "outros", label: "Outros" },
];

const VALID_KEYS = new Set<FinancialCategory>([
  "tatuagem",
  "sinal",
  "mentoria",
  "aula",
  "produto",
  "outros",
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveFinancialCategory(
  transaction: { category?: string | null; description?: string | null }
): FinancialCategory {
  const rawCategory = transaction.category?.trim().toLowerCase() as FinancialCategory | undefined;
  if (rawCategory && VALID_KEYS.has(rawCategory)) {
    return rawCategory;
  }

  const desc = normalizeText(transaction.description || "");

  if (/\bsinal\b|sinal de/.test(desc)) return "sinal";
  if (/mentoria|mentorado/.test(desc)) return "mentoria";
  if (/\baula\b|\baulas\b|\bcurso\b|\bworkshop\b/.test(desc)) return "aula";
  if (/produto|pomada|camiseta|merch|aftercare|venda de/.test(desc)) return "produto";
  if (/tattoo|tatuagem|sessao/.test(desc)) return "tatuagem";

  return "outros";
}

export function getFinancialCategoryLabel(key: FinancialCategory): string {
  return ALL_FINANCIAL_CATEGORIES.find((c) => c.key === key)?.label ?? "Outros";
}
