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
            if (err) return res.json({ success: false });

            if (result.length > 0) {
                return res.json({ success: false, message: "Student already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO student (name, email, password, education, field) VALUES (?, ?, ?, ?, ?)",
                [name, email, hashedPassword, education, field],
                err => {
                    if (err) return res.json({ success: false });
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
            if (!match) return res.json({ success: false });

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

/* ================= TEACHER REGISTER ================= */
app.post("/teacher/register", async (req, res) => {
    let { name, email, password } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();

    if (!name || !email || !password) {
        return res.json({ success: false, message: "All fields required" });
    }

    db.query(
        "SELECT id FROM teacher WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) return res.json({ success: false });

            if (result.length > 0) {
                return res.json({ success: false, message: "Teacher already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO teacher (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword],
                err => {
                    if (err) return res.json({ success: false });
                    res.json({ success: true });
                }
            );
        }
    );
});

/* ================= TEACHER LOGIN ================= */
app.post("/teacher/login", (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
        return res.json({ success: false, message: "Missing credentials" });
    }

    db.query(
        "SELECT * FROM teacher WHERE email = ?",
        [email],
        async (err, result) => {
            if (err || result.length === 0) {
                return res.json({ success: false, message: "Teacher not found" });
            }

            const match = await bcrypt.compare(password, result[0].password);
            if (!match) {
                return res.json({ success: false, message: "Invalid password" });
            }

            // ✅ SUCCESS RESPONSE
            res.json({
                success: true,
                teacher: {
                    id: result[0].id,
                    name: result[0].name,
                    email: result[0].email
                }
            });
        }
    );
});


/* ================= COURSES ================= */
app.get("/courses", (req, res) => {
    db.query("SELECT * FROM courses", (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, courses: result });
    });
});
// ================= TEACHER COURSES =================
app.get("/courses/teacher/:teacherId", (req, res) => {
    const teacherId = req.params.teacherId;

    db.query(
        "SELECT * FROM courses WHERE teacher_id = ?",
        [teacherId],
        (err, result) => {
            if (err) {
                return res.json({ success: false });
            }

            res.json({
                success: true,
                courses: result
            });
        }
    );
});


/* ================= STUDENT ENROLL COURSE (USING IDs) ================= */
app.post("/student/select-course", (req, res) => {
    const { student_email, course_name } = req.body;

    if (!student_email || !course_name) {
        return res.json({ success: false, message: "Missing data" });
    }

    db.query(
        "SELECT id FROM student WHERE email = ?",
        [student_email],
        (err, studentResult) => {
            if (err || studentResult.length === 0) {
                return res.json({ success: false, message: "Student not found" });
            }

            const student_id = studentResult[0].id;

            db.query(
                "SELECT id FROM courses WHERE course_name = ?",
                [course_name],
                (err, courseResult) => {
                    if (err || courseResult.length === 0) {
                        return res.json({ success: false, message: "Course not found" });
                    }

                    const course_id = courseResult[0].id;

                    db.query(
                        "SELECT id FROM student_courses WHERE student_id = ? AND course_id = ?",
                        [student_id, course_id],
                        (err, exist) => {
                            if (exist.length > 0) {
                                return res.json({ success: false, message: "Already enrolled" });
                            }

                            db.query(
                                "INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)",
                                [student_id, course_id],
                                err => {
                                    if (err) return res.json({ success: false });
                                    res.json({ success: true });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

/* ================= GET STUDENT COURSES ================= */
app.get("/student/courses/:email", (req, res) => {
    const email = req.params.email;

    const sql = `
        SELECT c.course_name
        FROM student_courses sc
        JOIN student s ON sc.student_id = s.id
        JOIN courses c ON sc.course_id = c.id
        WHERE s.email = ?
    `;

    db.query(sql, [email], (err, result) => {
        if (err) return res.json({ success: false });
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
            if (err) return res.json({ success: false });
            res.json({ success: true });
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
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

app.get("/notes", (req, res) => {
    db.query("SELECT * FROM notes", (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, notes: result });
    });
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
