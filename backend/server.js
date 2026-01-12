const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- MYSQL CONNECTION ----------------
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",       // your MySQL root password
    database: "eduvillage"
});

db.connect(err => {
    if (err) console.log("DB Connection Error:", err);
    else console.log("MySQL connected!");
});

// ---------------- REGISTER ----------------
app.post("/register", async (req, res) => {
    const { username, password, role, fullName } = req.body;

    if (!username || !password || !role) {
        return res.json({ message: "All fields are required" });
    }

    // Check if user exists
    db.query(
        "SELECT * FROM users WHERE username = ? AND role = ?",
        [username, role],
        async (err, results) => {
            if (err) return res.json({ message: "Database error" });
            if (results.length > 0) return res.json({ message: "User already registered" });

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into DB
            db.query(
                "INSERT INTO users (fullName, username, password, role) VALUES (?, ?, ?, ?)",
                [fullName, username, hashedPassword, role],
                (err, result) => {
                    if (err) return res.json({ message: "Database error" });
                    res.json({ message: "Registration successful" });
                }
            );
        }
    );
});

// ---------------- LOGIN ----------------
app.post("/login", (req, res) => {
    const { username, password, role } = req.body;

    db.query(
        "SELECT * FROM users WHERE username = ? AND role = ?",
        [username, role],
        async (err, results) => {
            if (err) return res.json({ message: "Database error" });
            if (results.length === 0) return res.json({ message: "User not found" });

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) return res.json({ message: "Invalid password" });

            res.json({
                message: "Login successful",
                user: {
                    username: user.username,
                    fullName: user.fullName,
                    role: user.role
                }
            });
        }
    );
});

// ---------------- GET STUDENTS (for teacher dashboard) ----------------
app.get("/getStudents", (req, res) => {
    const sql = "SELECT fullName, username FROM users WHERE role = 'student'";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ message: "Failed to list students" });
        }

        // Add a course field if you want, or default to "N/A"
        const students = results.map(r => ({ ...r, course: "N/A" }));
        res.json({ students });
    });
});



// ---------------- START SERVER ----------------
app.listen(PORT, () => {
    console.log(Server running on http://localhost:${PORT});
});