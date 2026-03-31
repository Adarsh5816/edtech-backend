require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB error ❌", err));

const SECRET = process.env.JWT_SECRET;

// ✅ Models
const User = mongoose.model("User", {
  username: String,
  password: String,
  role: String
});

const Course = mongoose.model("Course", {
  title: String,
  createdBy: String,
  date: String
});

const Session = mongoose.model("Session", {
  title: String,
  date: String
});

// ✅ Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).send("No token");

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Invalid token");
    req.user = decoded;
    next();
  });
};

// ✅ Seed Users (RUN ONCE)
app.get("/seed", async (req, res) => {
  await User.deleteMany();

  await User.create({ username: "student", password: "123", role: "student" });
  await User.create({ username: "tutor", password: "123", role: "tutor" });
  await User.create({ username: "admin", password: "123", role: "admin" });

  res.send("Users added ✅");
});

// ✅ Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (!user) return res.status(401).send("Invalid credentials");

  const token = jwt.sign({ role: user.role }, SECRET, {
    expiresIn: "1h"
  });

  res.json({ token });
});

// ✅ Create Course
app.post("/course", verifyToken, async (req, res) => {
  if (req.user.role !== "tutor") {
    return res.status(403).send("Only tutors can create courses");
  }

  const { title } = req.body;

  await Course.create({
    title,
    createdBy: req.user.role,
    date: new Date().toISOString()
  });

  res.json({ message: "Course created" });
});

// ✅ Get Courses
app.get("/courses", verifyToken, async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

// ✅ Create Session
app.post("/session", verifyToken, async (req, res) => {
  if (req.user.role !== "tutor") {
    return res.status(403).send("Only tutors can create sessions");
  }

  const { title, date } = req.body;

  await Session.create({ title, date });

  res.json({ message: "Session created" });
});

// ✅ Get Sessions
app.get("/sessions", verifyToken, async (req, res) => {
  const sessions = await Session.find();
  res.json(sessions);
});

// ✅ Dashboard
app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.role}` });
});

// ✅ Admin
app.get("/admin", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Access denied");
  }

  const users = await User.find();
  const courses = await Course.find();
  const sessions = await Session.find();

  res.json({ users, courses, sessions });
});

// ✅ Start Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});