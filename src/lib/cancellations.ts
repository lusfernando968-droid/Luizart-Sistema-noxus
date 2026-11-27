export type CancelledBy = "cliente" | "estudio";

export const CLIENT_CANCELLATION_REASONS = [
  "Imprevisto pessoal",
  "Saúde",
  "Financeiro",
  "Não compareceu",
  "Sem retorno",
  "Desistência",
  "Outro",
] as const;

export const STUDIO_CANCELLATION_REASONS = [
  "Imprevisto / Saúde",
  "Conflito de agenda",
  "Falta de sinal",
  "Projeto inviável",
  "Outro",
] as const;

export interface CancellationInput {
  cancelledBy: CancelledBy | "";
  reason: string;
  notes?: string;
}

export interface CancellationReasonMetric {
  key: string;
  actor: CancelledBy | "nao_informado";
  actorLabel: string;
  reason: string;
  count: number;
  percentage: number;
  lostValue: number;
}

export interface CancellationAnalytics {
  totalCancelled: number;
  byClient: number;
  byStudio: number;
  unclassified: number;
  clientPct: number;
  studioPct: number;
  totalLostValue: number;
  clientLostValue: number;
  studioLostValue: number;
  byReason: CancellationReasonMetric[];
}

export function getReasonsForActor(actor: CancelledBy | ""): readonly string[] {
  if (actor === "cliente") return CLIENT_CANCELLATION_REASONS;
  if (actor === "estudio") return STUDIO_CANCELLATION_REASONS;
  return [];
}

export function getCancelledByLabel(actor?: string | null): string {
  if (actor === "cliente") return "Cliente";
  if (actor === "estudio") return "Estúdio";
  return "Não informado";
}

export function validateCancellationInput(input: CancellationInput): string | null {
  if (!input.cancelledBy) {
    return "Informe quem cancelou a sessão.";
  }
  if (!input.reason.trim()) {
    return "Selecione o motivo do cancelamento.";
  }
  if (input.reason === "Outro" && !input.notes?.trim()) {
    return "Descreva o motivo do cancelamento.";
  }
  return null;
}

export function buildCancellationPayload(
  status: string,
  input: CancellationInput,
  previous?: { status?: string | null; cancelled_at?: string | null }
) {
  if (status !== "Cancelado") {
    return {
      cancelled_by: null,
      cancellation_reason: null,
      cancellation_notes: null,
      cancelled_at: null,
    };
  }

  return {
    cancelled_by: input.cancelledBy || null,
    cancellation_reason: input.reason.trim() || null,
    cancellation_notes: input.notes?.trim() || null,
    cancelled_at:
      previous?.status === "Cancelado" && previous?.cancelled_at
        ? previous.cancelled_at
        : new Date().toISOString(),
  };
}

export function formatCancellationSummary(appt: {
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  cancellation_notes?: string | null;
}) {
  const actorLabel = getCancelledByLabel(appt.cancelled_by);
  const reasonLabel = appt.cancellation_reason?.trim() || "Sem motivo registrado";
  const notes = appt.cancellation_notes?.trim() || "";

  if (!appt.cancelled_by && !appt.cancellation_reason) {
    return {
      actorLabel: "Não informado",
      reasonLabel: "Sem motivo registrado",
      notes,
      hasClassification: false,
      summary: "Sem motivo registrado",
    };
  }

  const base = `${actorLabel} • ${reasonLabel}`;
  return {
    actorLabel,
    reasonLabel,
    notes,
    hasClassification: true,
    summary: notes ? `${base} — ${notes}` : base,
  };
}

export function computeCancellationAnalytics(
  appointments: any[],
  actorFilter: "todos" | CancelledBy = "todos"
): CancellationAnalytics {
  const cancelledList = (appointments || []).filter(
    (a: any) => a?.status === "Cancelado"
  );

  const totalCancelled = cancelledList.length;
  let byClient = 0;
  let byStudio = 0;
  let unclassified = 0;
  let totalLostValue = 0;
  let clientLostValue = 0;
  let studioLostValue = 0;

  cancelledList.forEach((a: any) => {
    const val = Number(a.value || 0);
    totalLostValue += val;
    if (a.cancelled_by === "cliente") {
      byClient += 1;
      clientLostValue += val;
    } else if (a.cancelled_by === "estudio") {
      byStudio += 1;
      studioLostValue += val;
    } else {
      unclassified += 1;
    }
  });

  const filteredByActor =
    actorFilter === "todos"
      ? cancelledList
      : cancelledList.filter((a: any) => a.cancelled_by === actorFilter);

  const reasonMap = new Map<
    string,
    {
      actor: CancelledBy | "nao_informado";
      reason: string;
      count: number;
      lostValue: number;
    }
  >();

  filteredByActor.forEach((a: any) => {
    const actor: CancelledBy | "nao_informado" =
      a.cancelled_by === "cliente" || a.cancelled_by === "estudio"
        ? a.cancelled_by
        : "nao_informado";
    const reason = a.cancellation_reason?.trim() || "Sem motivo registrado";
    const key = `${actor}::${reason}`;
    const existing = reasonMap.get(key);
    const val = Number(a.value || 0);

    if (existing) {
      existing.count += 1;
      existing.lostValue += val;
    } else {
      reasonMap.set(key, {
        actor,
        reason,
        count: 1,
        lostValue: val,
      });
    }
  });

  const denom = filteredByActor.length;
  const byReason: CancellationReasonMetric[] = Array.from(reasonMap.entries())
    .map(([key, item]) => ({
      key,
      actor: item.actor,
      actorLabel: getCancelledByLabel(item.actor === "nao_informado" ? null : item.actor),
      reason: item.reason,
      count: item.count,
      percentage: denom > 0 ? Math.round((item.count / denom) * 100) : 0,
      lostValue: item.lostValue,
    }))
    .sort((a, b) => b.count - a.count || b.lostValue - a.lostValue);

  return {
    totalCancelled,
    byClient,
    byStudio,
    unclassified,
    clientPct: totalCancelled > 0 ? Math.round((byClient / totalCancelled) * 100) : 0,
    studioPct: totalCancelled > 0 ? Math.round((byStudio / totalCancelled) * 100) : 0,
    totalLostValue,
    clientLostValue,
    studioLostValue,
    byReason,
  };
}
