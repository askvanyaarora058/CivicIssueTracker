const requireAdmin = require("../middleware/adminMiddleware");
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE ISSUE
router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            photo_url,
            latitude,
            longitude,
            address
        } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                message: "Title, description and category are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO issues
            (title, description, category, photo_url,
             latitude, longitude, address, reported_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                title,
                description,
                category,
                photo_url || null,
                latitude || null,
                longitude || null,
                address || null,
                req.user.id
            ]
        );

        res.status(201).json({
            message: "Issue reported successfully",
            issue: result.rows[0]
        });

    } catch (error) {
        console.error("Create issue error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// GET ALL ISSUES
router.get("/", async (req, res) => {
    try {
        const { status, category, search } = req.query;

let query = `
    SELECT
        issues.*,
        users.name AS reporter_name,
        users.email AS reporter_email
    FROM issues
    LEFT JOIN users
        ON issues.reported_by = users.id
`;

const conditions = [];
const values = [];

if (status) {
    values.push(status);
    conditions.push(`issues.status = $${values.length}`);
}

if (category) {
    values.push(category);
    conditions.push(`issues.category = $${values.length}`);
}

if (search) {
    values.push(`%${search}%`);
    conditions.push(`
        (
            issues.title ILIKE $${values.length}
            OR issues.description ILIKE $${values.length}
        )
    `);
}

if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
}

query += " ORDER BY issues.created_at DESC";

const result = await pool.query(query, values);
        res.json({
            count: result.rows.length,
            issues: result.rows
        });

    } catch (error) {
        console.error("Get issues error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// GET ONE ISSUE
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                issues.*,
                users.name AS reporter_name,
                users.email AS reporter_email
            FROM issues
            LEFT JOIN users
                ON issues.reported_by = users.id
            WHERE issues.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        res.json({
            issue: result.rows[0]
        });

    } catch (error) {
        console.error("Get issue error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});
// UPDATE ISSUE
router.put("/:id", authenticateToken, requireAdmin,async (req, res) => {
    try {
        const { id } = req.params;

        const {
            status,
            admin_comment
        } = req.body;

        // Check if issue exists
        const existingIssue = await pool.query(
            "SELECT * FROM issues WHERE id = $1",
            [id]
        );

        if (existingIssue.rows.length === 0) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        // Update issue
        const result = await pool.query(
            `UPDATE issues
             SET status = COALESCE($1, status),
                 admin_comment = COALESCE($2, admin_comment),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [status || null, admin_comment || null, id]
        );

        res.json({
            message: "Issue updated successfully",
            issue: result.rows[0]
        });

    } catch (error) {
        console.error("Update issue error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});
// DELETE ISSUE
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM issues WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        res.json({
            message: "Issue deleted successfully",
            issue: result.rows[0]
        });

    } catch (error) {
        console.error("Delete issue error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});
module.exports = router;