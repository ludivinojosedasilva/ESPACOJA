-- ============================================================
-- SISTEMA: EspaçoJá Real
-- GUIA COMPLETO DE COMANDOS SQL - v2 (Atualizado)
-- Professor: Alexandre Leopoldo Gonçalves
-- Disciplina: Banco de Dados I - DEC7129 - 2026.1
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
  id_tipo          INT           NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(100)  NOT NULL,
  descricao        TEXT,
  percentual_multa DECIMAL(5,2)  DEFAULT 10.00,
  PRIMARY KEY (id_tipo)
);

CREATE TABLE usuario (
  id_usuario   INT          NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(150) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  senha        VARCHAR(255) NOT NULL,
  telefone     VARCHAR(20),
  tipo_usuario ENUM('PROPRIETARIO','LOCATARIO') NOT NULL,
  tipo_pessoa  ENUM('FISICA','JURIDICA'),
  cpf          VARCHAR(14),
  cnpj         VARCHAR(18),
  PRIMARY KEY (id_usuario)
);

CREATE TABLE proprietario (
  id_usuario INT NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_prop_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE locatario (
  id_usuario INT NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_loc_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pessoa_fisica (
  id_usuario INT      NOT NULL,
  cpf        CHAR(11) NOT NULL UNIQUE,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pf_locatario
    FOREIGN KEY (id_usuario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE pessoa_juridica (
  id_usuario INT      NOT NULL,
  cnpj       CHAR(14) NOT NULL UNIQUE,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pj_locatario
    FOREIGN KEY (id_usuario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE forma_pagamento (
  id_forma INT          NOT NULL AUTO_INCREMENT,
  nome     VARCHAR(100) NOT NULL,
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
  id_imagem  INT          NOT NULL AUTO_INCREMENT,
  url_imagem VARCHAR(500) NOT NULL,
  descricao  VARCHAR(255),
  id_espaco  INT          NOT NULL,
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
  id_avaliacao   INT     NOT NULL AUTO_INCREMENT,
  id_reserva     INT,
  tipo_avaliacao ENUM('LOCATARIO_AVALIA_ESPACO','PROPRIETARIO_AVALIA_LOCATARIO')
                         NOT NULL DEFAULT 'LOCATARIO_AVALIA_ESPACO',
  comentario     TEXT,
  nota           TINYINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  id_espaco      INT     NOT NULL,
  id_locatario   INT     NOT NULL,
  PRIMARY KEY (id_avaliacao),
  CONSTRAINT fk_aval_reserva
    FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_aval_espaco
    FOREIGN KEY (id_espaco) REFERENCES espaco(id_espaco)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_aval_locatario
    FOREIGN KEY (id_locatario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE nota (
  id_nota    INT           NOT NULL AUTO_INCREMENT,
  data_nota  DATE          NOT NULL,
  valor_nota DECIMAL(10,2) NOT NULL,
  id_reserva INT           NOT NULL UNIQUE,
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
-- Execute o ficheiro seed_data_v3.sql
-- ============================================================

-- ============================================================
-- PASSO 4: VERIFICAR OS DADOS
-- ============================================================

SELECT COUNT(*) AS total_usuarios   FROM usuario;
SELECT COUNT(*) AS total_espacos    FROM espaco;
SELECT COUNT(*) AS total_reservas   FROM reserva;
SELECT COUNT(*) AS total_avaliacoes FROM avaliacao;
SELECT COUNT(*) AS total_pagamentos FROM pagamento;

-- Ver tipos com percentual de multa
SELECT nome, percentual_multa FROM tipo_espaco ORDER BY percentual_multa DESC;

-- ============================================================
-- PASSO 5: CRUD PARA DEMONSTRAÇÃO
-- ============================================================

-- INSERT: Novo tipo de espaço
INSERT INTO tipo_espaco (nome, descricao, percentual_multa)
VALUES ('Piscina', 'Área com piscina para eventos', 10.00);

-- SELECT: Ver todos os tipos
SELECT * FROM tipo_espaco;

-- UPDATE: Atualizar preço de um espaço
SET SQL_SAFE_UPDATES = 0;
UPDATE espaco SET valor_hora = 175.00 WHERE id_espaco = 1;
SET SQL_SAFE_UPDATES = 1;

-- SELECT: Confirmar atualização
SELECT id_espaco, nome, valor_hora FROM espaco WHERE id_espaco = 1;

-- DELETE: Remover tipo de espaço criado
DELETE FROM tipo_espaco WHERE nome = 'Piscina';

-- UPDATE: Atualizar status de reserva
SET SQL_SAFE_UPDATES = 0;
UPDATE reserva SET status = 'CONFIRMADA' WHERE id_reserva = 3;
SET SQL_SAFE_UPDATES = 1;

-- SELECT: Ver reservas por status
SELECT status, COUNT(*) AS total FROM reserva GROUP BY status;

-- ============================================================
-- PASSO 6: AS 3 CONSULTAS SQL COM AGREGAÇÃO
-- ============================================================

-- CONSULTA 1: Receita por tipo de espaço
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

-- CONSULTA 2: Média de avaliações por espaço (locatário avalia espaço)
SELECT
  e.nome                        AS espaco,
  u.nome                        AS proprietario,
  COUNT(a.id_avaliacao)         AS total_avaliacoes,
  ROUND(AVG(a.nota), 2)         AS media_nota
FROM espaco    e
JOIN usuario   u  ON u.id_usuario = e.id_proprietario
JOIN avaliacao a  ON a.id_espaco  = e.id_espaco
WHERE a.tipo_avaliacao = 'LOCATARIO_AVALIA_ESPACO'
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

-- ============================================================
-- PASSO 7: CONSULTAS EXTRAS PARA DEMONSTRAÇÃO
-- ============================================================

-- Ver reservas com desconto aplicado
SELECT r.id_reserva, e.nome AS espaco, u.nome AS locatario,
       r.valor_total, r.valor_desconto, r.status
FROM reserva r
JOIN espaco  e ON e.id_espaco   = r.id_espaco
JOIN usuario u ON u.id_usuario  = r.id_locatario
WHERE r.valor_desconto > 0;

-- Ver reservas canceladas com multa
SELECT r.id_reserva, e.nome AS espaco, u.nome AS locatario,
       r.valor_total, r.valor_multa, te.percentual_multa
FROM reserva     r
JOIN espaco      e  ON e.id_espaco = r.id_espaco
JOIN tipo_espaco te ON te.id_tipo  = e.id_tipo
JOIN usuario     u  ON u.id_usuario = r.id_locatario
WHERE r.status = 'CANCELADA' AND r.valor_multa > 0;

-- Ver avaliações bidirecionais
SELECT
  a.tipo_avaliacao,
  u_avaliador.nome AS avaliador,
  e.nome           AS espaco,
  a.nota,
  a.comentario
FROM avaliacao a
JOIN usuario u_avaliador ON u_avaliador.id_usuario = a.id_locatario
JOIN espaco  e           ON e.id_espaco            = a.id_espaco
ORDER BY a.tipo_avaliacao, a.id_avaliacao;

-- ============================================================
-- PASSO 8: APAGAR TUDO (para reiniciar os testes)
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

SELECT COUNT(*) AS total FROM usuario;

-- ============================================================
-- FIM DO GUIA v2
-- ============================================================
