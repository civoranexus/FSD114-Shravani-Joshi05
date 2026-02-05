const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",  // Add your password if you have one
    database: "eduvillage"
});

db.connect();

console.log("🛠️  Fixing Notes Table...");

// 1. Drop the old table (Warning: deletes existing notes)
db.query("DROP TABLE IF EXISTS notes", (err) => {
    if (err) throw err;
    console.log("✅ Old notes table deleted.");

    // 2. Create the new table with the CORRECT columns
    const createTableQuery = `
        CREATE TABLE notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_name VARCHAR(255),
            content TEXT,
            course_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error("❌ Error creating table:", err.message);
        } else {
            console.log("✅ New 'notes' table created successfully!");
        }
        db.end();
    });
});