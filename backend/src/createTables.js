const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function createTables() {
    try {
        const schemaPath = path.join(__dirname, "..", "schema.sql");

        const sql = fs.readFileSync(schemaPath, "utf8");

        console.log("Executing schema.sql...");

        await pool.query(sql);

        console.log("Database tables created successfully!");

        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log("Tables now in database:");
        console.log(result.rows);

    } catch (error) {
        console.error("Error creating tables:");
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

createTables();
