const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secret } = require("../config/jwt");

let users = [];

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Preencha todos os campos" });
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: "Email já cadastrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword
  };

  users.push(newUser);

  res.status(201).json({
    message: "Usuário criado com sucesso 🚀",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({ message: "Usuário não encontrado" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Senha inválida" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    secret,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Login realizado com sucesso 🔐",
    token
  });
};

exports.profile = (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
};