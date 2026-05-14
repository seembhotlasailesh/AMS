const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { serializeUser } = require('../utils/serializers');

const protect = async (req, res, next) => {
    let token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');

            const user = await prisma.users.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true }
            });

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = serializeUser(user);
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (req.user && roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ message: 'Not authorized for this role' });
        }
    };
};

module.exports = { protect, authorize };
