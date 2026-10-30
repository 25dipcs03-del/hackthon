import { supabaseAdmin } from '../config/supabase.js';

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password and full name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role: 'citizen' }
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in.',
      user_id: data.user.id
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, phone, avatar_url')
      .eq('id', data.user.id)
      .single();

    return res.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  try {
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/auth/profile
export async function getProfile(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/auth/profile
export async function updateProfile(req, res) {
  try {
    const { full_name, phone } = req.body;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, phone, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/citizen/notifications
export async function getCitizenNotifications(req, res) {
  try {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
