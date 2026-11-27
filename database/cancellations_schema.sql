-- ============================================================
-- RASTREAMENTO DE CANCELAMENTOS - NOXUS LUIZART (Schema: luizart)
-- ============================================================

ALTER TABLE luizart.appointments
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ NULL;

ALTER TABLE luizart.appointments
  DROP CONSTRAINT IF EXISTS appointments_cancelled_by_check;

ALTER TABLE luizart.appointments
  ADD CONSTRAINT appointments_cancelled_by_check
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('cliente', 'estudio'));

CREATE INDEX IF NOT EXISTS idx_luizart_appointments_cancelled_by
  ON luizart.appointments (cancelled_by)
  WHERE status = 'Cancelado';
