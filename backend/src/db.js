const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error:", err.message);
});

module.exports = pool;