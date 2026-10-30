import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// PRIORITY SCORING SYSTEM
// ============================================================

const PRIORITY_BANDS = {
  Critical: { min: 80, max: 100, label: 'Immediate threat to life or safety' },
  High:     { min: 60, max: 79,  label: 'Significant safety or service risk' },
  Medium:   { min: 30, max: 59,  label: 'Moderate inconvenience or growing risk' },
  Low:      { min: 0,  max: 29,  label: 'Minor issue, preventive maintenance' }
};

// Category → department mapping used as fallback
const DEPT_MAP = {
  'Road Damage':        'Road Maintenance',
  'Waterlogging':       'Drainage',
  'Garbage Overflow':   'Sanitation',
  'Streetlight Failure':'Electricity',
  'Drainage Problem':   'Drainage',
  'Water Supply':       'Water Supply',
  'Other':              'Public Safety'
};

// ============================================================
// TEXT SIMILARITY — weighted trigram + word overlap
// ============================================================

function trigramSet(str) {
  const s = str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const tg = new Set();
  for (let i = 0; i < s.length - 2; i++) tg.add(s.slice(i, i + 3));
  return tg;
}

function wordOverlap(a, b) {
  const stopwords = new Set(['the', 'a', 'an', 'is', 'in', 'on', 'at', 'to', 'of', 'and', 'or', 'for', 'with', 'there', 'has', 'are', 'been', 'it']);
  const words = (s) => new Set(s.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w)));
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  const intersection = [...wa].filter(w => wb.has(w)).length;
  return intersection / Math.max(wa.size, wb.size);
}

function textSimilarity(a, b) {
  const tgA = trigramSet(a);
  const tgB = trigramSet(b);
  const intersection = [...tgA].filter(x => tgB.has(x)).length;
  const union = new Set([...tgA, ...tgB]).size;
  const trigramSim = union === 0 ? 0 : intersection / union;
  const wordSim = wordOverlap(a, b);
  // weighted: 60% trigram, 40% word overlap
  return trigramSim * 0.6 + wordSim * 0.4;
}

// ============================================================
// GEOGRAPHIC UTILITIES
// ============================================================

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// GEMINI COMPLAINT ANALYSIS — explainable priority scoring
// ============================================================

export async function analyzeComplaintWithAI(complaint) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an AI analyst for a civic complaint management platform. Your job is to evaluate citizen complaints and produce a structured, explainable priority assessment.

COMPLAINT DETAILS:
- Title: ${complaint.title}
- Description: ${complaint.description}
- Category: ${complaint.category}
- Location: ${complaint.location_address}

INSTRUCTIONS:
1. Read the complaint carefully before scoring.
2. Score each factor below on a scale of 0–25 (integers only).
3. Sum the four factor scores for total_score (0–100).
4. Assign the priority label based on: Critical=80-100, High=60-79, Medium=30-59, Low=0-29.
5. Write a priority_reason that directly references the complaint content.
6. Only state what can be inferred from the description — do NOT invent specific numbers of affected people.
7. Recommended action must be concrete and department-specific.

SCORING FACTORS (each 0–25):
- safety_risk_score: Is there an immediate risk of injury, accident or health hazard?
  (0=none, 5=low, 15=moderate, 25=severe/immediate)
- urgency_score: How time-sensitive is this? Will it worsen if not addressed soon?
  (0=not urgent, 5=can wait, 15=should address this week, 25=needs same-day response)
- public_impact_score: How many people / how much area is affected?
  (0=single property, 5=few households, 15=major road or public area, 25=entire neighborhood or essential service)
- severity_score: How bad is the damage or failure described?
  (0=minor, 5=cosmetic, 15=functional impairment, 25=complete failure or dangerous state)

Return ONLY valid JSON (no markdown, no text outside the JSON):
{
  "category": "<one of: Road Damage, Waterlogging, Garbage Overflow, Streetlight Failure, Drainage Problem, Water Supply, Other>",
  "summary": "<1-2 sentence factual summary of the specific problem>",
  "priority": "<Critical|High|Medium|Low>",
  "priority_score": <integer, sum of four factor scores>,
  "priority_reason": "<Specific explanation referencing the complaint. Cite the exact safety risk or urgency factor. Do NOT guess at numbers of affected people.>",
  "suggested_department": "<one of: Road Maintenance, Water Supply, Sanitation, Electricity, Drainage, Public Safety>",
  "recommended_action": "<Specific actionable steps for the assigned department>",
  "severity": "<Critical|High|Medium|Low>",
  "scoring_breakdown": {
    "safety_risk_score": <0-25>,
    "safety_risk_reason": "<one sentence>",
    "urgency_score": <0-25>,
    "urgency_reason": "<one sentence>",
    "public_impact_score": <0-25>,
    "public_impact_reason": "<one sentence>",
    "severity_score": <0-25>,
    "severity_reason": "<one sentence>"
  },
  "factors": {
    "safety_risk": "<none identified | low | moderate | high | critical>",
    "urgency": "<low | medium | high | immediate>",
    "public_impact": "<brief description of who/what is affected>",
    "estimated_resolution_days": <integer, realistic estimate>
  }
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = responseText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON: ${cleaned.slice(0, 300)}`);
  }

  // Validate required fields
  const required = ['category', 'summary', 'priority', 'priority_score', 'priority_reason',
                    'suggested_department', 'recommended_action', 'scoring_breakdown'];
  for (const field of required) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  // Validate category
  const validCategories = ['Road Damage','Waterlogging','Garbage Overflow','Streetlight Failure','Drainage Problem','Water Supply','Other'];
  if (!validCategories.includes(parsed.category)) {
    parsed.category = complaint.category; // fall back to what citizen selected
  }

  // Validate department — fall back to category mapping
  const validDepts = ['Road Maintenance','Water Supply','Sanitation','Electricity','Drainage','Public Safety'];
  if (!validDepts.includes(parsed.suggested_department)) {
    parsed.suggested_department = DEPT_MAP[parsed.category] || 'Public Safety';
  }

  // Validate and clamp priority score
  const sb = parsed.scoring_breakdown;
  if (sb) {
    const computedScore =
      (parseInt(sb.safety_risk_score) || 0) +
      (parseInt(sb.urgency_score) || 0) +
      (parseInt(sb.public_impact_score) || 0) +
      (parseInt(sb.severity_score) || 0);
    // Use AI's own computed score but clamp each factor to 0–25
    sb.safety_risk_score   = Math.min(25, Math.max(0, parseInt(sb.safety_risk_score) || 0));
    sb.urgency_score       = Math.min(25, Math.max(0, parseInt(sb.urgency_score) || 0));
    sb.public_impact_score = Math.min(25, Math.max(0, parseInt(sb.public_impact_score) || 0));
    sb.severity_score      = Math.min(25, Math.max(0, parseInt(sb.severity_score) || 0));
    parsed.priority_score  = sb.safety_risk_score + sb.urgency_score + sb.public_impact_score + sb.severity_score;
  }

  // Clamp score to priority band
  const band = PRIORITY_BANDS[parsed.priority];
  if (band) {
    parsed.priority_score = Math.min(band.max, Math.max(band.min, parsed.priority_score));
  } else {
    // Derive priority from score if label was invalid
    if (parsed.priority_score >= 80) parsed.priority = 'Critical';
    else if (parsed.priority_score >= 60) parsed.priority = 'High';
    else if (parsed.priority_score >= 30) parsed.priority = 'Medium';
    else parsed.priority = 'Low';
  }

  return parsed;
}

// ============================================================
// DUPLICATE DETECTION — trigram + word + category + geo
// ============================================================

export async function detectDuplicates(newComplaint, existingComplaints) {
  // Combined score threshold — complaints scoring above this are flagged
  const COMBINED_THRESHOLD = 0.42;
  // Geographic radius for proximity bonus (km)
  const GEO_RADIUS_KM = 2.0;

  const candidates = [];
  const newText = `${newComplaint.title} ${newComplaint.description}`;

  for (const existing of existingComplaints) {
    if (existing.id === newComplaint.id) continue;

    const existingText = `${existing.title} ${existing.description}`;

    // 1. Text similarity (trigram + word overlap) — weight 0.50
    const textSim = textSimilarity(newText, existingText);

    // 2. Category match bonus — weight 0.15
    const categoryBonus = newComplaint.category === existing.category ? 0.15 : 0;

    // 3. Geographic proximity — weight 0.35
    let geoScore = 0;
    let distanceKm = null;
    if (
      newComplaint.latitude && newComplaint.longitude &&
      existing.latitude   && existing.longitude
    ) {
      distanceKm = haversineKm(
        parseFloat(newComplaint.latitude),  parseFloat(newComplaint.longitude),
        parseFloat(existing.latitude),       parseFloat(existing.longitude)
      );
      // Linear decay: 0 km → 1.0, GEO_RADIUS_KM → 0.0
      geoScore = Math.max(0, 1 - distanceKm / GEO_RADIUS_KM);
    } else {
      // No coordinates: fall back to address string similarity
      geoScore = textSimilarity(
        newComplaint.location_address || '',
        existing.location_address    || ''
      ) * 0.6;
    }

    const combinedScore = textSim * 0.50 + geoScore * 0.35 + categoryBonus;

    if (combinedScore >= COMBINED_THRESHOLD) {
      candidates.push({
        complaint_id:      existing.id,
        complaint_number:  existing.complaint_number,
        title:             existing.title,
        location:          existing.location_address,
        status:            existing.status,
        category:          existing.category,
        similarity_score:  Math.round(combinedScore * 100),
        text_similarity:   Math.round(textSim * 100),
        geo_proximity_km:  distanceKm !== null ? Math.round(distanceKm * 100) / 100 : null,
        match_reasons:     buildMatchReasons(textSim, geoScore, categoryBonus, distanceKm)
      });
    }
  }

  // Return top 5 by combined score
  return candidates
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 5);
}

function buildMatchReasons(textSim, geoScore, categoryBonus, distKm) {
  const reasons = [];
  if (textSim > 0.40) reasons.push(`High text similarity (${Math.round(textSim * 100)}%)`);
  else if (textSim > 0.20) reasons.push(`Partial text match (${Math.round(textSim * 100)}%)`);
  if (geoScore > 0.60 && distKm !== null) reasons.push(`Very close proximity (${Math.round(distKm * 100) / 100} km away)`);
  else if (geoScore > 0.30 && distKm !== null) reasons.push(`Nearby location (${Math.round(distKm * 100) / 100} km away)`);
  if (categoryBonus > 0) reasons.push('Same complaint category');
  return reasons.length > 0 ? reasons : ['Pattern similarity detected'];
}

// ============================================================
// HOTSPOT CLUSTERING — DBSCAN with AI-generated action brief
// ============================================================

export function clusterComplaints(complaints, epsilon = 0.8, minPoints = 2) {
  const valid = complaints.filter(c => c.latitude && c.longitude);
  const visited = new Set();
  const clusterPoints = [];

  function getNeighbors(point) {
    return valid.filter(p => {
      if (p.id === point.id) return false;
      return haversineKm(
        parseFloat(point.latitude), parseFloat(point.longitude),
        parseFloat(p.latitude),     parseFloat(p.longitude)
      ) <= epsilon;
    });
  }

  for (const complaint of valid) {
    if (visited.has(complaint.id)) continue;
    visited.add(complaint.id);

    const neighbors = getNeighbors(complaint);
    if (neighbors.length < minPoints - 1) continue; // noise

    const memberIds = new Set([complaint.id]);
    const members   = [complaint];
    const queue     = [...neighbors];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!visited.has(current.id)) {
        visited.add(current.id);
        const cn = getNeighbors(current);
        if (cn.length >= minPoints - 1) {
          queue.push(...cn.filter(n => !memberIds.has(n.id)));
        }
      }
      if (!memberIds.has(current.id)) {
        memberIds.add(current.id);
        members.push(current);
      }
    }

    clusterPoints.push(members);
  }

  return clusterPoints.map(points => summariseCluster(points));
}

function summariseCluster(points) {
  const avgLat = points.reduce((s, p) => s + parseFloat(p.latitude),  0) / points.length;
  const avgLon = points.reduce((s, p) => s + parseFloat(p.longitude), 0) / points.length;

  // Category frequency
  const categories = points.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';

  // Highest priority in the cluster
  const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];
  const topPriority = PRIORITY_ORDER.find(p => points.some(c => c.priority === p)) || 'Low';

  // Unresolved count
  const unresolved = points.filter(p => p.status !== 'Resolved').length;

  // Generate a deterministic suggested action (no Gemini call — keeps hotspot map fast)
  const action = generateClusterAction(topCategory, topPriority, points.length, unresolved);

  return {
    center:          { lat: avgLat, lng: avgLon },
    count:           points.length,
    unresolved,
    top_priority:    topPriority,
    top_category:    topCategory,
    categories,
    suggested_action: action,
    complaints:      points.map(p => ({
      id:               p.id,
      complaint_number: p.complaint_number,
      title:            p.title,
      status:           p.status,
      priority:         p.priority,
      category:         p.category
    }))
  };
}

function generateClusterAction(category, priority, total, unresolved) {
  const urgencyPrefix = priority === 'Critical'
    ? '🚨 URGENT: '
    : priority === 'High'
    ? '⚠️ Priority action: '
    : '';

  const actions = {
    'Road Damage':         `${urgencyPrefix}Dispatch Road Maintenance team for site inspection. Deploy temporary barricades if road is impassable. Schedule repair crew within ${priority === 'Critical' ? '24 hours' : priority === 'High' ? '3 days' : '1 week'}.`,
    'Waterlogging':        `${urgencyPrefix}Inspect drainage capacity in this zone. Clear blocked storm drains. Coordinate with Drainage Department to assess long-term flood mitigation.`,
    'Garbage Overflow':    `${urgencyPrefix}Deploy Sanitation crew for immediate clearance. Review collection schedule frequency for this area. Consider installing additional waste bins.`,
    'Streetlight Failure': `${urgencyPrefix}Electricity Department should audit streetlight circuit in this zone. Replace faulty units within ${priority === 'Critical' ? '24 hours' : '48 hours'} to restore nighttime safety.`,
    'Drainage Problem':    `${urgencyPrefix}Drainage Department to inspect and clear blocked drains. Assess root cause (sediment, structural damage). Schedule follow-up within 7 days.`,
    'Water Supply':        `${urgencyPrefix}Water Supply Department to investigate pipe/network fault. Notify affected residents. Restore supply within ${priority === 'Critical' ? '6 hours' : '24 hours'}.`,
    'Other':               `${urgencyPrefix}Public Safety team to assess and route to appropriate department. ${total} reports require coordinated response.`
  };

  const base = actions[category] || actions['Other'];
  return `${base} (${unresolved} of ${total} complaints in this hotspot are unresolved.)`;
}

// ============================================================
// AI INSIGHTS BRIEF — Gemini-generated action brief from real data
// ============================================================

export async function generateInsightsBrief(stats) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Build per-category recommendation hints for the prompt
  const catLines = Object.entries(stats.categoryBreakdown || {})
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `  • ${cat}: ${count} reports`)
    .join('\n');

  const recentTrend = stats.recentWeekCount > (stats.previousWeekCount || 0)
    ? `Complaints are increasing: ${stats.recentWeekCount} in the last 7 days vs ${stats.previousWeekCount || 0} the week before.`
    : stats.recentWeekCount < (stats.previousWeekCount || 0)
    ? `Complaints are decreasing: ${stats.recentWeekCount} in the last 7 days vs ${stats.previousWeekCount || 0} the week before.`
    : `Complaint volume is stable (approximately ${stats.recentWeekCount} per week).`;

  const prompt = `You are an AI analyst for a city administration complaint management system. Based on the following real complaint data, write a professional and actionable administrative brief.

CURRENT COMPLAINT DATA:
- Total complaints in system: ${stats.total}
- AI-analyzed: ${stats.analyzed}
- Critical complaints (require immediate action): ${stats.critical}
- High-priority complaints: ${stats.high || 0}
- Pending / unresolved: ${stats.pending + (stats.inProgress || 0)}
- Duplicate complaints detected: ${stats.duplicates}
- Resolution rate: ${stats.resolutionRate || 0}%
- Trend: ${recentTrend}

CATEGORY BREAKDOWN:
${catLines}

HIGH-IMPACT AREAS (from critical complaint locations):
${stats.hotspotAreas?.length ? stats.hotspotAreas.map(a => `  • ${a}`).join('\n') : '  • Data insufficient to identify specific areas'}

INSTRUCTIONS:
- Write 3 concise paragraphs (plain text, no markdown, no bullet points in the output).
- Paragraph 1: Summarise the current situation using the real numbers above.
- Paragraph 2: Identify the top 2-3 most urgent issues with specific reasoning.
- Paragraph 3: Give concrete, department-specific administrative recommendations.
- Do NOT invent statistics beyond what is provided.
- Do NOT mention specific street names or locations unless provided.
- Be direct and professional — this is read by city administrators.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ============================================================
// CATEGORY-LEVEL PATTERN ANALYSIS — for AI Insights page
// ============================================================

export async function analyzeCategoryPatterns(categoryData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const catSummary = categoryData
    .map(c => `${c.category}: ${c.total} total, ${c.unresolved} unresolved, ${c.critical} critical`)
    .join('\n');

  const prompt = `Based on this civic complaint category data, provide a brief analysis and ONE specific recommended action per category (only include categories with unresolved complaints).

DATA:
${catSummary}

Return ONLY a JSON array (no markdown):
[
  {
    "category": "<category name>",
    "pattern": "<1 sentence describing the pattern>",
    "recommended_action": "<specific actionable recommendation for city administration>",
    "urgency": "<low|medium|high|critical>"
  }
]

Only include categories that have unresolved complaints. Be specific and actionable.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}
