// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());            // Allow frontend requests
app.use(bodyParser.json()); // Parse JSON requests

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'eduvillage'
});

db.connect(err => {
    if (err) console.log('DB Connection Error:', err);
    else console.log('Connected to MySQL');
});

// ------------------- REGISTER -------------------
app.post('/api/register/student', (req, res) => {
    const { name, email, password, education_level, field_of_study } = req.body;
    const query = 'INSERT INTO students (name,email,password,education_level,field_of_study) VALUES (?,?,?,?,?)';
    db.query(query, [name, email, password, education_level, field_of_study], (err, result) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success' });
    });
});

app.post('/api/register/teacher', (req, res) => {
    const { name, email, password, subject } = req.body;
    const query = 'INSERT INTO teachers (name,email,password,subject) VALUES (?,?,?,?)';
    db.query(query, [name, email, password, subject], (err, result) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success' });
    });
});

// ------------------- LOGIN -------------------
app.post('/api/login/student', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM students WHERE email=? AND password=?';
    db.query(query, [email, password], (err, results) => {
        if (err) return res.json({ status: 'error', message: err });
        if (results.length > 0) res.json({ status: 'success', user: results[0] });
        else res.json({ status: 'error', message: 'Invalid Credentials' });
    });
});

app.post('/api/login/teacher', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM teachers WHERE email=? AND password=?';
    db.query(query, [email, password], (err, results) => {
        if (err) return res.json({ status: 'error', message: err });
        if (results.length > 0) res.json({ status: 'success', user: results[0] });
        else res.json({ status: 'error', message: 'Invalid Credentials' });
    });
});

// ------------------- DASHBOARD DATA -------------------
// Student: profile, assignments, leaderboard
app.get('/api/student/:id/profile', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT id,name,email,education_level,field_of_study FROM students WHERE id=?';
    db.query(query, [id], (err, results) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success', data: results[0] });
    });
});

app.get('/api/teacher/:id/profile', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT id,name,email,subject FROM teachers WHERE id=?';
    db.query(query, [id], (err, results) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success', data: results[0] });
    });
});

// Get all students (for teacher dashboard)
app.get('/api/students', (req, res) => {
    const query = 'SELECT id,name,email,education_level,field_of_study FROM students';
    db.query(query, (err, results) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success', students: results });
    });
});

// Add course
app.post('/api/course', (req, res) => {
    const { teacher_id, name } = req.body;
    const query = 'INSERT INTO courses (teacher_id,name) VALUES (?,?)';
    db.query(query, [teacher_id, name], (err, result) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success' });
    });
});

// Add assignment
app.post('/api/assignment', (req, res) => {
    const { teacher_id, title, description } = req.body;
    const query = 'INSERT INTO assignments (teacher_id,title,description) VALUES (?,?,?)';
    db.query(query, [teacher_id, title, description], (err, result) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success' });
    });
});

// Add notes
app.post('/api/notes', (req, res) => {
    const { teacher_id, content } = req.body;
    const query = 'INSERT INTO notes (teacher_id,content) VALUES (?,?)';
    db.query(query, [teacher_id, content], (err, result) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success' });
    });
});

// Get assignments for student
app.get('/api/student/:id/assignments', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM assignments';
    db.query(query, (err, results) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success', assignments: results });
    });
});

// Add feedback
app.post('/api/student/:id/feedback', (req, res) => {
    const student_id = req.params.id;
    const { message } = req.body;
    const query = 'INSERT INTO feedback (student_id,message) VALUES (?,?)';
    db.query(query, [student_id, message], (err, result) => {
        if (err) return res.json({ status: 'error', message: err });
        res.json({ status: 'success' });
    });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
