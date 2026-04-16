const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sequelize = require("./config/database");
const User = require("./models/User");

const app = express();
const Space = require("./models/Space");

/* =========================
   🌐 CORS CONFIGURADO (CORRETO)
========================= */
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

/* =========================
   🔐 Middleware de autenticação
========================= */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "segredo_super_secreto");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

/* =========================
   📌 Rota inicial
========================= */
app.get("/", (req, res) => {
  res.json({ message: "API EspaçoJá funcionando 🚀" });
});

/* =========================
   📌 Listar usuários
========================= */
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email
    })));

  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários" });
  }
});

/* =========================
   📌 Criar usuário
========================= */
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Usuário criado com sucesso 🚀",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

/* =========================
   🔐 Login
========================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "segredo_super_secreto",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login realizado com sucesso 🔐",
      token
    });

  } catch (error) {
    res.status(500).json({ message: "Erro no login" });
  }
});

/* =========================
   🔐 Perfil (protegido)
========================= */
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
});

/* =========================
   🚀 Conectar + rodar servidor
========================= */
sequelize.sync()
  .then(() => {
    console.log("Banco sincronizado 🚀");

    app.listen(8000, () => {
      console.log("Servidor rodando na porta 8000");
    });
  })
  .catch(err => console.log(err));

  
app.post("/spaces", async (req, res) => {
  try {
    const { name, description, location, price } = req.body;

    const space = await Space.create({
      name,
      description,
      location,
      price
    });

    res.status(201).json(space);

  } catch (error) {
    res.status(500).json({ message: "Erro ao criar espaço" });
  }
});

app.get("/spaces", async (req, res) => {
  try {
    const spaces = await Space.findAll();
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar espaços" });
  }
});

