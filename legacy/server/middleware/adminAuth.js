function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ message: 'Authentication required' });
  }

  const encoded = authHeader.split(' ')[1];
  const decoded = Buffer.from(encoded, 'base64').toString();
  const [, password] = decoded.split(':');

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: 'Invalid credentials' });
  }

  next();
}

module.exports = adminAuth;
