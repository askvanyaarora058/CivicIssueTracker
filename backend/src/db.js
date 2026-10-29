
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Keep each backend instance's connection usage small.
    max: 3,

    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,

    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    console.log("PostgreSQL connection established");
});

pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err.message);
});

module.exports = pool;
