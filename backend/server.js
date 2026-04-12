const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch(err => console.log(err));

// 🔐 Middleware de autenticação
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

// 📌 Rota inicial
app.get("/", (req, res) => {
  res.json({ message: "API EspaçoJá funcionando 🚀" });
});

// 📌 Listar usuários
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();

    res.json(users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email
    })));
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuários" });
  }
});

// 📌 Criar usuário
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Usuário criado com sucesso 🚀",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// 🔐 Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
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

// 🔐 Perfil (protegido)
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
});

// 🚀 Servidor
app.listen(8000, () => {
  console.log("Servidor rodando na porta 8000");
});