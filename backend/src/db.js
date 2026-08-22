const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

async function testDatabase() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("✅ PostgreSQL connected successfully");
        console.log("Database time:", result.rows[0].now);
    } catch (error) {
        console.error("❌ PostgreSQL connection failed:");
        console.error(error.message);
    }
}

testDatabase();

module.exports = pool;