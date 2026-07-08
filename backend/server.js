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
const Avaliacao = require("./models/Avaliacao");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── RELACIONAMENTOS ───────────────────────────────────────────
User.hasMany(Space,            { foreignKey: "userId" });
Space.belongsTo(User,          { foreignKey: "userId" });

TipoEspaco.hasMany(Space,      { foreignKey: "tipoEspacoId" });
Space.belongsTo(TipoEspaco,    { foreignKey: "tipoEspacoId" });

Space.hasMany(Reservation,     { foreignKey: "spaceId" });
Reservation.belongsTo(Space,   { foreignKey: "spaceId" });

User.hasMany(Reservation,      { foreignKey: "userId" });
Reservation.belongsTo(User,    { foreignKey: "userId" });

Reservation.hasOne(Nota,       { foreignKey: "reservationId" });
Nota.belongsTo(Reservation,    { foreignKey: "reservationId" });

Nota.hasMany(Pagamento,        { foreignKey: "notaId" });
Pagamento.belongsTo(Nota,      { foreignKey: "notaId" });

FormaPagamento.hasMany(Pagamento,   { foreignKey: "formaPagamentoId" });
Pagamento.belongsTo(FormaPagamento, { foreignKey: "formaPagamentoId" });

// Avaliação → Espaço e Usuário
Space.hasMany(Avaliacao,    { foreignKey: "spaceId" });
Avaliacao.belongsTo(Space,  { foreignKey: "spaceId" });
User.hasMany(Avaliacao,     { foreignKey: "userId" });
Avaliacao.belongsTo(User,   { foreignKey: "userId" });

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
// 🔧 SETUP
// ═══════════════════════════════════════════════════════════════
app.post("/setup/criar", async (req, res) => {
  try {
    await sequelize.authenticate();
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
    res.json({ message: "Dados iniciais carregados ✅" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro no setup", error: error.message });
  }
});

app.delete("/setup/limpar", async (req, res) => {
  try {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    const tabelas = [
      "pagamento","nota","avaliacao","reserva","imagem_espaco",
      "espaco","forma_pagamento","tipo_espaco",
      "pessoa_juridica","pessoa_fisica","locatario","proprietario","usuario"
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
    const { name, email, password, telefone, tipoUsuario, cpf, cnpj } = req.body;
    if (!name || !email || !password || !tipoUsuario) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios" });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: "Email já cadastrado" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, telefone, tipoUsuario, cpf, cnpj });

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
      attributes: ["id", "name", "email", "telefone", "tipoUsuario"],
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
      attributes: ["id", "name", "email", "telefone", "tipoUsuario", "cpf", "cnpj"]
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
    const { name, telefone, cpf, cnpj } = req.body;
    await user.update({ name, telefone, cpf, cnpj });
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
    const token = jwt.sign({ id: user.id, email: user.email, tipoUsuario: user.tipoUsuario }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, tipoUsuario: user.tipoUsuario });
  } catch (error) {
    res.status(500).json({ message: "Erro no login" });
  }
});

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "telefone", "tipoUsuario"]
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

app.get("/tipos-espaco", async (req, res) => {
  try {
    const tipos = await TipoEspaco.findAll({ order: [["nome", "ASC"]] });
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar tipos" });
  }
});

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

app.post("/spaces", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, description, location, price, tipoEspacoId, comodidades } = req.body;

    // ✅ VALIDAÇÃO: preço não pode ser negativo ou zero
    if (!price || parseFloat(price) <= 0) {
      return res.status(400).json({ message: "Preço deve ser maior que zero" });
    }

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

app.put("/spaces/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);
    if (!space) return res.status(404).json({ message: "Espaço não encontrado" });
    if (space.userId !== req.user.id) return res.status(403).json({ message: "Sem permissão" });

    const { name, description, location, price, tipoEspacoId, comodidades } = req.body;

    // ✅ VALIDAÇÃO: preço não pode ser negativo ou zero
    if (price && parseFloat(price) <= 0) {
      return res.status(400).json({ message: "Preço deve ser maior que zero" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : space.image;
    await space.update({ name, description, location, price, image, tipoEspacoId, comodidades });
    res.json(space);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar espaço" });
  }
});

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

// ═══════════════════════════════════════════════════════════════
// LÓGICA DE DESCONTO E MULTA
// Substitui a rota POST /reservations existente no server.js
// ═══════════════════════════════════════════════════════════════

app.post("/reservations", authMiddleware, async (req, res) => {
  try {
    const { spaceId, dataHoraInicio, dataHoraFim, valorTotal } = req.body;
    if (!spaceId || !dataHoraInicio || !dataHoraFim) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    const inicio = new Date(dataHoraInicio);
    const fim    = new Date(dataHoraFim);
    const agora  = new Date();

    if (inicio < agora) {
      return res.status(400).json({ message: "Não é possível reservar datas que já passaram" });
    }
    if (fim <= inicio) {
      return res.status(400).json({ message: "A data/hora de fim deve ser após o início" });
    }

    // Verificar conflito de horário
    const conflito = await Reservation.findOne({
      where: {
        spaceId,
        status: { [Op.in]: ["PENDENTE", "CONFIRMADA"] },
        [Op.or]: [
          { startDateTime: { [Op.between]: [inicio, fim] } },
          { endDateTime:   { [Op.between]: [inicio, fim] } },
          { startDateTime: { [Op.lte]: inicio }, endDateTime: { [Op.gte]: fim } }
        ]
      }
    });
    if (conflito) return res.status(400).json({ message: "Horário já reservado para este espaço" });

    // ── CÁLCULO DE DESCONTO POR ANTECEDÊNCIA ──────────────────
    // Reserva feita com 20 dias ou mais de antecedência: 10% de desconto
    const diasAntecedencia = Math.floor((inicio - agora) / (1000 * 60 * 60 * 24));
    let valorDesconto = 0;
    const valorBase = parseFloat(valorTotal) || 0;

    if (diasAntecedencia >= 20) {
      valorDesconto = valorBase * 0.10;
    }

    const valorFinal = valorBase - valorDesconto;

    const reservation = await Reservation.create({
      startDateTime: inicio,
      endDateTime:   fim,
      valorTotal:    valorFinal,
      valorDesconto: valorDesconto,
      valorMulta:    0,
      status:        "PENDENTE",
      spaceId,
      userId:        req.user.id
    });

    res.status(201).json({
      ...reservation.toJSON(),
      diasAntecedencia,
      descontoAplicado: valorDesconto > 0
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao criar reserva" });
  }
});


// ═══════════════════════════════════════════════════════════════
// CANCELAMENTO COM MULTA -> GERA NOTA E PAGAMENTO AUTOMATICAMENTE
// ═══════════════════════════════════════════════════════════════

app.put("/reservations/:id/cancelar", authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Space, include: [{ model: TipoEspaco }] }]
    });

    if (!reservation) return res.status(404).json({ message: "Reserva não encontrada" });
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ message: "Sem permissão para cancelar esta reserva" });
    }
    if (reservation.status === "CANCELADA") {
      return res.status(400).json({ message: "Reserva já está cancelada" });
    }
    if (reservation.status === "FINALIZADA") {
      return res.status(400).json({ message: "Não é possível cancelar uma reserva finalizada" });
    }

    const agora = new Date();
    const inicio = new Date(reservation.startDateTime);
    const diasAntecedencia = Math.floor((inicio - agora) / (1000 * 60 * 60 * 24));

    let valorMulta = 0;
    let percentualAplicado = 0;
    let notaGerada = null;

    if (diasAntecedencia <= 5) {
      percentualAplicado = parseFloat(reservation.Space?.TipoEspaco?.percentualMulta) || 10;
      const valorBase = parseFloat(reservation.valorTotal) || 0;
      valorMulta = valorBase * (percentualAplicado / 100);
    }

    await reservation.update({
      status: "CANCELADA",
      valorMulta: valorMulta
    });

    // Se houve multa, gera automaticamente a nota fiscal correspondente
    if (valorMulta > 0) {
      notaGerada = await Nota.create({
        reservationId: reservation.id,
        dataNota: new Date().toISOString().split("T")[0],
        valorNota: valorMulta
      });
    }

    res.json({
      message: "Reserva cancelada com sucesso",
      diasAntecedencia,
      percentualMultaAplicado: percentualAplicado,
      valorMulta,
      notaGerada,
      reservation
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao cancelar reserva" });
  }
});

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

app.get("/my-reservations", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { userId: req.user.id },
      include: [{ model: Space, attributes: ["id", "name", "location", "image", "price"] }],
      order: [["startDateTime", "DESC"]]
    });
    res.json(reservations);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao buscar reservas" });
  }
});

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

app.get("/formas-pagamento", async (req, res) => {
  try {
    const formas = await FormaPagamento.findAll({ order: [["nome", "ASC"]] });
    res.json(formas);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar formas de pagamento" });
  }
});

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

app.post("/pagamentos", authMiddleware, async (req, res) => {
  try {
    const { notaId, formaPagamentoId, valorPagamento, dataPagamento } = req.body;
    if (!notaId || !formaPagamentoId || !valorPagamento || !dataPagamento) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    const pagamento = await Pagamento.create({
      notaId, formaPagamentoId, valorPagamento, dataPagamento, status: "PENDENTE"
    });
    res.status(201).json(pagamento);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar pagamento" });
  }
});

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
// ⭐ AVALIAÇÕES (BIDIRECIONAL)
// ═══════════════════════════════════════════════════════════════

// CRIAR AVALIAÇÃO (locatário avalia espaço OU proprietário avalia locatário)
app.post("/avaliacoes", authMiddleware, async (req, res) => {
  try {
    const { reservationId, nota, comentario, tipoAvaliacao } = req.body;

    if (!reservationId || !nota || !tipoAvaliacao) {
      return res.status(400).json({ message: "Informe a reserva, a nota e o tipo de avaliacao" });
    }
    if (nota < 1 || nota > 5) {
      return res.status(400).json({ message: "Nota deve ser entre 1 e 5" });
    }

    // Busca a reserva para validar permissões e status
    const reservation = await Reservation.findByPk(reservationId, {
      include: [{ model: Space }]
    });
    if (!reservation) return res.status(404).json({ message: "Reserva não encontrada" });
    if (reservation.status !== "FINALIZADA") {
      return res.status(400).json({ message: "Só é possível avaliar reservas finalizadas" });
    }

    // Verifica se já existe avaliação deste tipo para esta reserva
    const jaAvaliou = await Avaliacao.findOne({
      where: { reservationId, tipoAvaliacao }
    });
    if (jaAvaliou) {
      return res.status(400).json({ message: "Esta reserva já foi avaliada" });
    }

    let spaceId, userId;

    if (tipoAvaliacao === "LOCATARIO_AVALIA_ESPACO") {
      // Apenas o locatário da reserva pode avaliar o espaço
      if (reservation.userId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para avaliar esta reserva" });
      }
      spaceId = reservation.spaceId;
      userId = reservation.userId; // locatário que avaliou
    } else if (tipoAvaliacao === "PROPRIETARIO_AVALIA_LOCATARIO") {
      // Apenas o proprietário do espaço pode avaliar o locatário
      if (reservation.Space.userId !== req.user.id) {
        return res.status(403).json({ message: "Sem permissão para avaliar este locatário" });
      }
      spaceId = reservation.spaceId;
      userId = reservation.userId; // locatário sendo avaliado
    } else {
      return res.status(400).json({ message: "Tipo de avaliação inválido" });
    }

    const avaliacao = await Avaliacao.create({
      reservationId,
      spaceId,
      userId,
      nota,
      comentario: comentario || "",
      tipoAvaliacao
    });

    res.status(201).json(avaliacao);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao criar avaliacao" });
  }
});

// LISTAR AVALIAÇÕES DE UM ESPAÇO (locatário avalia espaço)
app.get("/avaliacoes/espaco/:spaceId", async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.findAll({
      where: { spaceId: req.params.spaceId, tipoAvaliacao: "LOCATARIO_AVALIA_ESPACO" },
      include: [{ model: User, attributes: ["id", "name"] }],
      order: [["id", "DESC"]]
    });
    res.json(avaliacoes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar avaliacoes" });
  }
});

// LISTAR AVALIAÇÕES DE UM LOCATÁRIO (proprietário avalia locatário)
app.get("/avaliacoes/locatario/:userId", authMiddleware, async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.findAll({
      where: { userId: req.params.userId, tipoAvaliacao: "PROPRIETARIO_AVALIA_LOCATARIO" },
      include: [{ model: Space, attributes: ["id", "name"] }],
      order: [["id", "DESC"]]
    });
    res.json(avaliacoes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar avaliacoes" });
  }
});

// VERIFICAR SE UMA RESERVA JÁ FOI AVALIADA (ambos os tipos)
app.get("/avaliacoes/reserva/:reservationId", authMiddleware, async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.findAll({
      where: { reservationId: req.params.reservationId }
    });

    const jaAvaliouEspaco = avaliacoes.some(a => a.tipoAvaliacao === "LOCATARIO_AVALIA_ESPACO");
    const jaAvaliouLocatario = avaliacoes.some(a => a.tipoAvaliacao === "PROPRIETARIO_AVALIA_LOCATARIO");

    res.json({ jaAvaliouEspaco, jaAvaliouLocatario });
  } catch (error) {
    res.status(500).json({ message: "Erro ao verificar avaliacoes" });
  }
});

// EXCLUIR AVALIAÇÃO
app.delete("/avaliacoes/:id", authMiddleware, async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findByPk(req.params.id);
    if (!avaliacao) return res.status(404).json({ message: "Avaliacao nao encontrada" });
    if (avaliacao.userId !== req.user.id) return res.status(403).json({ message: "Sem permissao" });
    await avaliacao.destroy();
    res.json({ message: "Avaliacao excluida com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir avaliacao" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📊 CONSULTAS SQL
// ═══════════════════════════════════════════════════════════════

app.get("/consultas/receita-por-tipo", async (req, res) => {
  try {
    const resultado = await sequelize.query(`
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
      ORDER BY total_arrecadado DESC
    `, { type: QueryTypes.SELECT });
    res.json(resultado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro na consulta 1", error: error.message });
  }
});

app.get("/consultas/avaliacoes-por-espaco", async (req, res) => {
  try {
    const resultado = await sequelize.query(`
      SELECT
        e.nome                        AS espaco,
        u.nome                        AS proprietario,
        COUNT(a.id_avaliacao)         AS total_avaliacoes,
        ROUND(AVG(a.nota), 2)         AS media_nota
      FROM espaco    e
      JOIN usuario   u  ON u.id_usuario   = e.id_proprietario
      JOIN avaliacao a  ON a.id_espaco    = e.id_espaco
      GROUP BY e.id_espaco, e.nome, u.nome
      HAVING COUNT(a.id_avaliacao) >= 1
      ORDER BY media_nota DESC
    `, { type: QueryTypes.SELECT });
    res.json(resultado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro na consulta 2", error: error.message });
  }
});

app.get("/consultas/reservas-por-mes", async (req, res) => {
  try {
    const resultado = await sequelize.query(`
      SELECT
        DATE_FORMAT(r.data_hora_inicio, '%m/%Y') AS mes_ano,
        COUNT(r.id_reserva)                       AS total_reservas,
        SUM(r.valor_total)                        AS valor_movimentado
      FROM reserva     r
      JOIN espaco      e  ON e.id_espaco = r.id_espaco
      JOIN tipo_espaco te ON te.id_tipo  = e.id_tipo
      WHERE r.status IN ('CONFIRMADA','FINALIZADA')
      GROUP BY DATE_FORMAT(r.data_hora_inicio, '%m/%Y'), YEAR(r.data_hora_inicio), MONTH(r.data_hora_inicio)
      ORDER BY YEAR(r.data_hora_inicio), MONTH(r.data_hora_inicio)
    `, { type: QueryTypes.SELECT });
    res.json(resultado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro na consulta 3", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🤖 IA GENERATIVA - Groq / LLaMA
// ═══════════════════════════════════════════════════════════════

app.post("/ia/sugerir-preco", async (req, res) => {
  try {
    const { nome, tipo, endereco, comodidades, descricao } = req.body;

    if (!nome || !tipo || !endereco) {
      return res.status(400).json({ message: "Informe nome, tipo e endereço do espaço" });
    }

    const espacosSimilares = await Space.findAll({
      include: [{ model: TipoEspaco, attributes: ["nome"] }],
      limit: 5,
      order: sequelize.random()
    });

    const contextoBanco = espacosSimilares.map(e =>
      `- ${e.name} (${e.TipoEspaco?.nome || "Sem tipo"}): R$${e.price}/hora em ${e.location}`
    ).join("\n");

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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024
    });
    const texto = completion.choices[0].message.content;

    res.json({
      sugestao: texto,
      espacoAnalisado: { nome, tipo, endereco, comodidades },
      espacosReferencia: espacosSimilares.length
    });

  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({ message: "Erro ao consultar IA", error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 👑 ADMIN — Adiciona no topo do server.js junto com os outros requires
// ═══════════════════════════════════════════════════════════════
// const fse = require("fs-extra");
// const path = require("path"); // já existe

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE DE ADMIN
// Adiciona após o authMiddleware existente
// ═══════════════════════════════════════════════════════════════

function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tipoUsuario !== "ADMIN") {
      return res.status(403).json({ message: "Acesso restrito ao administrador" });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// ═══════════════════════════════════════════════════════════════
// 📊 DASHBOARD DO ADMIN — Estatísticas gerais
// ═══════════════════════════════════════════════════════════════

app.get("/admin/stats", adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsuarios,
      totalProprietarios,
      totalLocatarios,
      totalEspacos,
      totalReservas,
      totalPagamentos,
      totalAvaliacoes,
      totalFormas
    ] = await Promise.all([
      sequelize.query("SELECT COUNT(*) AS total FROM usuario", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM proprietario", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM locatario", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM espaco", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM reserva", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM pagamento", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM avaliacao", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT COUNT(*) AS total FROM forma_pagamento", { type: QueryTypes.SELECT })
    ]);

    const reservasPorStatus = await sequelize.query(
      "SELECT status, COUNT(*) AS total FROM reserva GROUP BY status",
      { type: QueryTypes.SELECT }
    );

    const receitaTotal = await sequelize.query(
      "SELECT SUM(valor_pagamento) AS total FROM pagamento WHERE status = 'APROVADO'",
      { type: QueryTypes.SELECT }
    );

    res.json({
      usuarios: totalUsuarios[0].total,
      proprietarios: totalProprietarios[0].total,
      locatarios: totalLocatarios[0].total,
      espacos: totalEspacos[0].total,
      reservas: totalReservas[0].total,
      pagamentos: totalPagamentos[0].total,
      avaliacoes: totalAvaliacoes[0].total,
      formasPagamento: totalFormas[0].total,
      reservasPorStatus,
      receitaTotal: receitaTotal[0].total || 0
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao carregar estatísticas" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 👤 ADMIN — CRUD DE USUÁRIOS
// ═══════════════════════════════════════════════════════════════

app.get("/admin/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "telefone", "tipoUsuario"],
      order: [["id", "ASC"]]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar usuários" });
  }
});

app.put("/admin/users/:id", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    const { name, email, telefone, tipoUsuario } = req.body;
    await user.update({ name, email, telefone, tipoUsuario });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});

app.delete("/admin/users/:id", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    if (user.tipoUsuario === "ADMIN") {
      return res.status(400).json({ message: "Não é possível excluir o administrador" });
    }
    await user.destroy();
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir usuário" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏠 ADMIN — CRUD DE ESPAÇOS
// ═══════════════════════════════════════════════════════════════

app.get("/admin/spaces", adminMiddleware, async (req, res) => {
  try {
    const spaces = await Space.findAll({
      include: [
        { model: User, attributes: ["id", "name", "email"] },
        { model: TipoEspaco, attributes: ["id", "nome"] }
      ],
      order: [["id", "DESC"]]
    });
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar espaços" });
  }
});

app.delete("/admin/spaces/:id", adminMiddleware, async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);
    if (!space) return res.status(404).json({ message: "Espaço não encontrado" });
    await space.destroy();
    res.json({ message: "Espaço excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir espaço" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📅 ADMIN — CRUD DE RESERVAS
// ═══════════════════════════════════════════════════════════════

app.get("/admin/reservations", adminMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      include: [
        { model: Space, attributes: ["id", "name"] },
        { model: User, attributes: ["id", "name", "email"] }
      ],
      order: [["startDateTime", "DESC"]]
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar reservas" });
  }
});

app.put("/admin/reservations/:id", adminMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reserva não encontrada" });
    await reservation.update(req.body);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar reserva" });
  }
});

app.delete("/admin/reservations/:id", adminMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reserva não encontrada" });
    await reservation.destroy();
    res.json({ message: "Reserva excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir reserva" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 💳 ADMIN — CRUD DE FORMAS DE PAGAMENTO
// ═══════════════════════════════════════════════════════════════

app.delete("/admin/formas-pagamento/:id", adminMiddleware, async (req, res) => {
  try {
    const forma = await FormaPagamento.findByPk(req.params.id);
    if (!forma) return res.status(404).json({ message: "Forma não encontrada" });
    await forma.destroy();
    res.json({ message: "Forma de pagamento excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir forma de pagamento" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 💰 ADMIN — CRUD DE PAGAMENTOS
// ═══════════════════════════════════════════════════════════════

app.get("/admin/pagamentos", adminMiddleware, async (req, res) => {
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

app.delete("/admin/pagamentos/:id", adminMiddleware, async (req, res) => {
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
// ⭐ ADMIN — CRUD DE AVALIAÇÕES
// ═══════════════════════════════════════════════════════════════

app.get("/admin/avaliacoes", adminMiddleware, async (req, res) => {
  try {
    const avaliacoes = await Avaliacao.findAll({
      include: [
        { model: Space, attributes: ["id", "name"] },
        { model: User, attributes: ["id", "name"] }
      ],
      order: [["id", "DESC"]]
    });
    res.json(avaliacoes);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar avaliações" });
  }
});

app.delete("/admin/avaliacoes/:id", adminMiddleware, async (req, res) => {
  try {
    const avaliacao = await Avaliacao.findByPk(req.params.id);
    if (!avaliacao) return res.status(404).json({ message: "Avaliação não encontrada" });
    await avaliacao.destroy();
    res.json({ message: "Avaliação excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir avaliação" });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🗄️ ADMIN — BACKUP E RESTORE DO BANCO
// ═══════════════════════════════════════════════════════════════

const fse = require("fs-extra");
const BACKUP_PATH = path.join(__dirname, "backup_dados.json");

// FAZER BACKUP (chamado automaticamente antes de apagar)
async function fazerBackup() {
  const [usuarios, espacos, reservas, avaliacoes, notas, pagamentos, formas, tipos] =
    await Promise.all([
      sequelize.query("SELECT * FROM usuario",         { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM espaco",          { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM reserva",         { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM avaliacao",       { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM nota",            { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM pagamento",       { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM forma_pagamento", { type: QueryTypes.SELECT }),
      sequelize.query("SELECT * FROM tipo_espaco",     { type: QueryTypes.SELECT })
    ]);

  const backup = {
    criadoEm: new Date().toISOString(),
    tipo_espaco: tipos,
    forma_pagamento: formas,
    usuario: usuarios,
    espaco: espacos,
    reserva: reservas,
    avaliacao: avaliacoes,
    nota: notas,
    pagamento: pagamentos
  };

  await fse.writeJson(BACKUP_PATH, backup, { spaces: 2 });
  return backup.criadoEm;
}

// APAGAR TUDO (com backup automático antes)
app.delete("/admin/banco/apagar", adminMiddleware, async (req, res) => {
  try {
    const criadoEm = await fazerBackup();

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    const tabelas = [
      "pagamento", "nota", "avaliacao", "reserva",
      "imagem_espaco", "espaco", "forma_pagamento", "tipo_espaco",
      "pessoa_juridica", "pessoa_fisica", "locatario", "proprietario"
    ];
    for (const t of tabelas) {
      await sequelize.query(`TRUNCATE TABLE \`${t}\``);
    }

    // Apaga usuarios mas PRESERVA o admin
    await sequelize.query(
      `DELETE FROM usuario WHERE tipo_usuario != 'ADMIN'`
    );

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    res.json({
      message: "Banco apagado com sucesso. Admin preservado. Backup salvo automaticamente.",
      backupCriadoEm: criadoEm
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao apagar banco", error: error.message });
  }
});
// VERIFICAR SE EXISTE BACKUP
app.get("/admin/banco/backup-info", adminMiddleware, async (req, res) => {
  try {
    const existe = await fse.pathExists(BACKUP_PATH);
    if (!existe) return res.json({ existe: false });
    const backup = await fse.readJson(BACKUP_PATH);
    res.json({
      existe: true,
      criadoEm: backup.criadoEm,
      totais: {
        usuarios: backup.usuario?.length || 0,
        espacos: backup.espaco?.length || 0,
        reservas: backup.reserva?.length || 0,
        pagamentos: backup.pagamento?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao verificar backup" });
  }
});

// RESTAURAR BACKUP
app.post("/admin/banco/restaurar", adminMiddleware, async (req, res) => {
  try {
    const existe = await fse.pathExists(BACKUP_PATH);
    if (!existe) return res.status(404).json({ message: "Nenhum backup encontrado" });

    const backup = await fse.readJson(BACKUP_PATH);

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Restaura na ordem correta respeitando FKs
    for (const tipo of backup.tipo_espaco || []) {
      await sequelize.query(
        `INSERT IGNORE INTO tipo_espaco (id_tipo, nome, descricao, percentual_multa) VALUES (?, ?, ?, ?)`,
        { replacements: [tipo.id_tipo, tipo.nome, tipo.descricao, tipo.percentual_multa] }
      );
    }

    for (const f of backup.forma_pagamento || []) {
      await sequelize.query(
        `INSERT IGNORE INTO forma_pagamento (id_forma, nome) VALUES (?, ?)`,
        { replacements: [f.id_forma, f.nome] }
      );
    }

    for (const u of backup.usuario || []) {
      await sequelize.query(
        `INSERT IGNORE INTO usuario (id_usuario, nome, email, senha, telefone, tipo_usuario, tipo_pessoa, cpf, cnpj) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        { replacements: [u.id_usuario, u.nome, u.email, u.senha, u.telefone, u.tipo_usuario, u.tipo_pessoa, u.cpf, u.cnpj] }
      );
      if (u.tipo_usuario === "PROPRIETARIO") {
        await sequelize.query(`INSERT IGNORE INTO proprietario (id_usuario) VALUES (?)`, { replacements: [u.id_usuario] });
      } else if (u.tipo_usuario === "LOCATARIO") {
        await sequelize.query(`INSERT IGNORE INTO locatario (id_usuario) VALUES (?)`, { replacements: [u.id_usuario] });
      }
    }

    for (const e of backup.espaco || []) {
      await sequelize.query(
        `INSERT IGNORE INTO espaco (id_espaco, nome, endereco, categoria, valor_hora, comodidades, descricao, imagem, id_tipo, id_proprietario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        { replacements: [e.id_espaco, e.nome, e.endereco, e.categoria, e.valor_hora, e.comodidades, e.descricao, e.imagem, e.id_tipo, e.id_proprietario] }
      );
    }

    for (const r of backup.reserva || []) {
      await sequelize.query(
        `INSERT IGNORE INTO reserva (id_reserva, data_hora_inicio, data_hora_fim, status, valor_total, valor_desconto, valor_multa, id_espaco, id_locatario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        { replacements: [r.id_reserva, r.data_hora_inicio, r.data_hora_fim, r.status, r.valor_total, r.valor_desconto, r.valor_multa, r.id_espaco, r.id_locatario] }
      );
    }

    for (const a of backup.avaliacao || []) {
      await sequelize.query(
        `INSERT IGNORE INTO avaliacao (id_avaliacao, id_reserva, tipo_avaliacao, comentario, nota, id_espaco, id_locatario) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        { replacements: [a.id_avaliacao, a.id_reserva, a.tipo_avaliacao, a.comentario, a.nota, a.id_espaco, a.id_locatario] }
      );
    }

    for (const n of backup.nota || []) {
      await sequelize.query(
        `INSERT IGNORE INTO nota (id_nota, data_nota, valor_nota, id_reserva) VALUES (?, ?, ?, ?)`,
        { replacements: [n.id_nota, n.data_nota, n.valor_nota, n.id_reserva] }
      );
    }

    for (const p of backup.pagamento || []) {
      await sequelize.query(
        `INSERT IGNORE INTO pagamento (id_pagamento, data_pagamento, valor_pagamento, status, id_nota, id_forma) VALUES (?, ?, ?, ?, ?, ?)`,
        { replacements: [p.id_pagamento, p.data_pagamento, p.valor_pagamento, p.status, p.id_nota, p.id_forma] }
      );
    }

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    res.json({
      message: "Dados restaurados com sucesso!",
      backupDe: backup.criadoEm
    });
  } catch (error) {
    console.log(error);
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    res.status(500).json({ message: "Erro ao restaurar backup", error: error.message });
  }
});

// INICIALIZAR BANCO (seed completo — seed_data_v3)
app.post("/admin/banco/inicializar", adminMiddleware, async (req, res) => {
  try {
    // Guarda ANTES de qualquer insert: se já existe usuário de seed, não roda nada de novo
    // (evita duplicar tipo_espaco/forma_pagamento e reservas a cada clique em "Inicializar")
    const [jaSeedado] = await sequelize.query(
      `SELECT id_usuario FROM usuario WHERE email = 'carlos@email.com'`,
      { type: QueryTypes.SELECT }
    );
    if (jaSeedado) {
      return res.json({
        message: "Banco já contém os dados completos do seed. Use 'Apagar tudo' antes de inicializar novamente."
      });
    }

    // 1. TIPOS DE ESPAÇO — só insere se a tabela estiver vazia (não há nome único, então
    // INSERT IGNORE sozinho não impede duplicatas)
    const [{ cnt: qtdTipos }] = await sequelize.query(
      `SELECT COUNT(*) as cnt FROM tipo_espaco`, { type: QueryTypes.SELECT }
    );
    if (qtdTipos == 0) {
      await sequelize.query(`
        INSERT INTO tipo_espaco (nome, descricao, percentual_multa) VALUES
        ('Salão de Festas','Espaço para eventos sociais e comemorações', 15.00),
        ('Quadra Esportiva','Quadra para prática de esportes variados', 5.00),
        ('Auditório','Espaço para palestras, reuniões e conferências', 15.00),
        ('Apartamento','Imóvel residencial para locação temporária', 15.00),
        ('Casa','Imóvel residencial completo para locação', 10.00),
        ('Espaço Coworking','Ambiente compartilhado para trabalho profissional', 5.00)
      `);
    }

    // 2. FORMAS DE PAGAMENTO — mesma lógica
    const [{ cnt: qtdFormas }] = await sequelize.query(
      `SELECT COUNT(*) as cnt FROM forma_pagamento`, { type: QueryTypes.SELECT }
    );
    if (qtdFormas == 0) {
      await sequelize.query(`
        INSERT INTO forma_pagamento (nome) VALUES
        ('PIX'),('Cartão de Crédito'),('Cartão de Débito'),
        ('Boleto Bancário'),('Transferência Bancária')
      `);
    }

    // Mapas de nome -> id real (não assume que IDs comecem em 1, pois o admin já ocupa um id)
    const tipos = await sequelize.query(`SELECT id_tipo, nome FROM tipo_espaco`, { type: QueryTypes.SELECT });
    const tipoIdPorNome = {};
    tipos.forEach(t => { tipoIdPorNome[t.nome] = t.id_tipo; });

    const formas = await sequelize.query(`SELECT id_forma, nome FROM forma_pagamento`, { type: QueryTypes.SELECT });
    const formaIdPorNome = {};
    formas.forEach(f => { formaIdPorNome[f.nome] = f.id_forma; });

    const SENHA_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy2"; // "senha123"

    // 3. USUÁRIOS (posição 1-10, igual ao seed_data_v3.sql)
    const seedUsuarios = [
      { nome: "Carlos Mendes",  email: "carlos@email.com",   telefone: "51999990001", tipo_usuario: "PROPRIETARIO" },
      { nome: "Ana Souza",      email: "ana@email.com",      telefone: "51999990002", tipo_usuario: "PROPRIETARIO" },
      { nome: "Roberto Lima",   email: "roberto@email.com",  telefone: "51999990003", tipo_usuario: "PROPRIETARIO" },
      { nome: "Fernanda Costa", email: "fernanda@email.com", telefone: "48999990004", tipo_usuario: "LOCATARIO" },
      { nome: "João Pereira",   email: "joao@email.com",     telefone: "48999990005", tipo_usuario: "LOCATARIO" },
      { nome: "Mariana Alves",  email: "mariana@email.com",  telefone: "48999990006", tipo_usuario: "LOCATARIO" },
      { nome: "Pedro Oliveira", email: "pedro@email.com",    telefone: "51999990007", tipo_usuario: "LOCATARIO" },
      { nome: "Lucia Ferreira", email: "lucia@email.com",    telefone: "51999990008", tipo_usuario: "LOCATARIO" },
      { nome: "Marcos Rocha",   email: "marcos@email.com",   telefone: "51999990009", tipo_usuario: "LOCATARIO" },
      { nome: "Beatriz Santos", email: "beatriz@email.com",  telefone: "48999990010", tipo_usuario: "LOCATARIO" }
    ];
    const cpfPorPosicao  = { 4: "12345678901", 5: "23456789012", 6: "34567890123", 7: "45678901234", 8: "56789012345" };
    const cnpjPorPosicao = { 9: "12345678000190", 10: "98765432000110" };

    const usuarioIdMap = {}; // posição (1-10) -> id_usuario real
    for (let i = 0; i < seedUsuarios.length; i++) {
      const pos = i + 1;
      const u = seedUsuarios[i];
      const [idUsuario] = await sequelize.query(
        `INSERT INTO usuario (nome, email, senha, telefone, tipo_usuario) VALUES (?, ?, ?, ?, ?)`,
        { replacements: [u.nome, u.email, SENHA_HASH, u.telefone, u.tipo_usuario], type: QueryTypes.INSERT }
      );
      usuarioIdMap[pos] = idUsuario;

      if (u.tipo_usuario === "PROPRIETARIO") {
        await sequelize.query(`INSERT INTO proprietario (id_usuario) VALUES (?)`, { replacements: [idUsuario] });
      } else {
        await sequelize.query(`INSERT INTO locatario (id_usuario) VALUES (?)`, { replacements: [idUsuario] });
      }
      if (cpfPorPosicao[pos]) {
        await sequelize.query(`INSERT INTO pessoa_fisica (id_usuario, cpf) VALUES (?, ?)`, { replacements: [idUsuario, cpfPorPosicao[pos]] });
      }
      if (cnpjPorPosicao[pos]) {
        await sequelize.query(`INSERT INTO pessoa_juridica (id_usuario, cnpj) VALUES (?, ?)`, { replacements: [idUsuario, cnpjPorPosicao[pos]] });
      }
    }

    // 6. ESPAÇOS (posição 1-8)
    const seedEspacos = [
      { nome: "Salão Estrela",       endereco: "Rua das Flores, 100 - Porto Alegre/RS",        categoria: "Eventos",      valor_hora: 150.00, comodidades: "Ar-condicionado, Som, Projetor",        descricao: "Salão amplo para festas e eventos corporativos.",  tipoNome: "Salão de Festas",  proprietarioPos: 1 },
      { nome: "Quadra Arena Sul",    endereco: "Av. Ipiranga, 500 - Porto Alegre/RS",          categoria: "Esportes",     valor_hora: 80.00,  comodidades: "Vestiário, Iluminação, Estacionamento", descricao: "Quadra poliesportiva coberta.",                     tipoNome: "Quadra Esportiva",  proprietarioPos: 1 },
      { nome: "Auditório Central",   endereco: "Rua Sete de Setembro, 200 - Florianópolis/SC", categoria: "Corporativo",  valor_hora: 200.00, comodidades: "Projetor 4K, Microfone, Wi-Fi",         descricao: "Auditório moderno para até 150 pessoas.",           tipoNome: "Auditório",         proprietarioPos: 2 },
      { nome: "Apto Vista Mar",      endereco: "Av. Beira Mar Norte, 800 - Florianópolis/SC",  categoria: "Residencial",  valor_hora: 120.00, comodidades: "Wi-Fi, Cozinha, 2 quartos, Vista mar",  descricao: "Apartamento sofisticado com vista para o mar.",     tipoNome: "Apartamento",       proprietarioPos: 2 },
      { nome: "Casa da Serra",       endereco: "Rua das Araucárias, 45 - Gramado/RS",          categoria: "Residencial",  valor_hora: 90.00,  comodidades: "Churrasqueira, Lareira, Jardim",        descricao: "Casa charmosa na serra gaúcha.",                    tipoNome: "Casa",              proprietarioPos: 3 },
      { nome: "Coworking StartHub",  endereco: "Av. Carlos Gomes, 300 - Porto Alegre/RS",      categoria: "Profissional", valor_hora: 45.00,  comodidades: "Wi-Fi Fibra, Café, Salas de reunião",   descricao: "Espaço de coworking moderno.",                      tipoNome: "Espaço Coworking",  proprietarioPos: 3 },
      { nome: "Salão Jardins",       endereco: "Rua Coronel Genuíno, 150 - Porto Alegre/RS",   categoria: "Eventos",      valor_hora: 130.00, comodidades: "Cozinha, Banheiros, Estacionamento",    descricao: "Salão de festas com área externa e jardim.",        tipoNome: "Salão de Festas",   proprietarioPos: 1 },
      { nome: "Quadra Beach Tennis", endereco: "Av. Praia de Belas, 20 - Porto Alegre/RS",     categoria: "Esportes",     valor_hora: 60.00,  comodidades: "Areia especial, Iluminação LED",        descricao: "Quadra de beach tennis homologada.",                tipoNome: "Quadra Esportiva",  proprietarioPos: 2 }
    ];

    const espacoIdMap = {}; // posição (1-8) -> id_espaco real
    for (let i = 0; i < seedEspacos.length; i++) {
      const pos = i + 1;
      const e = seedEspacos[i];
      const [idEspaco] = await sequelize.query(
        `INSERT INTO espaco (nome, endereco, categoria, valor_hora, comodidades, descricao, id_tipo, id_proprietario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            e.nome, e.endereco, e.categoria, e.valor_hora, e.comodidades, e.descricao,
            tipoIdPorNome[e.tipoNome], usuarioIdMap[e.proprietarioPos]
          ],
          type: QueryTypes.INSERT
        }
      );
      espacoIdMap[pos] = idEspaco;
    }

    // 7. IMAGENS DOS ESPAÇOS
    const seedImagens = [
      { url: "/uploads/salao-estrela-1.jpg",  descricao: "Vista frontal do salão",  espacoPos: 1 },
      { url: "/uploads/salao-estrela-2.jpg",  descricao: "Interior decorado",       espacoPos: 1 },
      { url: "/uploads/quadra-arena-1.jpg",   descricao: "Quadra principal",        espacoPos: 2 },
      { url: "/uploads/auditorio-1.jpg",      descricao: "Vista do palco",          espacoPos: 3 },
      { url: "/uploads/auditorio-2.jpg",      descricao: "Plateia completa",        espacoPos: 3 },
      { url: "/uploads/apto-vista-mar-1.jpg", descricao: "Vista da sacada",         espacoPos: 4 },
      { url: "/uploads/casa-serra-1.jpg",     descricao: "Fachada da casa",         espacoPos: 5 },
      { url: "/uploads/coworking-1.jpg",      descricao: "Espaço de trabalho",      espacoPos: 6 },
      { url: "/uploads/salao-jardins-1.jpg",  descricao: "Área externa com jardim", espacoPos: 7 },
      { url: "/uploads/quadra-beach-1.jpg",   descricao: "Quadra iluminada",        espacoPos: 8 }
    ];
    for (const img of seedImagens) {
      await sequelize.query(
        `INSERT INTO imagem_espaco (url_imagem, descricao, id_espaco) VALUES (?, ?, ?)`,
        { replacements: [img.url, img.descricao, espacoIdMap[img.espacoPos]] }
      );
    }

    // 8. RESERVAS (posição 1-15)
    const seedReservas = [
      { inicio: "2026-08-10 14:00:00", fim: "2026-08-10 22:00:00", status: "CONFIRMADA", total: 1200.00, desconto: 0.00,   multa: 0.00,  espacoPos: 1, locatarioPos: 4 },
      { inicio: "2026-08-12 08:00:00", fim: "2026-08-12 12:00:00", status: "CONFIRMADA", total: 320.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 2, locatarioPos: 5 },
      { inicio: "2026-08-15 09:00:00", fim: "2026-08-15 17:00:00", status: "PENDENTE",   total: 1600.00, desconto: 0.00,   multa: 0.00,  espacoPos: 3, locatarioPos: 6 },
      { inicio: "2026-08-18 10:00:00", fim: "2026-08-18 14:00:00", status: "CONFIRMADA", total: 432.00,  desconto: 48.00,  multa: 0.00,  espacoPos: 4, locatarioPos: 7 },
      { inicio: "2026-08-20 12:00:00", fim: "2026-08-20 20:00:00", status: "CONFIRMADA", total: 720.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 5, locatarioPos: 8 },
      { inicio: "2026-07-22 08:00:00", fim: "2026-07-22 18:00:00", status: "CANCELADA",  total: 450.00,  desconto: 0.00,   multa: 67.50, espacoPos: 6, locatarioPos: 9 },
      { inicio: "2026-08-25 16:00:00", fim: "2026-08-25 23:00:00", status: "CONFIRMADA", total: 910.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 7, locatarioPos: 10 },
      { inicio: "2026-08-28 09:00:00", fim: "2026-08-28 13:00:00", status: "PENDENTE",   total: 240.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 8, locatarioPos: 4 },
      { inicio: "2026-09-05 18:00:00", fim: "2026-09-05 23:00:00", status: "CONFIRMADA", total: 750.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 1, locatarioPos: 5 },
      { inicio: "2026-07-10 08:00:00", fim: "2026-07-10 12:00:00", status: "FINALIZADA", total: 320.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 2, locatarioPos: 6 },
      { inicio: "2026-06-15 14:00:00", fim: "2026-06-15 22:00:00", status: "FINALIZADA", total: 1200.00, desconto: 0.00,   multa: 0.00,  espacoPos: 1, locatarioPos: 7 },
      { inicio: "2026-06-20 09:00:00", fim: "2026-06-20 17:00:00", status: "FINALIZADA", total: 1440.00, desconto: 160.00, multa: 0.00,  espacoPos: 3, locatarioPos: 8 },
      { inicio: "2026-05-10 10:00:00", fim: "2026-05-10 18:00:00", status: "FINALIZADA", total: 720.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 5, locatarioPos: 9 },
      { inicio: "2026-05-22 08:00:00", fim: "2026-05-22 12:00:00", status: "FINALIZADA", total: 180.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 6, locatarioPos: 10 },
      { inicio: "2026-04-05 16:00:00", fim: "2026-04-05 22:00:00", status: "FINALIZADA", total: 780.00,  desconto: 0.00,   multa: 0.00,  espacoPos: 7, locatarioPos: 4 }
    ];

    const reservaIdMap = {}; // posição (1-15) -> id_reserva real
    for (let i = 0; i < seedReservas.length; i++) {
      const pos = i + 1;
      const r = seedReservas[i];
      const [idReserva] = await sequelize.query(
        `INSERT INTO reserva (data_hora_inicio, data_hora_fim, status, valor_total, valor_desconto, valor_multa, id_espaco, id_locatario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [r.inicio, r.fim, r.status, r.total, r.desconto, r.multa, espacoIdMap[r.espacoPos], usuarioIdMap[r.locatarioPos]],
          type: QueryTypes.INSERT
        }
      );
      reservaIdMap[pos] = idReserva;
    }

    // 9. AVALIAÇÕES
    const seedAvaliacoes = [
      { comentario: "Quadra excelente, bem cuidada!",               nota: 5, tipo: "LOCATARIO_AVALIA_ESPACO",       espacoPos: 2, locatarioPos: 6,  reservaPos: 10 },
      { comentario: "Auditório incrível, superou as expectativas!", nota: 5, tipo: "LOCATARIO_AVALIA_ESPACO",       espacoPos: 3, locatarioPos: 8,  reservaPos: 12 },
      { comentario: "Salão perfeito para a nossa festa!",           nota: 5, tipo: "LOCATARIO_AVALIA_ESPACO",       espacoPos: 7, locatarioPos: 4,  reservaPos: 15 },
      { comentario: "Ótimo salão, atendimento excelente.",          nota: 4, tipo: "LOCATARIO_AVALIA_ESPACO",       espacoPos: 1, locatarioPos: 7,  reservaPos: 11 },
      { comentario: "Boa estrutura para coworking.",                nota: 4, tipo: "LOCATARIO_AVALIA_ESPACO",       espacoPos: 6, locatarioPos: 10, reservaPos: 14 },
      { comentario: "Casa bonita mas poderia ter mais vagas.",      nota: 3, tipo: "LOCATARIO_AVALIA_ESPACO",       espacoPos: 5, locatarioPos: 9,  reservaPos: 13 },
      { comentario: "Locatario muito cuidadoso, recomendo!",       nota: 5, tipo: "PROPRIETARIO_AVALIA_LOCATARIO", espacoPos: 2, locatarioPos: 6,  reservaPos: 10 },
      { comentario: "Ótimo locatario, deixou o espaço impecável.",  nota: 5, tipo: "PROPRIETARIO_AVALIA_LOCATARIO", espacoPos: 3, locatarioPos: 8,  reservaPos: 12 }
    ];
    for (const a of seedAvaliacoes) {
      await sequelize.query(
        `INSERT INTO avaliacao (comentario, nota, tipo_avaliacao, id_espaco, id_locatario, id_reserva) VALUES (?, ?, ?, ?, ?, ?)`,
        { replacements: [a.comentario, a.nota, a.tipo, espacoIdMap[a.espacoPos], usuarioIdMap[a.locatarioPos], reservaIdMap[a.reservaPos]] }
      );
    }

    // 10. NOTAS FISCAIS (posição 1-7)
    const seedNotas = [
      { data: "2026-07-10", valor: 320.00,  reservaPos: 10 },
      { data: "2026-06-15", valor: 1200.00, reservaPos: 11 },
      { data: "2026-06-20", valor: 1440.00, reservaPos: 12 },
      { data: "2026-05-10", valor: 720.00,  reservaPos: 13 },
      { data: "2026-05-22", valor: 180.00,  reservaPos: 14 },
      { data: "2026-04-05", valor: 780.00,  reservaPos: 15 },
      { data: "2026-07-22", valor: 67.50,   reservaPos: 6 }
    ];
    const notaIdMap = {}; // posição (1-7) -> id_nota real
    for (let i = 0; i < seedNotas.length; i++) {
      const pos = i + 1;
      const n = seedNotas[i];
      const [idNota] = await sequelize.query(
        `INSERT INTO nota (data_nota, valor_nota, id_reserva) VALUES (?, ?, ?)`,
        { replacements: [n.data, n.valor, reservaIdMap[n.reservaPos]], type: QueryTypes.INSERT }
      );
      notaIdMap[pos] = idNota;
    }

    // 11. PAGAMENTOS
    const seedPagamentos = [
      { data: "2026-07-09", valor: 320.00,  status: "APROVADO", notaPos: 1, formaNome: "PIX" },
      { data: "2026-06-14", valor: 1200.00, status: "APROVADO", notaPos: 2, formaNome: "Cartão de Crédito" },
      { data: "2026-06-19", valor: 1440.00, status: "APROVADO", notaPos: 3, formaNome: "PIX" },
      { data: "2026-05-09", valor: 720.00,  status: "APROVADO", notaPos: 4, formaNome: "Cartão de Débito" },
      { data: "2026-05-21", valor: 180.00,  status: "APROVADO", notaPos: 5, formaNome: "Boleto Bancário" },
      { data: "2026-04-04", valor: 780.00,  status: "APROVADO", notaPos: 6, formaNome: "Cartão de Crédito" },
      { data: "2026-07-23", valor: 67.50,   status: "PENDENTE", notaPos: 7, formaNome: "PIX" }
    ];
    for (const p of seedPagamentos) {
      await sequelize.query(
        `INSERT INTO pagamento (data_pagamento, valor_pagamento, status, id_nota, id_forma) VALUES (?, ?, ?, ?, ?)`,
        { replacements: [p.data, p.valor, p.status, notaIdMap[p.notaPos], formaIdPorNome[p.formaNome]] }
      );
    }

    res.json({ message: "Banco inicializado com o seed completo! (usuários, espaços, reservas, avaliações, notas e pagamentos)" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro ao inicializar banco", error: error.message });
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