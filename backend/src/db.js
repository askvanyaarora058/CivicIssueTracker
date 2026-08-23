const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL connection established");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error:", err.message);
});

module.exports = pool;