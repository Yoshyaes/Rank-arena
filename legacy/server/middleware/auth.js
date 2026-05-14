const { createClient } = require('@supabase/supabase-js');
const queries = require('../db/queries');

let supabase = null;

function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

// Optional auth — attaches user if token present, continues as guest if not
async function optionalAuth(req, res, next) {
  req.user = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  const sb = getSupabase();
  if (!sb) return next();

  try {
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return next();

    // Upsert user in our DB
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player';
    await queries.upsertUser(user.id, user.email, displayName);
    req.user = { id: user.id, email: user.email, displayName };
  } catch {
    // Auth failed silently — continue as guest
  }

  next();
}

// Required auth — returns 401 if no valid user
async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {});
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

module.exports = { optionalAuth, requireAuth };
