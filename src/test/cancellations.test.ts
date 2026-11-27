import { describe, expect, it } from "vitest";
import {
  buildCancellationPayload,
  computeCancellationAnalytics,
  formatCancellationSummary,
  validateCancellationInput,
} from "@/lib/cancellations";

describe("cancellation helpers", () => {
  it("validates actor, reason and required note when reason is Outro", () => {
    expect(
      validateCancellationInput({ cancelledBy: "", reason: "", notes: "" })
    ).toBe("Informe quem cancelou a sessão.");

    expect(
      validateCancellationInput({ cancelledBy: "cliente", reason: "", notes: "" })
    ).toBe("Selecione o motivo do cancelamento.");

    expect(
      validateCancellationInput({
        cancelledBy: "cliente",
        reason: "Outro",
        notes: "   ",
      })
    ).toBe("Descreva o motivo do cancelamento.");

    expect(
      validateCancellationInput({
        cancelledBy: "estudio",
        reason: "Conflito de agenda",
        notes: "",
      })
    ).toBeNull();
  });

  it("clears cancellation fields when appointment is no longer cancelled", () => {
    expect(
      buildCancellationPayload("Agendado", {
        cancelledBy: "cliente",
        reason: "Financeiro",
        notes: "Sem limite",
      })
    ).toEqual({
      cancelled_by: null,
      cancellation_reason: null,
      cancellation_notes: null,
      cancelled_at: null,
    });
  });

  it("preserves cancelled_at if already cancelled and populates payload", () => {
    const payload = buildCancellationPayload(
      "Cancelado",
      {
        cancelledBy: "cliente",
        reason: "Saúde",
        notes: "Febre",
      },
      { status: "Cancelado", cancelled_at: "2026-11-20T10:00:00.000Z" }
    );

    expect(payload).toEqual({
      cancelled_by: "cliente",
      cancellation_reason: "Saúde",
      cancellation_notes: "Febre",
      cancelled_at: "2026-11-20T10:00:00.000Z",
    });
  });

  it("computes cancellation analytics split by actor and reason", () => {
    const appts = [
      {
        id: "1",
        status: "Cancelado",
        cancelled_by: "cliente",
        cancellation_reason: "Financeiro",
        value: 800,
      },
      {
        id: "2",
        status: "Cancelado",
        cancelled_by: "cliente",
        cancellation_reason: "Financeiro",
        value: 1200,
      },
      {
        id: "3",
        status: "Cancelado",
        cancelled_by: "estudio",
        cancellation_reason: "Conflito de agenda",
        value: 500,
      },
      {
        id: "4",
        status: "Cancelado",
        cancelled_by: null,
        cancellation_reason: null,
        value: 300,
      },
      {
        id: "5",
        status: "Concluído",
        value: 1500,
      },
    ];

    const all = computeCancellationAnalytics(appts, "todos");
    expect(all.totalCancelled).toBe(4);
    expect(all.byClient).toBe(2);
    expect(all.byStudio).toBe(1);
    expect(all.unclassified).toBe(1);
    expect(all.clientPct).toBe(50);
    expect(all.studioPct).toBe(25);
    expect(all.totalLostValue).toBe(2800);
    expect(all.byReason[0]).toMatchObject({
      actor: "cliente",
      reason: "Financeiro",
      count: 2,
      percentage: 50,
      lostValue: 2000,
    });

    const onlyStudio = computeCancellationAnalytics(appts, "estudio");
    expect(onlyStudio.byReason).toHaveLength(1);
    expect(onlyStudio.byReason[0]).toMatchObject({
      actor: "estudio",
      reason: "Conflito de agenda",
      count: 1,
      percentage: 100,
      lostValue: 500,
    });
  });

  it("formats legacy and classified cancellation summaries", () => {
    expect(formatCancellationSummary({})).toMatchObject({
      hasClassification: false,
      summary: "Sem motivo registrado",
    });

    expect(
      formatCancellationSummary({
        cancelled_by: "cliente",
        cancellation_reason: "Não compareceu",
        cancellation_notes: "Não respondeu WhatsApp",
      })
    ).toMatchObject({
      hasClassification: true,
      actorLabel: "Cliente",
      reasonLabel: "Não compareceu",
      summary: "Cliente • Não compareceu — Não respondeu WhatsApp",
    });
  });
});
