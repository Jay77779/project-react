const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/student');
const Teacher = require('../models/teacher');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // Change this in production

// Register Student
router.post('/register/student', async (req, res) => {
  try {
    const { name, dob, email, course, password, phone, address, semester, division, exams } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({
      name,
      dob,
      email,
      course,
      password: hashedPassword,
      phone,
      address,
      semester,
      division,
      exams,
    });
    await student.save();
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Register Teacher
router.post('/register/teacher', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = new Teacher({ name, email, password: hashedPassword });
    await teacher.save();
    res.status(201).json({ message: 'Teacher registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login (Student or Teacher)
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    let user;
    if (role === 'teacher') {
      user = await Teacher.findOne({ email });
    } else {
      user = await Student.findOne({ email });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role || role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role || role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to verify JWT and role
function authMiddleware(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      req.user = decoded;
      next();
    });
  };
}

module.exports = { router, authMiddleware };