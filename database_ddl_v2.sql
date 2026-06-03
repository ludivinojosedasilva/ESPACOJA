-- ============================================================
-- SISTEMA: EspaçoJá Real
-- DDL v2 - Atualizado conforme novo diagrama conceitual
-- ============================================================

USE espacoja;

-- Remover tabelas existentes na ordem correta (FKs)
DROP TABLE IF EXISTS pagamento;
DROP TABLE IF EXISTS nota;
DROP TABLE IF EXISTS avaliacao;
DROP TABLE IF EXISTS reserva;
DROP TABLE IF EXISTS imagem_espaco;
DROP TABLE IF EXISTS espaco;
DROP TABLE IF EXISTS forma_pagamento;
DROP TABLE IF EXISTS pessoa_juridica;
DROP TABLE IF EXISTS pessoa_fisica;
DROP TABLE IF EXISTS locatario;
DROP TABLE IF EXISTS proprietario;
DROP TABLE IF EXISTS tipo_espaco;
DROP TABLE IF EXISTS usuario;

-- ============================================================
-- TIPO_ESPACO
-- ============================================================
CREATE TABLE tipo_espaco (
  id_tipo       INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT,
  PRIMARY KEY (id_tipo)
);

-- ============================================================
-- USUARIO (superentidade)
-- ============================================================
CREATE TABLE usuario (
  id_usuario    INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  senha         VARCHAR(255) NOT NULL,
  telefone      VARCHAR(20),
  tipo_usuario  ENUM('PROPRIETARIO','LOCATARIO') NOT NULL,
  PRIMARY KEY (id_usuario)
);

-- ============================================================
-- PROPRIETARIO (herança de USUARIO)
-- ============================================================
CREATE TABLE proprietario (
  id_usuario    INT NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_prop_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- LOCATARIO (herança de USUARIO)
-- ============================================================
CREATE TABLE locatario (
  id_usuario    INT NOT NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_loc_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- PESSOA_FISICA (especialização de LOCATARIO)
-- ============================================================
CREATE TABLE pessoa_fisica (
  id_usuario    INT         NOT NULL,
  cpf           CHAR(11)    NOT NULL UNIQUE,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pf_locatario
    FOREIGN KEY (id_usuario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- PESSOA_JURIDICA (especialização de LOCATARIO)
-- ============================================================
CREATE TABLE pessoa_juridica (
  id_usuario    INT         NOT NULL,
  cnpj          CHAR(14)    NOT NULL UNIQUE,
  PRIMARY KEY (id_usuario),
  CONSTRAINT fk_pj_locatario
    FOREIGN KEY (id_usuario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- FORMA_PAGAMENTO
-- ============================================================
CREATE TABLE forma_pagamento (
  id_forma      INT          NOT NULL AUTO_INCREMENT,
  nome          VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_forma)
);

-- ============================================================
-- ESPACO
-- Relacionamento "possui" com PROPRIETARIO (1,1)-(1,n)
-- Relacionamento "pertence_a" com TIPO_ESPACO (0,n)-(1,1)
-- ============================================================
CREATE TABLE espaco (
  id_espaco       INT           NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(150)  NOT NULL,
  endereco        VARCHAR(255)  NOT NULL,
  categoria       VARCHAR(100),
  valor_hora      DECIMAL(10,2) NOT NULL,
  comodidades     TEXT,
  descricao       TEXT,
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

-- ============================================================
-- IMAGEM_ESPACO
-- Nova entidade do diagrama - relacionamento "Relacao_1" com ESPACO
-- Um espaço pode ter várias imagens (1,n)
-- ============================================================
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

-- ============================================================
-- RESERVA
-- Atualizado: data_hora_inicio, data_hora_fim (DATETIME)
-- Novos campos: valor_desconto, valor_multa
-- ============================================================
CREATE TABLE reserva (
  id_reserva      INT           NOT NULL AUTO_INCREMENT,
  data_hora_inicio DATETIME     NOT NULL,
  data_hora_fim    DATETIME     NOT NULL,
  status          ENUM('PENDENTE','CONFIRMADA','CANCELADA','FINALIZADA')
                                NOT NULL DEFAULT 'PENDENTE',
  valor_total     DECIMAL(10,2),
  valor_desconto  DECIMAL(10,2) DEFAULT 0.00,
  valor_multa     DECIMAL(10,2) DEFAULT 0.00,
  id_espaco       INT           NOT NULL,
  id_locatario    INT           NOT NULL,
  PRIMARY KEY (id_reserva),
  CONSTRAINT fk_reserva_espaco
    FOREIGN KEY (id_espaco) REFERENCES espaco(id_espaco)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reserva_locatario
    FOREIGN KEY (id_locatario) REFERENCES locatario(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- AVALIACAO
-- Relacionamento entre LOCATARIO e ESPACO
-- ============================================================
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

-- ============================================================
-- NOTA
-- Entidade independente com id_nota, data_nota, valor_nota
-- Relacionamento (1,1) com RESERVA
-- ============================================================
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

-- ============================================================
-- PAGAMENTO
-- Relacionamento (1,n) com NOTA e utiliza FORMA_PAGAMENTO
-- ============================================================
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

-- ============================================================
-- FIM DO SCRIPT DDL v2
-- ============================================================
