import { supabaseAdmin } from '../config/supabase.js';
import { generateInsightsBrief, analyzeCategoryPatterns, clusterComplaints } from '../services/aiService.js';

// GET /api/admin/dashboard
export async function getAdminDashboard(req, res) {
  try {
    const { data: all } = await supabaseAdmin.from('complaints').select('id, status, priority, category, created_at');
    const complaints = all || [];

    const stats = {
      total: complaints.length,
      critical: complaints.filter(c => c.priority === 'Critical').length,
      submitted: complaints.filter(c => c.status === 'Submitted').length,
      underReview: complaints.filter(c => c.status === 'Under Review').length,
      assigned: complaints.filter(c => c.status === 'Assigned').length,
      inProgress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length,
      resolutionRate: complaints.length > 0
        ? Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100)
        : 0
    };

    // Category distribution
    const categoryBreakdown = complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    // Priority distribution
    const priorityBreakdown = complaints.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {});

    // Monthly trends (last 6 months)
    const now = new Date();
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const count = complaints.filter(c => {
        const cd = new Date(c.created_at);
        return cd >= d && cd < nextD;
      }).length;
      return { month: label, count };
    });

    // Status distribution
    const statusBreakdown = complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    // Department performance
    const { data: depts } = await supabaseAdmin.from('departments').select('id, name');
    const deptPerformance = await Promise.all((depts || []).map(async (dept) => {
      const { count: total } = await supabaseAdmin
        .from('complaints').select('id', { count: 'exact', head: true }).eq('department_id', dept.id);
      const { count: resolved } = await supabaseAdmin
        .from('complaints').select('id', { count: 'exact', head: true })
        .eq('department_id', dept.id).eq('status', 'Resolved');
      return { name: dept.name, total: total || 0, resolved: resolved || 0 };
    }));

    // Recent complaints
    const { data: recent } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, title, category, priority, status, created_at, location_address, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json({
      success: true,
      stats,
      charts: { categoryBreakdown, priorityBreakdown, monthlyTrends, statusBreakdown, deptPerformance },
      recent: recent || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/complaints
export async function getAdminComplaints(req, res) {
  try {
    const { search, category, priority, status, date_from, date_to, sort_by = 'created_at', sort_dir = 'desc', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('complaints')
      .select(`
        *,
        profiles!citizen_id(full_name, email),
        departments(name),
        ai_analysis(priority, ai_summary, analysis_status)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,complaint_number.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);
    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to + 'T23:59:59Z');

    const validSortColumns = ['created_at', 'priority_score', 'status', 'category', 'title'];
    const col = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    query = query.order(col, { ascending: sort_dir === 'asc' }).range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({ success: true, data: data || [], total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/complaints/:id
export async function getAdminComplaint(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        profiles!citizen_id(full_name, email, phone),
        departments(name, email, phone),
        complaint_images(*),
        ai_analysis(*),
        status_history(*, profiles(full_name)),
        assignments(*, departments(name))
      `)
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Complaint not found' });

    const { data: dupLinks } = await supabaseAdmin
      .from('duplicate_links')
      .select('*, original:original_complaint_id(id, complaint_number, title, status, location_address), duplicate:duplicate_complaint_id(id, complaint_number, title, status, location_address)')
      .or(`original_complaint_id.eq.${id},duplicate_complaint_id.eq.${id}`);

    return res.json({ success: true, data: { ...data, duplicate_links: dupLinks || [] } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/complaints/:id/status
export async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks, resolution_details } = req.body;

    const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: current } = await supabaseAdmin.from('complaints').select('status, citizen_id').eq('id', id).single();
    if (!current) return res.status(404).json({ error: 'Complaint not found' });

    const updates = { status, updated_at: new Date().toISOString() };
    if (remarks) updates.admin_remarks = remarks;
    if (resolution_details) updates.resolution_details = resolution_details;

    await supabaseAdmin.from('complaints').update(updates).eq('id', id);

    await supabaseAdmin.from('status_history').insert({
      complaint_id: id,
      old_status: current.status,
      new_status: status,
      changed_by: req.user.id,
      remarks
    });

    // Notify citizen
    if (current.citizen_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: current.citizen_id,
        title: 'Complaint Status Updated',
        message: `Your complaint status changed to: ${status}${remarks ? '. ' + remarks : ''}`,
        type: status === 'Resolved' ? 'success' : 'info',
        complaint_id: id
      });
    }

    return res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/complaints/:id/assign
export async function assignComplaint(req, res) {
  try {
    const { id } = req.params;
    const { department_id, assigned_officer, remarks } = req.body;

    // Fetch current status before updating
    const { data: current } = await supabaseAdmin
      .from('complaints')
      .select('status, citizen_id, title')
      .eq('id', id)
      .single();

    if (!current) return res.status(404).json({ error: 'Complaint not found' });

    await supabaseAdmin.from('complaints').update({
      department_id,
      assigned_officer,
      status: 'Assigned',
      updated_at: new Date().toISOString()
    }).eq('id', id);

    await supabaseAdmin.from('assignments').insert({
      complaint_id: id,
      department_id,
      assigned_by: req.user.id,
      assigned_officer,
      remarks
    });

    // Insert status_history record for the 'Assigned' transition
    await supabaseAdmin.from('status_history').insert({
      complaint_id: id,
      old_status: current.status,
      new_status: 'Assigned',
      changed_by: req.user.id,
      remarks: remarks || `Assigned to department. Officer: ${assigned_officer || 'TBD'}`
    });

    if (current.citizen_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: current.citizen_id,
        title: 'Complaint Assigned',
        message: `Your complaint "${current.title}" has been assigned to a department.`,
        type: 'info',
        complaint_id: id
      });
    }

    return res.json({ success: true, message: 'Complaint assigned' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/complaints/:id/priority
export async function updatePriority(req, res) {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const valid = ['Critical', 'High', 'Medium', 'Low'];
    if (!valid.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });

    const scoreMap = { Critical: 85, High: 70, Medium: 45, Low: 15 };
    await supabaseAdmin.from('complaints').update({
      priority,
      priority_score: scoreMap[priority],
      updated_at: new Date().toISOString()
    }).eq('id', id);

    return res.json({ success: true, message: 'Priority updated' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/departments
export async function getDepartments(req, res) {
  try {
    const { data, error } = await supabaseAdmin.from('departments').select('*').order('name');
    if (error) throw error;

    // Add complaint counts
    const enriched = await Promise.all((data || []).map(async (dept) => {
      const { count } = await supabaseAdmin.from('complaints').select('id', { count: 'exact', head: true }).eq('department_id', dept.id);
      return { ...dept, complaint_count: count || 0 };
    }));

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/admin/departments
export async function createDepartment(req, res) {
  try {
    const { name, description, head_officer, email, phone } = req.body;
    const { data, error } = await supabaseAdmin.from('departments').insert({ name, description, head_officer, email, phone }).select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/departments/:id
export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, description, head_officer, email, phone, active } = req.body;
    const { data, error } = await supabaseAdmin.from('departments').update({ name, description, head_officer, email, phone, active, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /api/admin/departments/:id
export async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    await supabaseAdmin.from('departments').delete().eq('id', id);
    return res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/ai/insights
export async function getAiInsights(req, res) {
  try {
    const { data: complaints } = await supabaseAdmin
      .from('complaints')
      .select('id, category, priority, status, location_address, is_duplicate, created_at');

    const { data: analyses } = await supabaseAdmin
      .from('ai_analysis')
      .select('analysis_status, priority, ai_category, scoring_breakdown, factors')
      .eq('analysis_status', 'completed');

    const all = complaints || [];

    // Category breakdown
    const categoryBreakdown = all.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {});
    const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

    // Weekly trend comparison
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const recentWeekCount = all.filter(c => new Date(c.created_at) >= oneWeekAgo).length;
    const previousWeekCount = all.filter(c => new Date(c.created_at) >= twoWeeksAgo && new Date(c.created_at) < oneWeekAgo).length;

    // Per-category stats for detailed view
    const categoryStats = Object.keys(categoryBreakdown).map(cat => ({
      category: cat,
      total: categoryBreakdown[cat],
      critical: all.filter(c => c.category === cat && c.priority === 'Critical').length,
      high:     all.filter(c => c.category === cat && c.priority === 'High').length,
      unresolved: all.filter(c => c.category === cat && c.status !== 'Resolved').length,
      resolved:   all.filter(c => c.category === cat && c.status === 'Resolved').length
    })).sort((a, b) => b.unresolved - a.unresolved);

    // Average scoring factors from analyzed complaints
    const scoringFactors = {
      avg_safety:   0, avg_urgency: 0,
      avg_impact:   0, avg_severity: 0,
      sample_count: 0
    };
    for (const a of (analyses || [])) {
      if (a.scoring_breakdown) {
        const sb = a.scoring_breakdown;
        scoringFactors.avg_safety   += (sb.safety_risk_score  || 0);
        scoringFactors.avg_urgency  += (sb.urgency_score       || 0);
        scoringFactors.avg_impact   += (sb.public_impact_score || 0);
        scoringFactors.avg_severity += (sb.severity_score      || 0);
        scoringFactors.sample_count++;
      }
    }
    if (scoringFactors.sample_count > 0) {
      const n = scoringFactors.sample_count;
      scoringFactors.avg_safety   = Math.round(scoringFactors.avg_safety   / n * 10) / 10;
      scoringFactors.avg_urgency  = Math.round(scoringFactors.avg_urgency  / n * 10) / 10;
      scoringFactors.avg_impact   = Math.round(scoringFactors.avg_impact   / n * 10) / 10;
      scoringFactors.avg_severity = Math.round(scoringFactors.avg_severity / n * 10) / 10;
    }

    const stats = {
      total: all.length,
      analyzed: analyses?.length || 0,
      duplicates: all.filter(c => c.is_duplicate).length,
      critical: all.filter(c => c.priority === 'Critical').length,
      high: all.filter(c => c.priority === 'High').length,
      topCategory: topCategory?.[0] || 'N/A',
      topCategoryCount: topCategory?.[1] || 0,
      pending: all.filter(c => c.status === 'Submitted').length,
      inProgress: all.filter(c => c.status === 'In Progress').length,
      resolved: all.filter(c => c.status === 'Resolved').length,
      resolutionRate: all.length > 0 ? Math.round(all.filter(c => c.status === 'Resolved').length / all.length * 100) : 0,
      recentWeekCount,
      previousWeekCount,
      categoryBreakdown,
      categoryStats,
      scoringFactors,
      hotspotAreas: [...new Set(
        all.filter(c => c.priority === 'Critical')
           .map(c => c.location_address.split(',').slice(1, 3).map(s => s.trim()).filter(Boolean).join(', '))
           .filter(Boolean)
      )].slice(0, 5)
    };

    // Run both Gemini calls in parallel to halve response time
    const unresolvedCats = categoryStats.filter(c => c.unresolved > 0);
    const trend = recentWeekCount > previousWeekCount ? 'increasing' : recentWeekCount < previousWeekCount ? 'decreasing' : 'stable';
    const fallbackBrief = `The system is currently tracking ${stats.total} complaints with a ${stats.resolutionRate}% resolution rate. Complaint volume is ${trend} with ${recentWeekCount} new reports this week. ${stats.critical} critical issues require immediate attention.\n\nThe most reported category is ${stats.topCategory} with ${stats.topCategoryCount} complaints. ${stats.duplicates} duplicate reports detected, indicating repeat problems in specific areas.\n\nRecommended actions: Prioritise the ${stats.critical} critical complaints immediately. Review ${stats.topCategory} complaints for systematic solutions. Use the hotspot map to identify geographic clusters requiring concentrated department response.`;

    const [briefResult, catResult] = await Promise.allSettled([
      generateInsightsBrief(stats),
      unresolvedCats.length > 0 ? analyzeCategoryPatterns(unresolvedCats) : Promise.resolve([])
    ]);

    const actionBrief = briefResult.status === 'fulfilled' ? briefResult.value : fallbackBrief;
    const categoryRecommendations = catResult.status === 'fulfilled' ? (catResult.value || []) : [];

    return res.json({ success: true, stats, actionBrief, categoryRecommendations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/ai/hotspots
export async function getHotspots(req, res) {
  try {
    const { category, priority, status, date_from, date_to } = req.query;

    let query = supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, title, category, priority, status, latitude, longitude, location_address, created_at')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);
    if (status) query = query.eq('status', status);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data, error } = await query;
    if (error) throw error;

    const { data: allComplaints } = await supabaseAdmin
      .from('complaints')
      .select('id, complaint_number, title, category, priority, status, latitude, longitude, location_address')
      .not('latitude', 'is', null);

    const clusters = clusterComplaints(allComplaints || [], 0.8, 2);

    return res.json({
      success: true,
      complaints: data || [],
      clusters
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/notifications
export async function getAdminNotifications(req, res) {
  try {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/notifications/unread-count
export async function getUnreadNotificationCount(req, res) {
  try {
    const { count } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
    return res.json({ success: true, count: count || 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/notifications/:id/read
export async function markNotificationRead(req, res) {
  try {
    await supabaseAdmin.from('notifications').update({ read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/notifications/read-all
export async function markAllNotificationsRead(req, res) {
  try {
    await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
