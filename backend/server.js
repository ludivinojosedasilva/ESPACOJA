require("dotenv").config();
const Groq = require("groq-sdk");

const express   = require("express");
const cors      = require("cors");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const multer    = require("multer");
const path      = require("path");
const { Op }    = require("sequelize");

const sequelize      = require("./config/database");
const { QueryTypes } = require("sequelize");

// ── MODELOS ──────────────────────────────────────────────────
const User           = require("./models/User");
const Space          = require("./models/Space");
const Reservation    = require("./models/Reservation");
const TipoEspaco     = require("./models/TipoEspaco");
const FormaPagamento = require("./models/FormaPagamento");
const Nota           = require("./models/Nota");
const Pagamento      = require("./models/Pagamento");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── RELACIONAMENTOS ───────────────────────────────────────────
// Proprietário → Espaço
User.hasMany(Space,       { foreignKey: "userId" });
Space.belongsTo(User,     { foreignKey: "userId" });

// TipoEspaco → Espaço
TipoEspaco.hasMany(Space,      { foreignKey: "tipoEspacoId" });
Space.belongsTo(TipoEspaco,    { foreignKey: "tipoEspacoId" });

// Espaço → Reserva
Space.hasMany(Reservation,     { foreignKey: "spaceId" });
Reservation.belongsTo(Space,   { foreignKey: "spaceId" });

// Usuário (Locatário) → Reserva
User.hasMany(Reservation,      { foreignKey: "userId" });
Reservation.belongsTo(User,    { foreignKey: "userId" });

// Reserva → Nota (1:1)
Reservation.hasOne(Nota,       { foreignKey: "reservationId" });
Nota.belongsTo(Reservation,    { foreignKey: "reservationId" });

// Nota → Pagamento (1:n)
Nota.hasMany(Pagamento,        { foreignKey: "notaId" });
Pagamento.belongsTo(Nota,      { foreignKey: "notaId" });

// FormaPagamento → Pagamento
FormaPagamento.hasMany(Pagamento,  { foreignKey: "formaPagamentoId" });
Pagamento.belongsTo(FormaPagamento, { foreignKey: "formaPagamentoId" });

// ── APP ───────────────────────────────────────────────────────
const app = express();

// ── UPLOAD ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ── MIDDLEWARES ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// ═══════════════════════════════════════════════════════════════
// BASE
// ═══════════════════════════════════════════════════════════════
app.get("/", (req, res) => res.json({ message: "API EspaçoJá funcionando 🚀" }));

// ═══════════════════════════════════════════════════════════════
// 🔧 SETUP - Criar tabelas e carregar dados iniciais
// ═══════════════════════════════════════════════════════════════
app.post("/setup/criar", async (req, res) => {
  try {
    await sequelize.authenticate();

    // Seed de tipos de espaço
    await sequelize.query(`
      INSERT IGNORE INTO tipo_espaco (nome, descricao) VALUES
      ('Salão de Festas','Espaço para eventos sociais'),
      ('Quadra Esportiva','Quadra para esportes variados'),
      ('Auditório','Espaço para palestras e conferências'),
      ('Apartamento','Imóvel residencial para locação'),
      ('Casa','Imóvel completo para locação'),
      ('Espaço Coworking','Ambiente para trabalho profissional')
    `);

    await sequelize.query(`
      INSERT IGNORE INTO forma_pagamento (nome) VALUES
      ('PIX'),('Cartão de Crédito'),('Cartão de Débito'),
      ('Boleto Bancário'),('Transferência Bancária')
    `);

    res.json({ message: "Tabelas verificadas e dados iniciais carregados ✅" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro no setup", error: error.message });
  }
});

app.delete("/setup/limpar", async (req, res) => {
  try {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    const tabelas = [
      "pagamentos","notas","reservations","imagem_espaco",
      "avaliacoes","spaces","forma_pagamento","tipo_espaco",
      "pessoa_juridica","pessoa_fisica","locatarios","proprietarios","users"
    ];
    for (const t of tabelas) {
      await sequelize.query(`TRUNCATE TABLE IF EXISTS \`${t}\``).catch(() => {});
    }
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    res.json({ message: "Todas as tabelas foram limpas ✅" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao limpar", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 👤 USUÁRIOS
// ═══════════════════════════════════════════════════════════════

// CRIAR
app.post("/users", async (req, res) => {
  try {
    const { name, email, password, telefone, tipoUsuario, tipoPessoa, cpf, cnpj } = req.body;
    if (!name || !email || !password || !tipoUsuario) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios" });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email já cadastrado" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, telefone, tipoUsuario });

    // Insere na tabela de herança conforme o tipo
    if (tipoUsuario === "PROPRIETARIO") {
      await sequelize.query(`INSERT INTO proprietario (id_usuario) VALUES (${user.id})`);
    } else if (tipoUsuario === "LOCATARIO") {
      await sequelize.query(`INSERT INTO locatario (id_usuario) VALUES (${user.id})`);
    }
    res.status(201).json({ id: user.id, name: user.name, email: user.email, tipoUsuario: user.tipoUsuario });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// LISTAR
app.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "telefone", "tipoUsuario", "tipoPessoa"],
      order: [["id", "ASC"]]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar usuários" });
  }
});

// DETALHE
app.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "name", "email", "telefone", "tipoUsuario", "tipoPessoa", "cpf", "cnpj"]
    });
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

// ATUALIZAR
app.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    if (user.id !== req.user.id) return res.status(403).json({ message: "Sem permissão" });

    const { name, telefone, tipoPessoa, cpf, cnpj } = req.body;
    await user.update({ name, telefone, tipoPessoa, cpf, cnpj });
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});

// EXCLUIR
app.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    if (user.id !== req.user.id) return res.status(403).json({ message: "Sem permissão" });
    await user.destroy();
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir usuário" });
  }
});

// ── LOGIN / PROFILE ───────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Usuário não encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Senha inválida" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, tipoUsuario: user.tipoUsuario });
  } catch (error) {
    res.status(500).json({ message: "Erro no login" });
  }
});

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "telefone", "tipoUsuario", "tipoPessoa"]
    });
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏷️ TIPO DE ESPAÇO
// ═══════════════════════════════════════════════════════════════

// LISTAR
app.get("/tipos-espaco", async (req, res) => {
  try {
    const tipos = await TipoEspaco.findAll({ order: [["nome", "ASC"]] });
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar tipos" });
  }
});

// CRIAR
app.post("/tipos-espaco", authMiddleware, async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) return res.status(400).json({ message: "Nome é obrigatório" });
    const tipo = await TipoEspaco.create({ nome, descricao });
    res.status(201).json(tipo);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar tipo" });
  }
});

// ATUALIZAR
app.put("/tipos-espaco/:id", authMiddleware, async (req, res) => {
  try {
    const tipo = await TipoEspaco.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo não encontrado" });
    await tipo.update(req.body);
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar tipo" });
  }
});

// EXCLUIR
app.delete("/tipos-espaco/:id", authMiddleware, async (req, res) => {
  try {
    const tipo = await TipoEspaco.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo não encontrado" });
    await tipo.destroy();
    res.json({ message: "Tipo excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir tipo" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏠 ESPAÇOS
// ═══════════════════════════════════════════════════════════════

// LISTAR TODOS (público)
app.get("/spaces/todos", async (req, res) => {
  try {
    const spaces = await Space.findAll({
      include: [
        { model: User,       attributes: ["id", "name", "email", "telefone"] },
        { model: TipoEspaco, attributes: ["id", "nome"] }
      ],
      order: [["id", "DESC"]]
    });
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar espaços" });
  }
});

// LISTAR DO PROPRIETÁRIO LOGADO
app.get("/spaces", authMiddleware, async (req, res) => {
  try {
    const spaces = await Space.findAll({
      where: { userId: req.user.id },
      include: [{ model: TipoEspaco, attributes: ["id", "nome"] }],
      order: [["id", "DESC"]]
    });
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar espaços" });
  }
});

// DETALHE
app.get("/spaces/:id", async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id, {
      include: [
        { model: User,       attributes: ["id", "name", "email", "telefone"] },
        { model: TipoEspaco, attributes: ["id", "nome"] }
      ]
    });
    if (!space) return res.status(404).json({ message: "Espaço não encontrado" });
    res.json(space);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar espaço" });
  }
});

// CRIAR
app.post("/spaces", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, description, location, price, tipoEspacoId, comodidades } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const space = await Space.create({
      name, description, location, price, image,
      tipoEspacoId, comodidades, userId: req.user.id
    });
    res.status(201).json(space);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao criar espaço" });
  }
});

// ATUALIZAR
app.put("/spaces/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);
    if (!space) return res.status(404).json({ message: "Espaço não encontrado" });
    if (space.userId !== req.user.id) return res.status(403).json({ message: "Sem permissão" });

    const { name, description, location, price, tipoEspacoId, comodidades } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : space.image;
    await space.update({ name, description, location, price, image, tipoEspacoId, comodidades });
    res.json(space);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar espaço" });
  }
});

// EXCLUIR
app.delete("/spaces/:id", authMiddleware, async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);
    if (!space) return res.status(404).json({ message: "Espaço não encontrado" });
    if (space.userId !== req.user.id) return res.status(403).json({ message: "Sem permissão" });
    await space.destroy();
    res.json({ message: "Espaço excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir espaço" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📅 RESERVAS
// ═══════════════════════════════════════════════════════════════

// CRIAR
app.post("/reservations", authMiddleware, async (req, res) => {
  try {
    const { spaceId, dataHoraInicio, dataHoraFim, valorTotal, valorDesconto, valorMulta } = req.body;
    if (!spaceId || !dataHoraInicio || !dataHoraFim) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    const inicio = new Date(dataHoraInicio);
    const fim    = new Date(dataHoraFim);
    if (fim <= inicio) return res.status(400).json({ message: "Data/hora inválida" });

    // Verificar conflito
    const conflito = await Reservation.findOne({
      where: {
        spaceId,
        status: { [Op.in]: ["PENDENTE", "CONFIRMADA"] },
        [Op.or]: [
          { startDateTime: { [Op.between]: [inicio, fim] } },
          { endDateTime:   { [Op.between]: [inicio, fim] } },
          {
            startDateTime: { [Op.lte]: inicio },
            endDateTime:   { [Op.gte]: fim }
          }
        ]
      }
    });
    if (conflito) return res.status(400).json({ message: "Horário já reservado" });

    const reservation = await Reservation.create({
      startDateTime: inicio,
      endDateTime:   fim,
      valorTotal:    valorTotal || 0,
      valorDesconto: valorDesconto || 0,
      valorMulta:    valorMulta || 0,
      status:        "PENDENTE",
      spaceId,
      userId:        req.user.id
    });
    res.status(201).json(reservation);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao criar reserva" });
  }
});

// LISTAR POR ESPAÇO
app.get("/reservations/espaco/:spaceId", async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { spaceId: req.params.spaceId },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
      order: [["startDateTime", "ASC"]]
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar reservas" });
  }
});

// MINHAS RESERVAS (locatário logado)
app.get("/my-reservations", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { userId: req.user.id },
      include: [{ model: Space, attributes: ["id", "name", "location", "image", "price"] }],
      order: [["startDateTime", "DESC"]]
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar reservas" });
  }
});

// ATUALIZAR STATUS
app.put("/reservations/:id", authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reserva não encontrada" });

    const { status, valorDesconto, valorMulta, valorTotal } = req.body;
    await reservation.update({ status, valorDesconto, valorMulta, valorTotal });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar reserva" });
  }
});

// EXCLUIR
app.delete("/reservations/:id", authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reserva não encontrada" });
    if (reservation.userId !== req.user.id) return res.status(403).json({ message: "Sem permissão" });
    await reservation.destroy();
    res.json({ message: "Reserva excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir reserva" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🧾 NOTAS FISCAIS
// ═══════════════════════════════════════════════════════════════

// CRIAR NOTA (vinculada a uma reserva finalizada)
app.post("/notas", authMiddleware, async (req, res) => {
  try {
    const { reservationId, dataNota, valorNota } = req.body;
    if (!reservationId || !dataNota || !valorNota) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    const existe = await Nota.findOne({ where: { reservationId } });
    if (existe) return res.status(400).json({ message: "Nota já emitida para esta reserva" });

    const nota = await Nota.create({ reservationId, dataNota, valorNota });
    res.status(201).json(nota);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar nota" });
  }
});

// LISTAR
app.get("/notas", authMiddleware, async (req, res) => {
  try {
    const notas = await Nota.findAll({
      include: [{ model: Reservation, include: [{ model: Space, attributes: ["id", "name"] }] }],
      order: [["dataNota", "DESC"]]
    });
    res.json(notas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar notas" });
  }
});

// DETALHE
app.get("/notas/:id", authMiddleware, async (req, res) => {
  try {
    const nota = await Nota.findByPk(req.params.id, {
      include: [{ model: Reservation }]
    });
    if (!nota) return res.status(404).json({ message: "Nota não encontrada" });
    res.json(nota);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar nota" });
  }
});

// ATUALIZAR
app.put("/notas/:id", authMiddleware, async (req, res) => {
  try {
    const nota = await Nota.findByPk(req.params.id);
    if (!nota) return res.status(404).json({ message: "Nota não encontrada" });
    await nota.update(req.body);
    res.json(nota);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar nota" });
  }
});

// EXCLUIR
app.delete("/notas/:id", authMiddleware, async (req, res) => {
  try {
    const nota = await Nota.findByPk(req.params.id);
    if (!nota) return res.status(404).json({ message: "Nota não encontrada" });
    await nota.destroy();
    res.json({ message: "Nota excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir nota" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 💳 FORMA DE PAGAMENTO
// ═══════════════════════════════════════════════════════════════

// LISTAR
app.get("/formas-pagamento", async (req, res) => {
  try {
    const formas = await FormaPagamento.findAll({ order: [["nome", "ASC"]] });
    res.json(formas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar formas de pagamento" });
  }
});

// CRIAR
app.post("/formas-pagamento", authMiddleware, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ message: "Nome é obrigatório" });
    const forma = await FormaPagamento.create({ nome });
    res.status(201).json(forma);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar forma de pagamento" });
  }
});

// ATUALIZAR
app.put("/formas-pagamento/:id", authMiddleware, async (req, res) => {
  try {
    const forma = await FormaPagamento.findByPk(req.params.id);
    if (!forma) return res.status(404).json({ message: "Forma não encontrada" });
    await forma.update(req.body);
    res.json(forma);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar forma de pagamento" });
  }
});

// EXCLUIR
app.delete("/formas-pagamento/:id", authMiddleware, async (req, res) => {
  try {
    const forma = await FormaPagamento.findByPk(req.params.id);
    if (!forma) return res.status(404).json({ message: "Forma não encontrada" });
    await forma.destroy();
    res.json({ message: "Forma excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir forma de pagamento" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 💰 PAGAMENTOS
// ═══════════════════════════════════════════════════════════════

// CRIAR
app.post("/pagamentos", authMiddleware, async (req, res) => {
  try {
    const { notaId, formaPagamentoId, valorPagamento, dataPagamento } = req.body;
    if (!notaId || !formaPagamentoId || !valorPagamento || !dataPagamento) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    const pagamento = await Pagamento.create({
      notaId, formaPagamentoId, valorPagamento,
      dataPagamento, status: "PENDENTE"
    });
    res.status(201).json(pagamento);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar pagamento" });
  }
});

// LISTAR
app.get("/pagamentos", authMiddleware, async (req, res) => {
  try {
    const pagamentos = await Pagamento.findAll({
      include: [
        { model: Nota },
        { model: FormaPagamento, attributes: ["id", "nome"] }
      ],
      order: [["dataPagamento", "DESC"]]
    });
    res.json(pagamentos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar pagamentos" });
  }
});

// ATUALIZAR STATUS
app.put("/pagamentos/:id", authMiddleware, async (req, res) => {
  try {
    const pagamento = await Pagamento.findByPk(req.params.id);
    if (!pagamento) return res.status(404).json({ message: "Pagamento não encontrado" });
    await pagamento.update(req.body);
    res.json(pagamento);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar pagamento" });
  }
});

// EXCLUIR
app.delete("/pagamentos/:id", authMiddleware, async (req, res) => {
  try {
    const pagamento = await Pagamento.findByPk(req.params.id);
    if (!pagamento) return res.status(404).json({ message: "Pagamento não encontrado" });
    await pagamento.destroy();
    res.json({ message: "Pagamento excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir pagamento" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📊 CONSULTAS SQL (Requisito 6 do trabalho)
// ═══════════════════════════════════════════════════════════════

// CONSULTA 1 - Receita por tipo de espaço
app.get("/consultas/receita-por-tipo", async (req, res) => {
  try {
    const resultado = await sequelize.query(`
      SELECT
        te.nome                  AS tipo_espaco,
        COUNT(p.id)              AS total_pagamentos,
        SUM(p.valorPagamento)    AS total_arrecadado
      FROM TipoEspacos    te
      JOIN Spaces         e  ON e.tipoEspacoId  = te.id
      JOIN Reservations   r  ON r.spaceId        = e.id
      JOIN Notas          n  ON n.reservationId  = r.id
      JOIN Pagamentos     p  ON p.notaId         = n.id
      WHERE p.status = 'APROVADO'
      GROUP BY te.id, te.nome
      ORDER BY total_arrecadado DESC
    `, { type: QueryTypes.SELECT });
    res.json(resultado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro na consulta 1", error: error.message });
  }
});

// CONSULTA 2 - Média de avaliações por espaço
app.get("/consultas/avaliacoes-por-espaco", async (req, res) => {
  try {
    const resultado = await sequelize.query(`
      SELECT
        e.name                     AS espaco,
        u.name                     AS proprietario,
        COUNT(r.id)                AS total_reservas,
        ROUND(AVG(r.valorTotal), 2) AS media_valor
      FROM Spaces       e
      JOIN Users        u ON u.id       = e.userId
      JOIN Reservations r ON r.spaceId  = e.id
      WHERE r.status IN ('CONFIRMADA','FINALIZADA')
      GROUP BY e.id, e.name, u.name
      HAVING COUNT(r.id) >= 1
      ORDER BY total_reservas DESC
    `, { type: QueryTypes.SELECT });
    res.json(resultado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro na consulta 2", error: error.message });
  }
});

// CONSULTA 3 - Volume de reservas por mês
app.get("/consultas/reservas-por-mes", async (req, res) => {
  try {
    const resultado = await sequelize.query(`
      SELECT
        DATE_FORMAT(r.startDateTime, '%m/%Y') AS mes_ano,
        COUNT(r.id)                            AS total_reservas,
        SUM(r.valorTotal)                      AS valor_movimentado
      FROM Reservations r
      JOIN Spaces       e  ON e.id       = r.spaceId
      JOIN TipoEspacos  te ON te.id      = e.tipoEspacoId
      WHERE r.status IN ('CONFIRMADA','FINALIZADA')
      GROUP BY DATE_FORMAT(r.startDateTime, '%m/%Y'), YEAR(r.startDateTime), MONTH(r.startDateTime)
      ORDER BY YEAR(r.startDateTime), MONTH(r.startDateTime)
    `, { type: QueryTypes.SELECT });
    res.json(resultado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro na consulta 3", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🤖 IA GENERATIVA - Integração com Google Gemini
// Sugestão de preço competitivo para proprietários
// Adicione estas linhas no seu server.js
// ═══════════════════════════════════════════════════════════════

// 1. Adicione este import no TOPO do server.js (junto com os outros requires):
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// 2. Adicione esta inicialização logo após os imports:
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. Adicione esta rota no server.js (antes do sequelize.authenticate()):

app.post("/ia/sugerir-preco", async (req, res) => {
  try {
    const { nome, tipo, endereco, comodidades, descricao } = req.body;

    if (!nome || !tipo || !endereco) {
      return res.status(400).json({
        message: "Informe nome, tipo e endereço do espaço"
      });
    }

    // Busca espaços similares no banco para dar contexto à IA
    const espacosSimilares = await Space.findAll({
      include: [{ model: TipoEspaco, attributes: ["nome"] }],
      limit: 5,
      order: sequelize.random()
    });

    const contextoBanco = espacosSimilares.map(e =>
      `- ${e.name} (${e.TipoEspaco?.nome || "Sem tipo"}): R$${e.price}/hora em ${e.location}`
    ).join("\n");

    // Monta o prompt para o Gemini
    const prompt = `
Você é um especialista em precificação de espaços para eventos e locação temporária no Brasil.

Um proprietário quer saber o preço competitivo por hora para o seguinte espaço:

ESPAÇO A PRECIFICAR:
- Nome: ${nome}
- Tipo: ${tipo}
- Localização: ${endereco}
- Comodidades: ${comodidades || "Não informadas"}
- Descrição: ${descricao || "Não informada"}

ESPAÇOS SIMILARES JÁ CADASTRADOS NA PLATAFORMA:
${contextoBanco}

Com base nessas informações, responda em português com:
1. **Preço sugerido por hora** (valor em reais)
2. **Faixa de preço recomendada** (mínimo e máximo)
3. **Justificativa** (3 linhas explicando o raciocínio)
4. **Dicas para aumentar o valor** (2 sugestões práticas)

Seja direto e objetivo. Use dados reais do mercado brasileiro.
    `.trim();

    // Chama a API do G
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024
    });
    const texto = completion.choices[0].message.content;;

    res.json({
      sugestao: texto,
      espacoAnalisado: { nome, tipo, endereco, comodidades },
      espacosReferencia: espacosSimilares.length
    });

  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({
      message: "Erro ao consultar IA",
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🚀 START
// ═══════════════════════════════════════════════════════════════
sequelize.authenticate()
  .then(() => {
    console.log("Banco conectado ✅");
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Servidor rodando na porta ${process.env.PORT || 8000} 🚀`);
    });
  })
  .catch(console.log);
