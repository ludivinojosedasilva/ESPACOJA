const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sequelize = require("./config/database");
const User = require("./models/User");
const Space = require("./models/Space");
const Reservation = require("./models/Reservation");

const app = express();

/* =========================
   🌐 MIDDLEWARES
========================= */
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

/* =========================
   🔐 AUTH
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
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

/* =========================
   📌 BASE
========================= */
app.get("/", (req, res) => {
  res.json({ message: "API EspaçoJá funcionando 🚀" });
});

/* =========================
   👤 USERS
========================= */
app.get("/users", async (req, res) => {
  const users = await User.findAll();

  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email
  })));
});

app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({
      where: { email }
    });

    if (exists) {
      return res.status(400).json({
        message: "Email já cadastrado"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash
    });

    res.status(201).json(user);

  } catch {
    res.status(500).json({
      message: "Erro ao criar usuário"
    });
  }
});

/* =========================
   🔐 LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        message: "Usuário não encontrado"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        message: "Senha inválida"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      "segredo_super_secreto",
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch {
    res.status(500).json({
      message: "Erro no login"
    });
  }
});

/* =========================
   PROFILE
========================= */
app.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findByPk(req.user.id);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

/* =========================
   🏠 SPACES
========================= */
app.get("/spaces", async (req, res) => {
  const spaces = await Space.findAll({
    order: [["id", "DESC"]]
  });

  res.json(spaces);
});

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

  } catch {
    res.status(500).json({
      message: "Erro ao criar espaço"
    });
  }
});

app.get("/spaces/:id", async (req, res) => {
  const space = await Space.findByPk(req.params.id);

  if (!space) {
    return res.status(404).json({
      message: "Espaço não encontrado"
    });
  }

  res.json(space);
});

/* =========================
   📅 RESERVATIONS
========================= */

// criar reserva
app.post("/reservations", async (req, res) => {
  try {
    const {
      customerName,
      phone,
      startDateTime,
      endDateTime,
      spaceId
    } = req.body;

    if (
      !customerName ||
      !phone ||
      !startDateTime ||
      !endDateTime ||
      !spaceId
    ) {
      return res.status(400).json({
        message: "Preencha todos os campos."
      });
    }

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      return res.status(400).json({
        message: "Data final deve ser maior que inicial."
      });
    }

    const reservation = await Reservation.create({
      customerName,
      phone,
      startDateTime,
      endDateTime,
      spaceId
    });

    res.status(201).json(reservation);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Erro ao criar reserva"
    });
  }
});

// listar reservas
app.get("/reservations", async (req, res) => {
  const reservations =
    await Reservation.findAll({
      order: [["id", "DESC"]]
    });

  res.json(reservations);
});

app.get("/reservations/:spaceId/:date", async (req, res) => {
  try {
    const { spaceId, date } = req.params;

    const reservations = await Reservation.findAll({
      where: {
        spaceId,
        date
      }
    });

    const times = reservations.map(r => r.time);

    res.json(times);

  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar horários"
    });
  }
});

/* =========================
   🚀 START
========================= */
sequelize.sync()
  .then(() => {
    console.log("Banco sincronizado 🚀");

    app.listen(8000, () => {
      console.log("Servidor rodando na porta 8000");
    });
  })
  .catch(console.log);