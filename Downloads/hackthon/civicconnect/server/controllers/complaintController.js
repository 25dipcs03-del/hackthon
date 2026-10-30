import { supabaseAdmin } from '../config/supabase.js';
import { analyzeComplaintWithAI, detectDuplicates } from '../services/aiService.js';

// POST /api/complaints - Submit new complaint
export async function submitComplaint(req, res) {
  try {
    const { title, description, category, location_address, latitude, longitude } = req.body;
    const citizenId = req.user.id;

    // Save complaint first (AI is asynchronous)
    const { data: complaint, error: insertError } = await supabaseAdmin
      .from('complaints')
      .insert({
        title,
        description,
        category,
        location_address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        citizen_id: citizenId,
        status: 'Submitted',
        priority: 'Medium',
        priority_score: 50
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Save initial status history
    await supabaseAdmin.from('status_history').insert({
      complaint_id: complaint.id,
      old_status: null,
      new_status: 'Submitted',
      remarks: 'Complaint submitted by citizen'
    });

    // Create notification for admin
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (admins?.length) {
      await supabaseAdmin.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          title: 'New Complaint Submitted',
          message: `New ${category} complaint: ${title}`,
          type: 'info',
          complaint_id: complaint.id
        }))
      );
    }

    // Handle image upload if present
    if (req.file) {
      try {
        const fileName = `${complaint.id}/${Date.now()}-${req.file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('complaint-images')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('complaint-images')
            .getPublicUrl(fileName);

          await supabaseAdmin.from('complaint_images').insert({
            complaint_id: complaint.id,
            image_url: publicUrl,
            storage_path: fileName
          });
        }
      } catch (imgErr) {
        console.error('Image upload error (non-fatal):', imgErr.message);
      }
    }

    // Run AI analysis async (don't block response)
    setImmediate(async () => {
      try {
        // Create pending analysis record
        await supabaseAdmin.from('ai_analysis').insert({
          complaint_id: complaint.id,
          analysis_status: 'pending'
        }).onConflict('complaint_id').merge();

        const aiResult = await analyzeComplaintWithAI(complaint);

        // Fetch existing complaints for duplicate detection
        const { data: existing } = await supabaseAdmin
          .from('complaints')
          .select('id, complaint_number, title, description, category, location_address, latitude, longitude, status')
          .neq('id', complaint.id)
          .limit(100);

        const duplicates = await detectDuplicates(complaint, existing || []);

        // Update AI analysis — include scoring_breakdown and factors
        await supabaseAdmin.from('ai_analysis')
          .upsert({
            complaint_id: complaint.id,
            ai_category: aiResult.category,
            ai_summary: aiResult.summary,
            priority: aiResult.priority,
            priority_score: aiResult.priority_score,
            priority_reason: aiResult.priority_reason,
            suggested_department: aiResult.suggested_department,
            recommended_action: aiResult.recommended_action,
            severity: aiResult.severity,
            scoring_breakdown: aiResult.scoring_breakdown || null,
            factors: aiResult.factors || null,
            duplicate_candidates: duplicates,
            raw_response: aiResult,
            analysis_status: 'completed',
            updated_at: new Date().toISOString()
          }, { onConflict: 'complaint_id' });

        // Update complaint priority from AI
        await supabaseAdmin.from('complaints').update({
          priority: aiResult.priority,
          priority_score: aiResult.priority_score,
          is_duplicate: duplicates.length > 0,
          updated_at: new Date().toISOString()
        }).eq('id', complaint.id);

        // Save duplicate links
        for (const dup of duplicates) {
          await supabaseAdmin.from('duplicate_links').insert({
            original_complaint_id: dup.complaint_id,
            duplicate_complaint_id: complaint.id,
            similarity_score: dup.similarity_score
          }).onConflict().ignore();
        }

        // Notify admin about critical complaints
        if (aiResult.priority === 'Critical') {
          const { data: adminList } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
          if (adminList?.length) {
            await supabaseAdmin.from('notifications').insert(
              adminList.map(a => ({
                user_id: a.id,
                title: '🚨 Critical Complaint Detected',
                message: `${title} — ${aiResult.priority_reason}`,
                type: 'critical',
                complaint_id: complaint.id
              }))
            );
          }
        }
      } catch (aiErr) {
        console.error('AI analysis failed:', aiErr.message);
        await supabaseAdmin.from('ai_analysis')
          .upsert({ complaint_id: complaint.id, analysis_status: 'failed' }, { onConflict: 'complaint_id' });
      }
    });

    return res.status(201).json({
      success: true,
      complaint_id: complaint.id,
      complaint_number: complaint.complaint_number,
      message: 'Complaint submitted successfully. AI analysis is processing.',
      ai_status: 'processing'
    });
  } catch (err) {
    console.error('Submit complaint error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit complaint' });
  }
}

// GET /api/complaints/:id - Get single complaint (citizen or admin)
export async function getComplaint(req, res) {
  try {
    const { id } = req.params;
    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        complaint_images (*),
        ai_analysis (*),
        departments (name, email),
        status_history (*, profiles(full_name)),
        assignments (*, departments(name))
      `)
      .eq('id', id)
      .single();

    if (error || !complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Citizens can only view their own complaints
    if (req.profile?.role !== 'admin' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch duplicate links
    const { data: duplicateLinks } = await supabaseAdmin
      .from('duplicate_links')
      .select('*, original:original_complaint_id(complaint_number, title, status), duplicate:duplicate_complaint_id(complaint_number, title, status)')
      .or(`original_complaint_id.eq.${id},duplicate_complaint_id.eq.${id}`);

    return res.json({ success: true, data: { ...complaint, duplicate_links: duplicateLinks || [] } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/complaints/track/:number  — public, no auth required (limited fields)
export async function trackComplaintByNumber(req, res) {
  try {
    const { number } = req.params;
    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        id, complaint_number, title, description, category,
        location_address, status, priority, priority_score,
        admin_remarks, resolution_details, created_at, updated_at,
        departments(name),
        ai_analysis(ai_summary, priority, priority_reason, suggested_department, recommended_action, analysis_status),
        status_history(new_status, old_status, remarks, created_at),
        assignments(assigned_officer, departments(name))
      `)
      .eq('complaint_number', number.toUpperCase())
      .single();

    if (error || !complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Return limited public data — no citizen personal info
    return res.json({ success: true, data: complaint });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/citizen/complaints
export async function getCitizenComplaints(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select('*, ai_analysis(priority, ai_summary, analysis_status), complaint_images(image_url)')
      .eq('citizen_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/citizen/dashboard
export async function getCitizenDashboard(req, res) {
  try {
    const { data: complaints } = await supabaseAdmin
      .from('complaints')
      .select('id, status, priority, category, created_at, title, complaint_number, location_address')
      .eq('citizen_id', req.user.id)
      .order('created_at', { ascending: false });

    const all = complaints || [];
    const stats = {
      total: all.length,
      submitted: all.filter(c => c.status === 'Submitted').length,
      inProgress: all.filter(c => ['Under Review', 'Assigned', 'In Progress'].includes(c.status)).length,
      resolved: all.filter(c => c.status === 'Resolved').length
    };

    return res.json({ success: true, stats, recent: all.slice(0, 10) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
