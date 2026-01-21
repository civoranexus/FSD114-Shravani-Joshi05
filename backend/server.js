const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "eduvillage"
});

db.connect(err => {
    if (err) {
        console.log("❌ DB Error:", err);
    } else {
        console.log("✅ MySQL Connected");
    }
});

/* ================= STUDENT REGISTER ================= */
app.post("/student/register", async (req, res) => {
    let { name, email, password, education, field } = req.body;

    // ✅ sanitize inputs
    name = name?.trim();
    email = email?.trim().toLowerCase();
    education = education?.trim();
    field = field?.trim();

    if (!name || !email || !password || !education || !field) {
        return res.json({ success: false, message: "All fields are required" });
    }

    db.query(
        "SELECT id FROM student WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                console.log("SELECT ERROR:", err);
                return res.json({ success: false, message: "Database error" });
            }

            if (result.length > 0) {
                return res.json({ success: false, message: "Student already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO student (name, email, password, education, field) VALUES (?, ?, ?, ?, ?)",
                [name, email, hashedPassword, education, field],
                (err) => {
                    if (err) {
                        console.log("INSERT ERROR:", err);
                        return res.json({ success: false, message: "Insert failed" });
                    }

                    res.json({
                        success: true,
                        message: "Student registered successfully"
                    });
                }
            );
        }
    );
});

/* ================= TEACHER REGISTER ================= */
app.post("/teacher/register", async (req, res) => {
    let { name, email, password, subject } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();
    subject = subject?.trim();

    if (!name || !email || !password || !subject) {
        return res.json({ success: false, message: "All fields are required" });
    }

    db.query(
        "SELECT id FROM teacher WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "Database error" });
            }

            if (result.length > 0) {
                return res.json({ success: false, message: "Teacher already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO teacher (name, email, password, subject) VALUES (?, ?, ?, ?)",
                [name, email, hashedPassword, subject],
                (err) => {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false, message: "Insert failed" });
                    }

                    res.json({
                        success: true,
                        message: "Teacher registered successfully"
                    });
                }
            );
        }
    );
});

/* ================= STUDENT LOGIN ================= */
app.post("/student/login", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    db.query(
        "SELECT * FROM student WHERE email = ?",
        [email],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.json({ success: false, message: "Student not found" });
            }

            const match = await bcrypt.compare(password, result[0].password);
            if (!match) {
                return res.json({ success: false, message: "Wrong password" });
            }

            res.json({
                success: true,
                student: {
                    name: result[0].name,
                    email: result[0].email
                }
            });
        }
    );
});

/* ================= TEACHER LOGIN ================= */
app.post("/teacher/login", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    db.query(
        "SELECT * FROM teacher WHERE email = ?",
        [email],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.json({ success: false, message: "Teacher not found" });
            }

            const match = await bcrypt.compare(password, result[0].password);
            if (!match) {
                return res.json({ success: false, message: "Wrong password" });
            }

            res.json({
                success: true,
                name: result[0].name,
                email: result[0].email
            });
        }
    );
});

/* ================= COURSES ================= */
app.post("/course/add", (req, res) => {
    const course_name = req.body.course_name?.trim();

    if (!course_name) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO courses (course_name) VALUES (?)",
        [course_name],
        err => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.get("/courses", (req, res) => {
    db.query("SELECT * FROM courses", (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ success: false });
        }
        res.json({ success: true, courses: result });
    });
});

/* ================= ASSIGNMENTS ================= */
app.post("/assignment/add", (req, res) => {
    const { title, description, course_name, teacher_name } = req.body;

    if (!title || !course_name || !teacher_name) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO assignments (title, description, course_name, teacher_name) VALUES (?, ?, ?, ?)",
        [title, description, course_name, teacher_name],
        err => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.get("/assignments/:teacherName", (req, res) => {
    db.query(
        "SELECT * FROM assignments WHERE teacher_name = ?",
        [req.params.teacherName],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true, assignments: result });
        }
    );
});

app.get("/assignments", (req, res) => {
    db.query(
        "SELECT title, description, course_name, teacher_name FROM assignments ORDER BY id DESC",
        (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true, assignments: result });
        }
    );
});

/* ================= NOTES ================= */
app.post("/notes", (req, res) => {
    const teacherName = req.body.teacherName?.trim();
    const content = req.body.content?.trim();

    if (!teacherName || !content) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO notes (teacher_name, content) VALUES (?, ?)",
        [teacherName, content],
        err => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.get("/notes", (req, res) => {
    db.query(
        "SELECT teacher_name, content, created_at FROM notes ORDER BY created_at DESC",
        (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true, notes: result });
        }
    );
});

/* ================= STUDENTS ================= */
app.get("/students", (req, res) => {
    db.query(
        "SELECT name, email FROM student",
        (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false });
            }
            res.json({ success: true, students: result });
        }
    );
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
