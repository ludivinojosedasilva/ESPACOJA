-- ============================================================
-- SISTEMA: EspaçoJá Real
-- GUIA COMPLETO DE COMANDOS SQL PARA APRESENTAÇÃO
-- Professor: Alexandre Leopoldo Gonçalves
-- Disciplina: Banco de Dados I - DEC7129 2026.1
-- ============================================================

-- ============================================================
-- PASSO 1: CRIAR O BANCO DE DADOS
-- ============================================================

CREATE DATABASE IF NOT EXISTS espacoja
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE espacoja;

-- ============================================================
-- PASSO 2: CRIAR AS TABELAS (DDL)
-- ============================================================

CREATE TABLE tipo_espaco (
  id_tipo       INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT,
  PRIMARY KEY (id_tipo)
);

CREATE TABLE usuario (
  id_usuario    INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha         VARCHAR(255) NOT NULL,
  telefone      VARCHAR(20),
  tipo_usuario  ENUM('PROPRIETARIO','LOCATARIO') NOT NULL,
  tipo_pessoa   ENUM('FISICA','JURIDICA'),
  cpf           VARCHAR(14),
  cnpj          VARCHAR(18),
  PRIMARY KEY (id_usuario)
);

CREATE TABLE proprietario (
  id_usuario    INT NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_prop_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE locatario (
  id_usuario    INT NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_loc_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pessoa_fisica (
  id_usuario    INT         NOT NULL,
  cpf           CHAR(11)    NOT NULL UNIQUE,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pf_locatario
    FOREIGN KEY (id_usuario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pessoa_juridica (
  id_usuario    INT         NOT NULL,
  cnpj          CHAR(14)    NOT NULL UNIQUE,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pj_locatario
    FOREIGN KEY (id_usuario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE forma_pagamento (
  id_forma      INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_forma)
);

CREATE TABLE espaco (
  id_espaco       INT           NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(150)  NOT NULL,
  endereco        VARCHAR(255)  NOT NULL,
  categoria       VARCHAR(100),
  valor_hora      DECIMAL(10,2) NOT NULL,
  comodidades     TEXT,
  descricao       TEXT,
  imagem          VARCHAR(255),
  id_tipo         INT,
  id_proprietario INT           NOT NULL,
  PRIMARY KEY (id_espaco),
  CONSTRAINT fk_espaco_tipo
    FOREIGN KEY (id_tipo) REFERENCES tipo_espaco(id_tipo)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_espaco_prop
    FOREIGN KEY (id_proprietario) REFERENCES proprietario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE imagem_espaco (
  id_imagem     INT          NOT NULL AUTO_INCREMENT,
  url_imagem    VARCHAR(500) NOT NULL,
  descricao     VARCHAR(255),
  id_espaco     INT          NOT NULL,
  PRIMARY KEY (id_imagem),
  CONSTRAINT fk_imagem_espaco
    FOREIGN KEY (id_espaco) REFERENCES espaco(id_espaco)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reserva (
  id_reserva       INT           NOT NULL AUTO_INCREMENT,
  data_hora_inicio DATETIME      NOT NULL,
  data_hora_fim    DATETIME      NOT NULL,
  status           ENUM('PENDENTE','CONFIRMADA','CANCELADA','FINALIZADA')
                                 NOT NULL DEFAULT 'PENDENTE',
  valor_total      DECIMAL(10,2),
  valor_desconto   DECIMAL(10,2) DEFAULT 0.00,
  valor_multa      DECIMAL(10,2) DEFAULT 0.00,
  id_espaco        INT           NOT NULL,
  id_locatario     INT           NOT NULL,
  PRIMARY KEY (id_reserva),
  CONSTRAINT fk_reserva_espaco
    FOREIGN KEY (id_espaco) REFERENCES espaco(id_espaco)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reserva_locatario
    FOREIGN KEY (id_locatario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE avaliacao (
  id_avaliacao  INT     NOT NULL AUTO_INCREMENT,
  comentario    TEXT,
  nota          TINYINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  id_espaco     INT     NOT NULL,
  id_locatario  INT     NOT NULL,
  PRIMARY KEY (id_avaliacao),
  CONSTRAINT fk_aval_espaco
    FOREIGN KEY (id_espaco) REFERENCES espaco(id_espaco)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_aval_locatario
    FOREIGN KEY (id_locatario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE nota (
  id_nota       INT           NOT NULL AUTO_INCREMENT,
  data_nota     DATE          NOT NULL,
  valor_nota    DECIMAL(10,2) NOT NULL,
  id_reserva    INT           NOT NULL UNIQUE,
  PRIMARY KEY (id_nota),
  CONSTRAINT fk_nota_reserva
    FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pagamento (
  id_pagamento    INT           NOT NULL AUTO_INCREMENT,
  data_pagamento  DATE          NOT NULL,
  valor_pagamento DECIMAL(10,2) NOT NULL,
  status          ENUM('PENDENTE','APROVADO','RECUSADO','ESTORNADO')
                                NOT NULL DEFAULT 'PENDENTE',
  id_nota         INT           NOT NULL,
  id_forma        INT           NOT NULL,
  PRIMARY KEY (id_pagamento),
  CONSTRAINT fk_pag_nota
    FOREIGN KEY (id_nota) REFERENCES nota(id_nota)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pag_forma
    FOREIGN KEY (id_forma) REFERENCES forma_pagamento(id_forma)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Confirma tabelas criadas
SHOW TABLES;

-- ============================================================
-- PASSO 3: INSERIR DADOS (SEED)
-- ============================================================

-- Tipos de espaço
INSERT INTO tipo_espaco (nome, descricao) VALUES
  ('Salão de Festas',  'Espaço para eventos sociais e comemorações'),
  ('Quadra Esportiva', 'Quadra para prática de esportes variados'),
  ('Auditório',        'Espaço para palestras, reuniões e conferências'),
  ('Apartamento',      'Imóvel residencial para locação temporária'),
  ('Casa',             'Imóvel residencial completo para locação'),
  ('Espaço Coworking', 'Ambiente compartilhado para trabalho profissional');

-- Formas de pagamento
INSERT INTO forma_pagamento (nome) VALUES
  ('PIX'),
  ('Cartão de Crédito'),
  ('Cartão de Débito'),
  ('Boleto Bancário'),
  ('Transferência Bancária');

-- Usuários (senha = "senha123" em bcrypt para todos)
INSERT INTO usuario (nome, email, senha, telefone, tipo_usuario) VALUES
  ('Carlos Mendes',  'carlos@email.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990001', 'PROPRIETARIO'),
  ('Ana Souza',      'ana@email.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990002', 'PROPRIETARIO'),
  ('Roberto Lima',   'roberto@email.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990003', 'PROPRIETARIO'),
  ('Fernanda Costa', 'fernanda@email.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990004', 'LOCATARIO'),
  ('João Pereira',   'joao@email.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990005', 'LOCATARIO'),
  ('Mariana Alves',  'mariana@email.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990006', 'LOCATARIO'),
  ('Pedro Oliveira', 'pedro@email.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990007', 'LOCATARIO'),
  ('Lucia Ferreira', 'lucia@email.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990008', 'LOCATARIO'),
  ('Marcos Rocha',   'marcos@email.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '51999990009', 'LOCATARIO'),
  ('Beatriz Santos', 'beatriz@email.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2', '48999990010', 'LOCATARIO');

-- Herança
INSERT INTO proprietario (id_usuario) VALUES (1), (2), (3);
INSERT INTO locatario (id_usuario) VALUES (4), (5), (6), (7), (8), (9), (10);

-- Pessoa física e jurídica
INSERT INTO pessoa_fisica (id_usuario, cpf) VALUES
  (4, '12345678901'), (5, '23456789012'), (6, '34567890123'),
  (7, '45678901234'), (8, '56789012345');

INSERT INTO pessoa_juridica (id_usuario, cnpj) VALUES
  (9, '12345678000190'), (10, '98765432000110');

-- Espaços
INSERT INTO espaco (nome, endereco, categoria, valor_hora, comodidades, descricao, id_tipo, id_proprietario) VALUES
  ('Salão Estrela',      'Rua das Flores, 100 - Porto Alegre/RS',       'Eventos',     150.00, 'Ar-condicionado, Som, Projetor',          'Salão amplo para festas e eventos corporativos.',    1, 1),
  ('Quadra Arena Sul',   'Av. Ipiranga, 500 - Porto Alegre/RS',         'Esportes',     80.00, 'Vestiário, Iluminação, Estacionamento',   'Quadra poliesportiva coberta.',                      2, 1),
  ('Auditório Central',  'Rua Sete de Setembro, 200 - Florianópolis/SC','Corporativo', 200.00, 'Projetor 4K, Microfone, Wi-Fi',           'Auditório moderno para até 150 pessoas.',            3, 2),
  ('Apto Vista Mar',     'Av. Beira Mar Norte, 800 - Florianópolis/SC', 'Residencial', 120.00, 'Wi-Fi, Cozinha, 2 quartos, Vista mar',    'Apartamento sofisticado com vista para o mar.',      4, 2),
  ('Casa da Serra',      'Rua das Araucárias, 45 - Gramado/RS',         'Residencial',  90.00, 'Churrasqueira, Lareira, Jardim',          'Casa charmosa na serra gaúcha.',                     5, 3),
  ('Coworking StartHub', 'Av. Carlos Gomes, 300 - Porto Alegre/RS',     'Profissional', 45.00, 'Wi-Fi Fibra, Café, Salas de reunião',    'Espaço de coworking moderno.',                       6, 3),
  ('Salão Jardins',      'Rua Coronel Genuíno, 150 - Porto Alegre/RS',  'Eventos',     130.00, 'Cozinha, Banheiros, Estacionamento',      'Salão de festas com área externa e jardim.',         1, 1),
  ('Quadra Beach Tennis','Av. Praia de Belas, 20 - Porto Alegre/RS',    'Esportes',     60.00, 'Areia especial, Iluminação LED',          'Quadra de beach tennis homologada.',                 2, 2);

-- Imagens dos espaços
INSERT INTO imagem_espaco (url_imagem, descricao, id_espaco) VALUES
  ('/uploads/salao-estrela-1.jpg',  'Vista frontal do salão', 1),
  ('/uploads/salao-estrela-2.jpg',  'Interior decorado',      1),
  ('/uploads/quadra-arena-1.jpg',   'Quadra principal',       2),
  ('/uploads/auditorio-1.jpg',      'Vista do palco',         3),
  ('/uploads/auditorio-2.jpg',      'Plateia completa',       3),
  ('/uploads/apto-vista-mar-1.jpg', 'Vista da sacada',        4),
  ('/uploads/casa-serra-1.jpg',     'Fachada da casa',        5),
  ('/uploads/casa-serra-2.jpg',     'Área da churrasqueira',  5),
  ('/uploads/coworking-1.jpg',      'Espaço de trabalho',     6),
  ('/uploads/salao-jardins-1.jpg',  'Área externa com jardim',7),
  ('/uploads/quadra-beach-1.jpg',   'Quadra iluminada',       8);

-- Reservas
INSERT INTO reserva (data_hora_inicio, data_hora_fim, status, valor_total, valor_desconto, valor_multa, id_espaco, id_locatario) VALUES
  ('2026-06-10 14:00:00', '2026-06-10 22:00:00', 'CONFIRMADA', 1200.00,   0.00,   0.00, 1, 4),
  ('2026-06-12 08:00:00', '2026-06-12 12:00:00', 'CONFIRMADA',  320.00,   0.00,   0.00, 2, 5),
  ('2026-06-15 09:00:00', '2026-06-15 17:00:00', 'PENDENTE',   1600.00,   0.00,   0.00, 3, 6),
  ('2026-06-18 10:00:00', '2026-06-18 14:00:00', 'CONFIRMADA',  480.00,  50.00,   0.00, 4, 7),
  ('2026-06-20 12:00:00', '2026-06-20 20:00:00', 'CONFIRMADA',  720.00,   0.00,   0.00, 5, 8),
  ('2026-06-22 08:00:00', '2026-06-22 18:00:00', 'CANCELADA',   450.00,   0.00, 100.00, 6, 9),
  ('2026-06-25 16:00:00', '2026-06-25 23:00:00', 'CONFIRMADA',  910.00,   0.00,   0.00, 7, 10),
  ('2026-07-01 09:00:00', '2026-07-01 13:00:00', 'PENDENTE',    240.00,   0.00,   0.00, 8, 4),
  ('2026-07-05 18:00:00', '2026-07-05 23:00:00', 'CONFIRMADA',  750.00,   0.00,   0.00, 1, 5),
  ('2026-07-10 08:00:00', '2026-07-10 12:00:00', 'FINALIZADA',  320.00,   0.00,   0.00, 2, 6),
  ('2026-05-15 14:00:00', '2026-05-15 22:00:00', 'FINALIZADA', 1200.00,   0.00,   0.00, 1, 7),
  ('2026-05-20 09:00:00', '2026-05-20 17:00:00', 'FINALIZADA', 1600.00, 100.00,   0.00, 3, 8),
  ('2026-04-10 10:00:00', '2026-04-10 18:00:00', 'FINALIZADA',  720.00,   0.00,   0.00, 5, 9),
  ('2026-04-22 08:00:00', '2026-04-22 12:00:00', 'FINALIZADA',  180.00,   0.00,   0.00, 6, 10),
  ('2026-03-05 16:00:00', '2026-03-05 22:00:00', 'FINALIZADA',  780.00,   0.00,   0.00, 7, 4);

-- Avaliações
INSERT INTO avaliacao (comentario, nota, id_espaco, id_locatario) VALUES
  ('Quadra excelente, bem cuidada!',               5, 2,  6),
  ('Auditório incrível, superou as expectativas!', 5, 3,  8),
  ('Salão perfeito para a nossa festa!',           5, 7,  4),
  ('Ótimo salão, atendimento excelente.',          4, 1,  7),
  ('Boa estrutura para coworking.',                4, 6, 10),
  ('Casa bonita mas poderia ter mais vagas.',      3, 5,  9);

-- Notas fiscais (reservas finalizadas)
INSERT INTO nota (data_nota, valor_nota, id_reserva) VALUES
  ('2026-07-10',  320.00, 10),
  ('2026-05-15', 1200.00, 11),
  ('2026-05-20', 1500.00, 12),
  ('2026-04-10',  720.00, 13),
  ('2026-04-22',  180.00, 14),
  ('2026-03-05',  780.00, 15);

-- Pagamentos
INSERT INTO pagamento (data_pagamento, valor_pagamento, status, id_nota, id_forma) VALUES
  ('2026-07-09',  320.00, 'APROVADO', 1, 1),
  ('2026-05-14', 1200.00, 'APROVADO', 2, 2),
  ('2026-05-19', 1500.00, 'APROVADO', 3, 1),
  ('2026-04-09',  720.00, 'APROVADO', 4, 3),
  ('2026-04-21',  180.00, 'APROVADO', 5, 4),
  ('2026-03-04',  780.00, 'APROVADO', 6, 2);

-- ============================================================
-- PASSO 4: VERIFICAR OS DADOS INSERIDOS
-- ============================================================

SELECT COUNT(*) AS total_usuarios    FROM usuario;
SELECT COUNT(*) AS total_espacos     FROM espaco;
SELECT COUNT(*) AS total_reservas    FROM reserva;
SELECT COUNT(*) AS total_avaliacoes  FROM avaliacao;
SELECT COUNT(*) AS total_pagamentos  FROM pagamento;

-- ============================================================
-- PASSO 5: OPERAÇÕES CRUD PARA DEMONSTRAÇÃO
-- ============================================================

-- INSERT: Novo tipo de espaço
INSERT INTO tipo_espaco (nome, descricao)
VALUES ('Piscina', 'Área com piscina para eventos e lazer');

-- SELECT: Ver todos os tipos
SELECT * FROM tipo_espaco;

-- UPDATE: Atualizar preço de um espaço
UPDATE espaco
SET valor_hora = 175.00
WHERE id_espaco = 1;

-- SELECT: Confirmar atualização
SELECT id_espaco, nome, valor_hora FROM espaco WHERE id_espaco = 1;

-- DELETE: Remover tipo de espaço criado (sem FK)
DELETE FROM tipo_espaco WHERE nome = 'Piscina';

-- UPDATE: Atualizar status de uma reserva
UPDATE reserva
SET status = 'CONFIRMADA'
WHERE id_reserva = 3;

-- SELECT: Ver reservas por status
SELECT status, COUNT(*) AS total FROM reserva GROUP BY status;

-- CRIAR nota fiscal
INSERT INTO nota (data_nota, valor_nota, id_reserva)
VALUES (CURDATE(), 320.00, 10);

-- CRIAR pagamento
INSERT INTO pagamento (data_pagamento, valor_pagamento, status, id_nota, id_forma)
VALUES (CURDATE(), 320.00, 'APROVADO', 1, 1);

-- LER pagamentos com forma de pagamento
SELECT p.id_pagamento, p.valor_pagamento, p.status, f.nome AS forma
FROM pagamento p
JOIN forma_pagamento f ON f.id_forma = p.id_forma;

-- ATUALIZAR status do pagamento
UPDATE pagamento SET status = 'ESTORNADO' WHERE id_pagamento = 1;

-- EXCLUIR pagamento
DELETE FROM pagamento WHERE id_pagamento = 1;

-- ============================================================
-- PASSO 6: AS 3 CONSULTAS SQL COM AGREGAÇÃO
-- ============================================================

-- CONSULTA 1: Receita total por tipo de espaço
SELECT
  te.nome                        AS tipo_espaco,
  COUNT(p.id_pagamento)          AS total_pagamentos,
  SUM(p.valor_pagamento)         AS total_arrecadado
FROM tipo_espaco te
JOIN espaco      e  ON e.id_tipo    = te.id_tipo
JOIN reserva     r  ON r.id_espaco  = e.id_espaco
JOIN nota        n  ON n.id_reserva = r.id_reserva
JOIN pagamento   p  ON p.id_nota    = n.id_nota
WHERE p.status = 'APROVADO'
GROUP BY te.id_tipo, te.nome
ORDER BY total_arrecadado DESC;

-- CONSULTA 2: Média de avaliações por espaço
SELECT
  e.nome                        AS espaco,
  u.nome                        AS proprietario,
  COUNT(a.id_avaliacao)         AS total_avaliacoes,
  ROUND(AVG(a.nota), 2)         AS media_nota
FROM espaco    e
JOIN usuario   u  ON u.id_usuario = e.id_proprietario
JOIN avaliacao a  ON a.id_espaco  = e.id_espaco
GROUP BY e.id_espaco, e.nome, u.nome
HAVING COUNT(a.id_avaliacao) >= 1
ORDER BY media_nota DESC;

-- CONSULTA 3: Volume de reservas por mês
SELECT
  DATE_FORMAT(r.data_hora_inicio, '%m/%Y') AS mes_ano,
  COUNT(r.id_reserva)                       AS total_reservas,
  SUM(r.valor_total)                        AS valor_movimentado
FROM reserva     r
JOIN espaco      e  ON e.id_espaco = r.id_espaco
JOIN tipo_espaco te ON te.id_tipo  = e.id_tipo
WHERE r.status IN ('CONFIRMADA', 'FINALIZADA')
GROUP BY DATE_FORMAT(r.data_hora_inicio, '%m/%Y'),
         YEAR(r.data_hora_inicio),
         MONTH(r.data_hora_inicio)
ORDER BY YEAR(r.data_hora_inicio), MONTH(r.data_hora_inicio);

-- Ver todas as notas com dados da reserva e espaço
SELECT 
  n.id_nota,
  n.data_nota,
  n.valor_nota,
  e.nome AS espaco,
  u.nome AS locatario,
  r.status AS status_reserva
FROM nota n
JOIN reserva r ON r.id_reserva = n.id_reserva
JOIN espaco e ON e.id_espaco = r.id_espaco
JOIN usuario u ON u.id_usuario = r.id_locatario
ORDER BY n.data_nota DESC;

-- Ver nota com seus pagamentos
SELECT 
  n.id_nota,
  n.valor_nota,
  p.id_pagamento,
  p.valor_pagamento,
  p.status AS status_pagamento,
  f.nome AS forma_pagamento
FROM nota n
LEFT JOIN pagamento p ON p.id_nota = n.id_nota
LEFT JOIN forma_pagamento f ON f.id_forma = p.id_forma
ORDER BY n.id_nota;

-- ============================================================
-- PASSO 7: APAGAR TUDO (para reiniciar os testes)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE pagamento;
TRUNCATE TABLE nota;
TRUNCATE TABLE avaliacao;
TRUNCATE TABLE reserva;
TRUNCATE TABLE imagem_espaco;
TRUNCATE TABLE espaco;
TRUNCATE TABLE forma_pagamento;
TRUNCATE TABLE tipo_espaco;
TRUNCATE TABLE pessoa_juridica;
TRUNCATE TABLE pessoa_fisica;
TRUNCATE TABLE locatario;
TRUNCATE TABLE proprietario;
TRUNCATE TABLE usuario;
SET FOREIGN_KEY_CHECKS = 1;

-- Confirma que está vazio
SELECT COUNT(*) AS total FROM usuario;

-- ============================================================
-- FIM DO GUIA
-- ============================================================