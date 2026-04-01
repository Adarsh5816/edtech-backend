require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const SECRET = process.env.JWT_SECRET || "edtech_secret";

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("DB ERROR:", err));

// MODELS
const User = mongoose.model("User", {
  username: String,
  password: String,
  role: String
});

const Session = mongoose.model("Session", {
  title: String,
  date: String,
  time: String,
  student: String,
  tutor: String,
  meetLink: String
});

// AUTH
const verify = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) return res.status(403).json({ error: "No token" });

    const data = jwt.verify(token, SECRET);
    req.user = data;
    next();

  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { role: user.role, username: user.username },
      SECRET
    );

    res.json({ token });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DASHBOARD (IMPORTANT - you were missing this)
app.get("/dashboard", verify, (req, res) => {
  res.json({ role: req.user.role });
});

// USERS
app.get("/users", verify, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const users = await User.find();
  res.json(users);
});

app.post("/user", verify, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  await User.create(req.body);
  res.json({ message: "User created" });
});

// SESSIONS
app.get("/sessions", verify, async (req, res) => {
  const { role, username } = req.user;

  if (role === "admin") return res.json(await Session.find());
  if (role === "tutor") return res.json(await Session.find({ tutor: username }));
  if (role === "student") return res.json(await Session.find({ student: username }));
});

app.post("/session", verify, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2,8)}`;

  await Session.create({ ...req.body, meetLink });

  res.json({ message: "Session created" });
});

app.put("/session/:id", verify, async (req, res) => {
  await Session.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

app.listen(PORT, () => console.log("Server running"));