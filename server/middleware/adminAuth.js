const { timingSafeEqual } = require('crypto');

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ message: 'Authentication required' });
  }

  const encoded = authHeader.split(' ')[1];
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [, password] = decoded.split(':');

  // Use constant-time comparison to prevent timing-based password enumeration
  const provided = Buffer.from(password || '');
  const expected = Buffer.from(process.env.ADMIN_PASSWORD || '');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(403).json({ message: 'Invalid credentials' });
  }

  next();
}

module.exports = adminAuth;
