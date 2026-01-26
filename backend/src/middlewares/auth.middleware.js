const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
    // 1. Get token from header
    const token = req.header("Authorization");

    // 2. Check if no token
    if (!token) {
        console.warn("[Auth] No token provided in header");
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    // 3. Verify token
    try {
        // Remove 'Bearer ' if present
        const cleanToken = token.startsWith("Bearer ")
            ? token.slice(7, token.length)
            : token;

        const decoded = jwt.verify(
            cleanToken,
            process.env.JWT_SECRET || "default_secret"
        );

        // 4. Attach user to request object
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error("[Auth] Token verification failed:", err.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};
