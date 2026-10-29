
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const { generateSecret, generateURI, verify } = require("otplib");

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Create a JWT after successful authentication.
function createToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash]
        );

        return res.status(201).json({
            message: "Registration successful",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Server error"
        });
    }
});

// MFA SETUP: Generate a QR code for the logged-in user.
router.post("/mfa/setup", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, email, mfa_enabled FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = result.rows[0];

        if (user.mfa_enabled) {
            return res.status(409).json({
                message: "MFA is already enabled"
            });
        }

        const secret = generateSecret();

        const uri = generateURI({
            strategy: "totp",
            issuer: "CivicIssueTracker",
            label: user.email,
            secret
        });

        await pool.query(
            "UPDATE users SET mfa_secret = $1 WHERE id = $2",
            [secret, user.id]
        );

        const qrCode = await QRCode.toDataURL(uri);

        return res.json({
            message: "Scan the QR code using your authenticator app",
            qrCode
        });
    } catch (error) {
        console.error("MFA setup error:", error.message);

        return res.status(500).json({
            message: "Could not start MFA setup"
        });
    }
});

// VERIFY MFA SETUP: Enable MFA only after a valid authenticator code.
router.post("/mfa/verify-setup", authenticateToken, async (req, res) => {
    try {
        const { token } = req.body || {};

        if (!/^\d{6}$/.test(String(token || ""))) {
            return res.status(400).json({
                message: "Enter the six-digit authenticator code"
            });
        }

        const result = await pool.query(
            `SELECT id, mfa_secret, mfa_enabled
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0 || !result.rows[0].mfa_secret) {
            return res.status(400).json({
                message: "Start MFA setup first"
            });
        }

        const user = result.rows[0];

        if (user.mfa_enabled) {
            return res.status(409).json({
                message: "MFA is already enabled"
            });
        }

        const check = await verify({
            secret: user.mfa_secret,
            token: String(token)
        });

        if (!check.valid) {
            return res.status(401).json({
                message: "Invalid authenticator code"
            });
        }

        await pool.query(
            "UPDATE users SET mfa_enabled = TRUE WHERE id = $1",
            [user.id]
        );

        return res.json({
            message: "MFA enabled successfully"
        });
    } catch (error) {
        console.error("MFA verification error:", error.message);

        return res.status(500).json({
            message: "Could not verify MFA setup"
        });
    }
});

// LOGIN: Password first, then TOTP if MFA is enabled.
router.post("/login", async (req, res) => {
    try {
        const { email, password, otp } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            `SELECT id, name, email, password_hash, role,
                    mfa_secret, mfa_enabled
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (user.mfa_enabled) {
            if (!user.mfa_secret) {
                return res.status(401).json({
                    message: "MFA configuration is incomplete. Contact an administrator."
                });
            }

            if (!/^\d{6}$/.test(String(otp || ""))) {
                return res.status(401).json({
                    mfaRequired: true,
                    message: "Enter your six-digit authenticator code"
                });
            }

            const check = await verify({
                secret: user.mfa_secret,
                token: String(otp)
            });

            if (!check.valid) {
                return res.status(401).json({
                    mfaRequired: true,
                    message: "Invalid authenticator code"
                });
            }
        }

        const token = createToken(user);

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;
