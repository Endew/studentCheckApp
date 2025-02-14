const jwt = require('jsonwebtoken');
const SECRET_KEY = '123456';

function authenticateToken(req, res, next) {
    const tokenheader = req.headers['authorization'];
    const token = tokenheader.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Invalid token',
                status: 0 
            });
        }
        req.user = decoded;
        next();
    });
}

module.exports = { authenticateToken, SECRET_KEY };