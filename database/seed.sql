-- ============================================================
-- DADOS INICIAIS - NOXUS LUIZART
-- ============================================================

-- Inserção do Administrador com Código de Acesso: NOXUS-ADMIN
INSERT INTO users (id, email, access_code, name, whatsapp, role, is_active)
VALUES (
    'admin-noxus-luizart-001',
    'admin@noxusluizart.com',
    'NOXUS-ADMIN',
    'Luizart Admin',
    '5511999999999',
    'ADMIN',
    TRUE
) ON CONFLICT (access_code) DO NOTHING;
