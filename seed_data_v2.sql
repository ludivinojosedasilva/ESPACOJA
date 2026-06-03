-- ============================================================
-- SISTEMA: EspaçoJá Real
-- SEED v2 - Atualizado conforme novo diagrama conceitual
-- Execute APÓS o database_ddl_v2.sql
-- ============================================================

USE espacoja;

-- 1. TIPOS DE ESPAÇO
INSERT INTO tipo_espaco (nome, descricao) VALUES
  ('Salão de Festas',   'Espaço para eventos sociais e comemorações'),
  ('Quadra Esportiva',  'Quadra para prática de esportes variados'),
  ('Auditório',         'Espaço para palestras, reuniões e conferências'),
  ('Apartamento',       'Imóvel residencial para locação temporária'),
  ('Casa',              'Imóvel residencial completo para locação'),
  ('Espaço Coworking',  'Ambiente compartilhado para trabalho profissional');

-- 2. FORMAS DE PAGAMENTO
INSERT INTO forma_pagamento (nome) VALUES
  ('PIX'),
  ('Cartão de Crédito'),
  ('Cartão de Débito'),
  ('Boleto Bancário'),
  ('Transferência Bancária');

-- 3. USUÁRIOS (senha = "senha123" em bcrypt para todos)
INSERT INTO usuario (nome, email, senha, telefone, tipo_usuario) VALUES
  ('Carlos Mendes',   'carlos@email.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990001', 'PROPRIETARIO'),
  ('Ana Souza',       'ana@email.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990002', 'PROPRIETARIO'),
  ('Roberto Lima',    'roberto@email.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990003', 'PROPRIETARIO'),
  ('Fernanda Costa',  'fernanda@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990004', 'LOCATARIO'),
  ('João Pereira',    'joao@email.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990005', 'LOCATARIO'),
  ('Mariana Alves',   'mariana@email.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990006', 'LOCATARIO'),
  ('Pedro Oliveira',  'pedro@email.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990007', 'LOCATARIO'),
  ('Lucia Ferreira',  'lucia@email.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990008', 'LOCATARIO'),
  ('Marcos Rocha',    'marcos@email.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990009', 'LOCATARIO'),
  ('Beatriz Santos',  'beatriz@email.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990010', 'LOCATARIO');

-- 4. PROPRIETÁRIOS
INSERT INTO proprietario (id_usuario) VALUES (1), (2), (3);

-- 5. LOCATÁRIOS
INSERT INTO locatario (id_usuario) VALUES (4), (5), (6), (7), (8), (9), (10);

-- 6. PESSOA FÍSICA
INSERT INTO pessoa_fisica (id_usuario, cpf) VALUES
  (4, '12345678901'),
  (5, '23456789012'),
  (6, '34567890123'),
  (7, '45678901234'),
  (8, '56789012345');

-- 7. PESSOA JURÍDICA
INSERT INTO pessoa_juridica (id_usuario, cnpj) VALUES
  (9,  '12345678000190'),
  (10, '98765432000110');

-- 8. ESPAÇOS
INSERT INTO espaco (nome, endereco, categoria, valor_hora, comodidades, descricao, id_tipo, id_proprietario) VALUES
  ('Salão Estrela',       'Rua das Flores, 100 - Porto Alegre/RS',       'Eventos',     150.00, 'Ar-condicionado, Som, Projetor',               'Salão amplo para festas e eventos corporativos.',           1, 1),
  ('Quadra Arena Sul',    'Av. Ipiranga, 500 - Porto Alegre/RS',         'Esportes',     80.00, 'Vestiário, Iluminação, Estacionamento',        'Quadra poliesportiva coberta.',                             2, 1),
  ('Auditório Central',   'Rua Sete de Setembro, 200 - Florianópolis/SC','Corporativo', 200.00, 'Projetor 4K, Microfone, Wi-Fi',               'Auditório moderno para até 150 pessoas.',                   3, 2),
  ('Apto Vista Mar',      'Av. Beira Mar Norte, 800 - Florianópolis/SC', 'Residencial', 120.00, 'Wi-Fi, Cozinha, 2 quartos, Vista mar',        'Apartamento sofisticado com vista para o mar.',             4, 2),
  ('Casa da Serra',       'Rua das Araucárias, 45 - Gramado/RS',        'Residencial',  90.00, 'Churrasqueira, Lareira, Jardim, 3 quartos',   'Casa charmosa na serra gaúcha.',                            5, 3),
  ('Coworking StartHub',  'Av. Carlos Gomes, 300 - Porto Alegre/RS',    'Profissional', 45.00, 'Wi-Fi Fibra, Café, Salas de reunião',         'Espaço de coworking moderno.',                              6, 3),
  ('Salão Jardins',       'Rua Coronel Genuíno, 150 - Porto Alegre/RS', 'Eventos',     130.00, 'Cozinha, Banheiros, Estacionamento',          'Salão de festas com área externa e jardim.',                1, 1),
  ('Quadra Beach Tennis', 'Av. Praia de Belas, 20 - Porto Alegre/RS',   'Esportes',     60.00, 'Areia especial, Iluminação LED',              'Quadra de beach tennis homologada.',                        2, 2);

-- 9. IMAGENS DOS ESPAÇOS (nova entidade do diagrama)
INSERT INTO imagem_espaco (url_imagem, descricao, id_espaco) VALUES
  ('/uploads/salao-estrela-1.jpg',      'Vista frontal do salão',      1),
  ('/uploads/salao-estrela-2.jpg',      'Interior decorado',           1),
  ('/uploads/quadra-arena-1.jpg',       'Quadra principal',            2),
  ('/uploads/auditorio-1.jpg',          'Vista do palco',              3),
  ('/uploads/auditorio-2.jpg',          'Plateia completa',            3),
  ('/uploads/apto-vista-mar-1.jpg',     'Vista da sacada',             4),
  ('/uploads/casa-serra-1.jpg',         'Fachada da casa',             5),
  ('/uploads/casa-serra-2.jpg',         'Área da churrasqueira',       5),
  ('/uploads/coworking-1.jpg',          'Espaço de trabalho',          6),
  ('/uploads/salao-jardins-1.jpg',      'Área externa com jardim',     7),
  ('/uploads/quadra-beach-1.jpg',       'Quadra iluminada',            8);

-- 10. RESERVAS (com data_hora_inicio e data_hora_fim - DATETIME)
INSERT INTO reserva (data_hora_inicio, data_hora_fim, status, valor_total, valor_desconto, valor_multa, id_espaco, id_locatario) VALUES
  ('2026-06-10 14:00:00', '2026-06-10 22:00:00', 'CONFIRMADA',  1200.00,    0.00,   0.00, 1, 4),
  ('2026-06-12 08:00:00', '2026-06-12 12:00:00', 'CONFIRMADA',   320.00,    0.00,   0.00, 2, 5),
  ('2026-06-15 09:00:00', '2026-06-15 17:00:00', 'PENDENTE',    1600.00,    0.00,   0.00, 3, 6),
  ('2026-06-18 10:00:00', '2026-06-18 14:00:00', 'CONFIRMADA',   480.00,   50.00,   0.00, 4, 7),
  ('2026-06-20 12:00:00', '2026-06-20 20:00:00', 'CONFIRMADA',   720.00,    0.00,   0.00, 5, 8),
  ('2026-06-22 08:00:00', '2026-06-22 18:00:00', 'CANCELADA',    450.00,    0.00, 100.00, 6, 9),
  ('2026-06-25 16:00:00', '2026-06-25 23:00:00', 'CONFIRMADA',   910.00,    0.00,   0.00, 7, 10),
  ('2026-07-01 09:00:00', '2026-07-01 13:00:00', 'PENDENTE',     240.00,    0.00,   0.00, 8, 4),
  ('2026-07-05 18:00:00', '2026-07-05 23:00:00', 'CONFIRMADA',   750.00,    0.00,   0.00, 1, 5),
  ('2026-07-10 08:00:00', '2026-07-10 12:00:00', 'FINALIZADA',   320.00,    0.00,   0.00, 2, 6),
  ('2026-05-15 14:00:00', '2026-05-15 22:00:00', 'FINALIZADA',  1200.00,    0.00,   0.00, 1, 7),
  ('2026-05-20 09:00:00', '2026-05-20 17:00:00', 'FINALIZADA',  1600.00,  100.00,   0.00, 3, 8),
  ('2026-04-10 10:00:00', '2026-04-10 18:00:00', 'FINALIZADA',   720.00,    0.00,   0.00, 5, 9),
  ('2026-04-22 08:00:00', '2026-04-22 12:00:00', 'FINALIZADA',   180.00,    0.00,   0.00, 6, 10),
  ('2026-03-05 16:00:00', '2026-03-05 22:00:00', 'FINALIZADA',   780.00,    0.00,   0.00, 7, 4);

-- 11. AVALIAÇÕES (relacionamento LOCATARIO-ESPACO)
INSERT INTO avaliacao (comentario, nota, id_espaco, id_locatario) VALUES
  ('Quadra excelente, bem cuidada!',              5, 2,  6),
  ('Auditório incrível, superou as expectativas!',5, 3,  8),
  ('Salão perfeito para a nossa festa!',          5, 7,  4),
  ('Ótimo salão, atendimento excelente.',         4, 1,  7),
  ('Boa estrutura para coworking.',               4, 6, 10),
  ('Casa bonita mas poderia ter mais vagas.',     3, 5,  9);

-- 12. NOTAS (entidade independente, (1,1) com RESERVA finalizada)
INSERT INTO nota (data_nota, valor_nota, id_reserva) VALUES
  ('2026-07-10', 320.00, 10),
  ('2026-05-15', 1200.00, 11),
  ('2026-05-20', 1500.00, 12),
  ('2026-04-10',  720.00, 13),
  ('2026-04-22',  180.00, 14),
  ('2026-03-05',  780.00, 15);

-- 13. PAGAMENTOS (ligados à NOTA, utilizam FORMA_PAGAMENTO)
INSERT INTO pagamento (data_pagamento, valor_pagamento, status, id_nota, id_forma) VALUES
  ('2026-07-09',  320.00, 'APROVADO', 1, 1),
  ('2026-05-14', 1200.00, 'APROVADO', 2, 2),
  ('2026-05-19', 1500.00, 'APROVADO', 3, 1),
  ('2026-04-09',  720.00, 'APROVADO', 4, 3),
  ('2026-04-21',  180.00, 'APROVADO', 5, 4),
  ('2026-03-04',  780.00, 'APROVADO', 6, 2);

-- ============================================================
-- FIM DO SEED v2
-- ============================================================
