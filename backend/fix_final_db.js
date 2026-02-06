const mysql = require("mysql2");

// 1. Connect to Database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // ⚠️ Put your MySQL password here if you have one!
    database: "eduvillage"
});

db.connect();

console.log("🛠️  Updating Database Structure...");

// 2. Drop the old table (It's easier to recreate it than fix it)
const dropQuery = "DROP TABLE IF EXISTS notes";

// 3. Create the NEW table (With the 'description' column included)
const createQuery = `
    CREATE TABLE notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_name VARCHAR(255),
        content TEXT,
        course_id INT,
        description VARCHAR(255),  -- ✅ This is the missing piece!
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

// RUN THE COMMANDS
db.query(dropQuery, (err) => {
    if (err) console.error("❌ Error dropping table:", err);
    else console.log("✅ Old notes table removed.");

    db.query(createQuery, (err) => {
        if (err) console.error("❌ Error creating table:", err);
        else console.log("✅ SUCCESS! New 'notes' table created with Title column.");
        
        db.end(); // Close connection
    });
});