require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

const SECRET = process.env.JWT_SECRET;

// MODELS
const User = mongoose.model("User", {
  username: String,
  password: String,
  role: String
});

const Course = mongoose.model("Course", {
  title: String
});

const Session = mongoose.model("Session", {
  title: String,
  date: String,
  time: String,
  meetLink: String,
  student: String,
  tutor: String
});

// AUTH
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("No token");

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Invalid token");
    req.user = decoded;
    next();
  });
};

// LOGIN
app.post("/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(401).send("Invalid");

  const token = jwt.sign({ role: user.role }, SECRET);
  res.json({ token });
});

// ADMIN → CREATE USER
app.post("/user", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);

  await User.create(req.body);
  res.send("User created");
});

// ADMIN → CREATE COURSE
app.post("/course", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);

  await Course.create(req.body);
  res.send("Course created");
});

// ✅ ADMIN STATS
app.get("/admin/stats", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Only admin");
  }

  const users = await User.find();
  const sessions = await Session.find();

  res.json({
    totalUsers: users.length,
    totalSessions: sessions.length,
    users
  });
});

// GET STUDENTS
app.get("/users", verifyToken, async (req, res) => {
  const users = await User.find({ role: "student" });
  res.json(users);
});

// CREATE SESSION (TUTOR)
app.post("/session", verifyToken, async (req, res) => {
  if (req.user.role !== "tutor") return res.sendStatus(403);

  const { title, date, time, student } = req.body;

  const meetLink = `https://meet.google.com/${Math.random()
    .toString(36)
    .substring(2, 6)}-${Math.random()
    .toString(36)
    .substring(2, 6)}-${Math.random()
    .toString(36)
    .substring(2, 6)}`;

  const session = await Session.create({
    title,
    date,
    time,
    meetLink,
    student,
    tutor: req.user.role
  });

  res.json(session);
});

// UPDATE SESSION (RESCHEDULE)
app.put("/session/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "tutor") return res.sendStatus(403);

  const { date, time } = req.body;

  await Session.findByIdAndUpdate(req.params.id, { date, time });
  res.send("Updated");
});

// GET SESSIONS
app.get("/sessions", verifyToken, async (req, res) => {
  const sessions = await Session.find();
  res.json(sessions);
});

// DASHBOARD
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ role: req.user.role });
});

app.listen(5000, () => console.log("Server running"));