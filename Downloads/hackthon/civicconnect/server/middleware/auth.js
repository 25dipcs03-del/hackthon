import { supabaseAdmin } from '../config/supabase.js';

// Middleware: verify JWT and attach user to request
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware: require admin role (verified server-side, never trusting frontend)
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Profile not found' });
    }
    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.profile = profile;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Authorization failed' });
  }
};

// Middleware: attach profile to request (optional auth check)
export const attachProfile = async (req, res, next) => {
  try {
    if (!req.user) return next();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    req.profile = profile;
    next();
  } catch {
    next();
  }
};
