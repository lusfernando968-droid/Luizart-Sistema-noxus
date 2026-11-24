-- ============================================================
-- ESTOQUE - NOXUS LUIZART (Schema: luizart)
-- ============================================================

CREATE TABLE IF NOT EXISTS luizart.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    unit TEXT NOT NULL DEFAULT 'un',
    quantity NUMERIC NOT NULL DEFAULT 0,
    min_quantity NUMERIC NOT NULL DEFAULT 5,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    batch_number TEXT NOT NULL DEFAULT '',
    expiration_date DATE NULL,
    supplier TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luizart.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES luizart.inventory_items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
    quantity NUMERIC NOT NULL,
    previous_quantity NUMERIC NOT NULL DEFAULT 0,
    new_quantity NUMERIC NOT NULL DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    total_cost NUMERIC NOT NULL DEFAULT 0,
    batch_number TEXT NOT NULL DEFAULT '',
    expiration_date DATE NULL,
    reason TEXT NOT NULL DEFAULT '',
    financial_transaction_id UUID NULL REFERENCES luizart.financial_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_luizart_inventory_items_category ON luizart.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_luizart_inventory_items_expiration ON luizart.inventory_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_luizart_inventory_movements_item_id ON luizart.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_luizart_inventory_movements_created_at ON luizart.inventory_movements(created_at DESC);

GRANT ALL ON TABLE luizart.inventory_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE luizart.inventory_movements TO anon, authenticated, service_role;
