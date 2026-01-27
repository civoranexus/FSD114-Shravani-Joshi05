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
                        return res.json({ success: false, message: "Insert failed" });
                    }

                    res.json({ success: true });
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
                return res.json({ success: false });
            }

            const match = await bcrypt.compare(password, result[0].password);
            if (!match) {
                return res.json({ success: false });
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
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.get("/courses", (req, res) => {
    db.query("SELECT * FROM courses", (err, result) => {
        if (err) {
            return res.json({ success: false });
        }
        res.json({ success: true, courses: result });
    });
});

/* =====================================================
   🔹 NEW CODE STARTS HERE (ONLY ADDITION)
   Student selects course
===================================================== */
app.post("/student/select-course", (req, res) => {
    const { student_email, course_name } = req.body;

    if (!student_email || !course_name) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO student_courses (student_email, course_name) VALUES (?, ?)",
        [student_email, course_name],
        (err) => {
            if (err) {
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

/* Get selected courses of logged-in student */
app.get("/student/courses/:email", (req, res) => {
    const email = req.params.email;

    db.query(
        "SELECT course_name FROM student_courses WHERE student_email = ?",
        [email],
        (err, result) => {
            if (err) {
                return res.json({ success: false });
            }
            res.json({ success: true, courses: result });
        }
    );
});
/* =====================================================
   🔹 NEW CODE ENDS HERE
===================================================== */

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
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.get("/assignments/course/:courseName", (req, res) => {
    db.query(
        "SELECT * FROM assignments WHERE course_name = ?",
        [req.params.courseName],
        (err, result) => {
            if (err) {
                return res.json({ success: false });
            }
            res.json({ success: true, assignments: result });
        }
    );
});

/* ================= NOTES ================= */
app.post("/notes", (req, res) => {
    const { teacherName, content } = req.body;

    if (!teacherName || !content) {
        return res.json({ success: false });
    }

    db.query(
        "INSERT INTO notes (teacher_name, content) VALUES (?, ?)",
        [teacherName, content],
        err => {
            if (err) {
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});

app.get("/notes", (req, res) => {
    db.query(
        "SELECT teacher_name, content FROM notes",
        (err, result) => {
            if (err) {
                return res.json({ success: false });
            }
            res.json({ success: true, notes: result });
        }
    );
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
