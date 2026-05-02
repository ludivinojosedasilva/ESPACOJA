const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const sequelize = require("./config/database");
const User = require("./models/User");
const Space = require("./models/Space");
const Reservation = require("./models/Reservation");

const app = express();

/* =========================
   📁 UPLOAD CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/* =========================
   🌐 MIDDLEWARES
========================= */
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* =========================
   🔐 AUTH
========================= */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token não fornecido"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      "segredo_super_secreto"
    );

    req.user = decoded;
    next();

  } catch {
    return res.status(401).json({
      message: "Token inválido"
    });
  }
}

/* =========================
   📌 BASE
========================= */
app.get("/", (req, res) => {
  res.json({
    message: "API EspaçoJá funcionando 🚀"
  });
});

/* =========================
   👤 USERS
========================= */
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

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email
    });

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
   👤 PROFILE
========================= */
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });

  } catch {
    res.status(500).json({
      message: "Erro ao buscar perfil"
    });
  }
});

/* =========================
   🏠 SPACES
========================= */

// LISTAR
app.get("/spaces", async (req, res) => {
  try {
    const spaces = await Space.findAll({
      order: [["id", "DESC"]]
    });

    res.json(spaces);

  } catch {
    res.status(500).json({
      message: "Erro ao buscar espaços"
    });
  }
});

// CRIAR
app.post("/spaces", upload.single("image"), async (req, res) => {
  try {
    const { name, description, location, price } = req.body;

    let image = null;

    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const space = await Space.create({
      name,
      description,
      location,
      price,
      image
    });

    res.status(201).json(space);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Erro ao criar espaço"
    });
  }
});

// DETALHE
app.get("/spaces/:id", async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);

    if (!space) {
      return res.status(404).json({
        message: "Espaço não encontrado"
      });
    }

    res.json(space);

  } catch {
    res.status(500).json({
      message: "Erro ao buscar espaço"
    });
  }
});

// 🔥 UPDATE (CORRIGIDO)
app.put("/spaces/:id", upload.single("image"), async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);

    if (!space) {
      return res.status(404).json({
        message: "Espaço não encontrado"
      });
    }

    const { name, description, location, price } = req.body;

    let image = space.image;

    // se enviar nova imagem → substitui
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    await space.update({
      name,
      description,
      location,
      price,
      image
    });

    res.json(space);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Erro ao atualizar espaço"
    });
  }
});

// 🔥 DELETE (CORRIGIDO)
app.delete("/spaces/:id", async (req, res) => {
  try {
    const space = await Space.findByPk(req.params.id);

    if (!space) {
      return res.status(404).json({
        message: "Espaço não encontrado"
      });
    }

    await space.destroy();

    res.json({
      message: "Espaço deletado com sucesso"
    });

  } catch {
    res.status(500).json({
      message: "Erro ao deletar espaço"
    });
  }
});

/* =========================
   📅 RESERVATIONS
========================= */

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

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      return res.status(400).json({
        message: "Data final inválida"
      });
    }

    const reservations = await Reservation.findAll({
      where: { spaceId }
    });

    for (const item of reservations) {
      const hasConflict =
        start < new Date(item.endDateTime) &&
        end > new Date(item.startDateTime);

      if (hasConflict) {
        return res.status(400).json({
          message: "Já reservado nesse horário"
        });
      }
    }

    const reservation = await Reservation.create(req.body);

    res.status(201).json(reservation);

  } catch {
    res.status(500).json({
      message: "Erro ao criar reserva"
    });
  }
});

app.get("/reservations", async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      order: [["id", "DESC"]]
    });

    res.json(reservations);

  } catch {
    res.status(500).json({
      message: "Erro ao buscar reservas"
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