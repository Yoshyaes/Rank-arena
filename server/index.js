require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes — mounted at both /api and /arena/api for flexibility
app.use('/api/challenge', require('./routes/challenge'));
app.use('/api/endless', require('./routes/endless'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/share', require('./routes/share'));

// Mirror under /arena/api for WordPress integration
app.use('/arena/api/challenge', require('./routes/challenge'));
app.use('/arena/api/endless', require('./routes/endless'));
app.use('/arena/api/leaderboard', require('./routes/leaderboard'));
app.use('/arena/api/user', require('./routes/user'));
app.use('/arena/api/admin', require('./routes/admin'));
app.use('/arena/api/share', require('./routes/share'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: serve static files from dist
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use('/arena', express.static(distPath));
  app.get('/arena/*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
