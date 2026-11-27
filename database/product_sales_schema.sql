-- ============================================================
-- PRODUTOS ADICIONAIS NA BAIXA - NOXUS LUIZART (Schema: luizart)
-- ============================================================

ALTER TABLE luizart.inventory_items
  ADD COLUMN IF NOT EXISTS is_sellable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE luizart.appointments
  ADD COLUMN IF NOT EXISTS additional_products JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_luizart_inventory_items_sellable
  ON luizart.inventory_items (is_sellable)
  WHERE is_sellable = true;
