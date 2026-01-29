const mysql = require("mysql2");

// Create connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // your MySQL username
  password: "",       // your MySQL password
  database: "eduvillage" // your database name
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database!");
  }
});

module.exports = db;