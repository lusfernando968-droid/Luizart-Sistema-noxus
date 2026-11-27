import { User, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CancelledBy,
  getReasonsForActor,
} from "@/lib/cancellations";

interface CancellationReasonFieldsProps {
  cancelledBy: CancelledBy | "";
  reason: string;
  notes: string;
  onChange: (next: {
    cancelledBy: CancelledBy | "";
    reason: string;
    notes: string;
  }) => void;
}

export function CancellationReasonFields({
  cancelledBy,
  reason,
  notes,
  onChange,
}: CancellationReasonFieldsProps) {
  const reasons = getReasonsForActor(cancelledBy);

  const handleActorSelect = (nextActor: CancelledBy) => {
    const validReasons = getReasonsForActor(nextActor);
    const keepReason = validReasons.includes(reason) ? reason : "";
    onChange({
      cancelledBy: nextActor,
      reason: keepReason,
      notes,
    });
  };

  return (
    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/25 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">
          Quem cancelou?
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleActorSelect("cliente")}
            className={cn(
              "h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              cancelledBy === "cliente"
                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                : "bg-background text-foreground border-border/80 hover:bg-muted/60"
            )}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => handleActorSelect("estudio")}
            className={cn(
              "h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              cancelledBy === "estudio"
                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                : "bg-background text-foreground border-border/80 hover:bg-muted/60"
            )}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Eu (Estúdio)</span>
          </button>
        </div>
      </div>

      {cancelledBy && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Motivo do cancelamento
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((item) => {
              const selected = reason === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    onChange({
                      cancelledBy,
                      reason: item,
                      notes,
                    })
                  }
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                    selected
                      ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                      : "bg-background text-foreground border-border/80 hover:bg-muted/50"
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {cancelledBy && reason && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            {reason === "Outro" ? "Qual foi o motivo?" : "Detalhe (opcional)"}
          </Label>
          <Input
            value={notes}
            onChange={(e) =>
              onChange({
                cancelledBy,
                reason,
                notes: e.target.value,
              })
            }
            placeholder={
              reason === "Outro"
                ? "Descreva o motivo..."
                : "Observação rápida..."
            }
            className="h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm"
          />
        </div>
      )}
    </div>
  );
}
