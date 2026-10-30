-- CivicConnect Seed Data (Demonstration Data - Not Real)
-- Run AFTER schema.sql in Supabase SQL Editor
-- NOTE: All data below is synthetic and fictional for demonstration purposes only.
-- No real personal information is used.

-- ============================================================
-- INSERT DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, name, description, head_officer, email, phone) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Road Maintenance', 'Handles road repair, pothole filling and pavement work', 'Mr. Rajesh Kumar', 'roads@civicconnect.demo', '+91-9000000001'),
  ('d1000000-0000-0000-0000-000000000002', 'Water Supply', 'Manages water pipelines, supply and leakage issues', 'Ms. Priya Nair', 'water@civicconnect.demo', '+91-9000000002'),
  ('d1000000-0000-0000-0000-000000000003', 'Sanitation', 'Garbage collection, bin management and waste disposal', 'Mr. Arvind Singh', 'sanitation@civicconnect.demo', '+91-9000000003'),
  ('d1000000-0000-0000-0000-000000000004', 'Electricity', 'Streetlight maintenance and electrical infrastructure', 'Ms. Deepa Menon', 'electricity@civicconnect.demo', '+91-9000000004'),
  ('d1000000-0000-0000-0000-000000000005', 'Drainage', 'Storm drain management, waterlogging prevention', 'Mr. Suresh Pillai', 'drainage@civicconnect.demo', '+91-9000000005'),
  ('d1000000-0000-0000-0000-000000000006', 'Public Safety', 'Traffic signals, public safety infrastructure', 'Ms. Kavitha Rao', 'safety@civicconnect.demo', '+91-9000000006')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- INSERT SYNTHETIC COMPLAINTS (40 records - demonstration data)
-- ============================================================
-- NOTE: Citizen IDs are placeholder UUIDs. In production these link to real auth.users.
-- For demo seeding, we insert without citizen_id or use a demo admin UUID.

INSERT INTO complaints (id, complaint_number, title, description, category, location_address, latitude, longitude, status, priority, priority_score, department_id, admin_remarks, is_duplicate) VALUES

-- ROAD DAMAGE (10 complaints)
('c1000000-0000-0000-0000-000000000001', 'CC-2024-01001', 'Large Pothole on MG Road Near Bus Stop', 'There is a very large pothole near the main bus stop on MG Road. Multiple vehicles have been damaged. The pothole is about 2 feet wide and 8 inches deep. It is a serious safety hazard especially at night.', 'Road Damage', 'MG Road, Near Bus Stop, Bengaluru', 12.9716, 77.5946, 'In Progress', 'Critical', 92, 'd1000000-0000-0000-0000-000000000001', 'Team dispatched for inspection', false),
('c1000000-0000-0000-0000-000000000002', 'CC-2024-01002', 'Road Cracking on Anna Salai', 'The road surface on Anna Salai is showing significant cracking and deterioration. Several cracks have formed along the main lane affecting heavy traffic flow.', 'Road Damage', 'Anna Salai, Chennai', 13.0827, 80.2707, 'Under Review', 'High', 74, 'd1000000-0000-0000-0000-000000000001', NULL, false),
('c1000000-0000-0000-0000-000000000003', 'CC-2024-01003', 'Damaged Footpath on FC Road', 'The footpath tiles on FC Road are broken and uneven. Pedestrians especially elderly people are at risk of tripping and falling. Several tiles have completely dislodged.', 'Road Damage', 'FC Road, Pune', 18.5204, 73.8567, 'Submitted', 'Medium', 55, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000004', 'CC-2024-01004', 'Pothole on Park Street Causing Accidents', 'Deep pothole on Park Street has already caused two minor accidents this week. Emergency repair needed before more accidents occur.', 'Road Damage', 'Park Street, Kolkata', 22.5726, 88.3639, 'Assigned', 'Critical', 88, 'd1000000-0000-0000-0000-000000000001', 'Marked urgent by admin', false),
('c1000000-0000-0000-0000-000000000005', 'CC-2024-01005', 'Road Cave-in at Linking Road', 'A section of Linking Road has caved in slightly near the junction. Possibly due to underground pipe failure. Requires immediate attention.', 'Road Damage', 'Linking Road, Mumbai', 19.0760, 72.8777, 'Resolved', 'High', 70, 'd1000000-0000-0000-0000-000000000001', 'Repaired and resurfaced', false),
('c1000000-0000-0000-0000-000000000006', 'CC-2024-01006', 'Speed Breaker Broken on Residency Road', 'The speed breaker on Residency Road has broken apart and now poses a danger to motorcycles. Sharp metal edges are protruding.', 'Road Damage', 'Residency Road, Bengaluru', 12.9781, 77.5966, 'In Progress', 'High', 72, 'd1000000-0000-0000-0000-000000000001', NULL, false),
('c1000000-0000-0000-0000-000000000007', 'CC-2024-01007', 'Road Damage Near School Zone', 'The road near Government Primary School is heavily damaged with multiple potholes. School children are at risk as no safe walking path remains.', 'Road Damage', 'School Zone, Anna Nagar, Chennai', 13.0859, 80.2104, 'Under Review', 'Critical', 90, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000008', 'CC-2024-01008', 'Minor Pothole on Hill Road', 'Small pothole on Hill Road. Not urgent but needs filling before it grows larger.', 'Road Damage', 'Hill Road, Bandra, Mumbai', 19.0596, 72.8295, 'Resolved', 'Low', 25, 'd1000000-0000-0000-0000-000000000001', 'Filled with asphalt', false),
('c1000000-0000-0000-0000-000000000009', 'CC-2024-01009', 'Road Erosion After Heavy Rain', 'Heavy monsoon rain has caused significant road erosion on the outskirts near Lake View Road. The road base is exposed.', 'Road Damage', 'Lake View Road, Hyderabad', 17.3850, 78.4867, 'In Progress', 'High', 75, 'd1000000-0000-0000-0000-000000000001', NULL, false),
('c1000000-0000-0000-0000-000000000010', 'CC-2024-01010', 'Pothole on MG Road - Similar to CC-2024-01001', 'Another pothole complaint near MG Road bus stop area. Large hole causing vehicle damage similar to previously reported issue.', 'Road Damage', 'MG Road, Bus Stop Area, Bengaluru', 12.9718, 77.5948, 'Submitted', 'High', 70, NULL, NULL, true),

-- WATERLOGGING (8 complaints)
('c1000000-0000-0000-0000-000000000011', 'CC-2024-01011', 'Severe Waterlogging at Silk Board Junction', 'The Silk Board junction gets severely waterlogged during every rain event. Water levels reach above tire height for cars. Traffic comes to a complete standstill for hours.', 'Waterlogging', 'Silk Board Junction, Bengaluru', 12.9177, 77.6228, 'In Progress', 'Critical', 95, 'd1000000-0000-0000-0000-000000000005', 'Drainage inspection scheduled', false),
('c1000000-0000-0000-0000-000000000012', 'CC-2024-01012', 'Waterlogging in Residential Colony', 'The entire residential colony floods within 30 minutes of moderate rain. Homes have water entering ground floors. Children cannot go to school.', 'Waterlogging', 'Indiranagar Colony, Bengaluru', 12.9784, 77.6408, 'Under Review', 'High', 80, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000013', 'CC-2024-01013', 'Waterlogging at Market Area', 'The weekly market area floods after rain causing damage to goods and making the area inaccessible to elderly and disabled people.', 'Waterlogging', 'City Market, Bengaluru', 12.9630, 77.5764, 'Submitted', 'Medium', 60, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000014', 'CC-2024-01014', 'Waterlogging Silk Board - Duplicate Report', 'Water accumulation at Silk Board area during rain. Road becomes completely impassable. Same issue as previously reported.', 'Waterlogging', 'Silk Board, Bengaluru', 12.9179, 77.6230, 'Submitted', 'Critical', 90, NULL, NULL, true),
('c1000000-0000-0000-0000-000000000015', 'CC-2024-01015', 'Standing Water on T Nagar Road', 'After rain water stands on T Nagar main road for over 48 hours. Breeding ground for mosquitoes. Health risk increasing.', 'Waterlogging', 'T Nagar, Chennai', 13.0418, 80.2341, 'Assigned', 'High', 76, 'd1000000-0000-0000-0000-000000000005', NULL, false),
('c1000000-0000-0000-0000-000000000016', 'CC-2024-01016', 'Flooding Near Hospital', 'The road leading to City Hospital floods during rain making ambulance access difficult. This is a life-threatening situation.', 'Waterlogging', 'Hospital Road, Hyderabad', 17.3995, 78.4700, 'In Progress', 'Critical', 98, 'd1000000-0000-0000-0000-000000000005', 'Emergency team deployed', false),
('c1000000-0000-0000-0000-000000000017', 'CC-2024-01017', 'Water Pooling in Parking Area', 'The public parking area near the bus terminal accumulates water after rain. Minor inconvenience but needs addressing.', 'Waterlogging', 'Bus Terminal Parking, Pune', 18.5293, 73.8781, 'Resolved', 'Low', 22, 'd1000000-0000-0000-0000-000000000005', 'Drain cleared', false),
('c1000000-0000-0000-0000-000000000018', 'CC-2024-01018', 'Waterlogging at Underpass', 'The railway underpass on Station Road floods completely after rain making it impassable. Vehicles get stuck regularly.', 'Waterlogging', 'Station Road Underpass, Mumbai', 19.0880, 72.8780, 'Under Review', 'High', 82, NULL, NULL, false),

-- GARBAGE (7 complaints)
('c1000000-0000-0000-0000-000000000019', 'CC-2024-01019', 'Overflowing Garbage Bins at Gandhi Nagar', 'The garbage bins at Gandhi Nagar market have been overflowing for 5 consecutive days. Garbage is spilling onto the road. Strong odor and health hazard.', 'Garbage Overflow', 'Gandhi Nagar Market, Delhi', 28.6692, 77.4538, 'In Progress', 'High', 78, 'd1000000-0000-0000-0000-000000000003', NULL, false),
('c1000000-0000-0000-0000-000000000020', 'CC-2024-01020', 'Illegal Dumping Near Lake', 'Someone has been dumping construction waste near the Ulsoor Lake. Environmental hazard and eyesore. Requires immediate cleanup.', 'Garbage Overflow', 'Ulsoor Lake, Bengaluru', 12.9847, 77.6160, 'Under Review', 'High', 72, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000021', 'CC-2024-01021', 'Garbage Pile Behind Bus Shelter', 'Residents have been dumping household waste behind the bus shelter on Nehru Road. No proper waste collection in this area.', 'Garbage Overflow', 'Nehru Road Bus Shelter, Pune', 18.5320, 73.8540, 'Submitted', 'Medium', 50, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000022', 'CC-2024-01022', 'Medical Waste Found on Road', 'Suspected medical waste including syringes and bandages found on the road near the clinic. Extremely dangerous to public.', 'Garbage Overflow', 'Medical Road, Chennai', 13.0600, 80.2500, 'Assigned', 'Critical', 96, 'd1000000-0000-0000-0000-000000000003', 'Health dept alerted', false),
('c1000000-0000-0000-0000-000000000023', 'CC-2024-01023', 'Overflowing Bins at Gandhi Nagar - Similar', 'Garbage overflowing at Gandhi Nagar area again. Bins completely full. Rats seen near garbage area.', 'Garbage Overflow', 'Gandhi Nagar, Delhi', 28.6694, 77.4540, 'Submitted', 'High', 76, NULL, NULL, true),
('c1000000-0000-0000-0000-000000000024', 'CC-2024-01024', 'No Garbage Collection in Week', 'Our area has not had garbage collection for over a week. Bins are overflowing and causing smell.', 'Garbage Overflow', 'Koramangala 5th Block, Bengaluru', 12.9279, 77.6271, 'Resolved', 'Medium', 55, 'd1000000-0000-0000-0000-000000000003', 'Collection schedule restored', false),
('c1000000-0000-0000-0000-000000000025', 'CC-2024-01025', 'Garbage Burning on Road', 'Residents are burning garbage on the road due to lack of collection. Air quality severely affected. Children and asthma patients at risk.', 'Garbage Overflow', 'Outer Ring Road, Bengaluru', 12.9350, 77.6900, 'In Progress', 'High', 80, 'd1000000-0000-0000-0000-000000000003', NULL, false),

-- STREETLIGHT FAILURE (6 complaints)
('c1000000-0000-0000-0000-000000000026', 'CC-2024-01026', 'No Street Lights for 500 Meters', 'The entire stretch of 500 meters on Outer Ring Road has no functional streetlights. Multiple street robberies reported in this dark stretch at night.', 'Streetlight Failure', 'Outer Ring Road, Near Metro, Bengaluru', 12.9390, 77.6920, 'In Progress', 'Critical', 91, 'd1000000-0000-0000-0000-000000000004', 'Electrician team assigned', false),
('c1000000-0000-0000-0000-000000000027', 'CC-2024-01027', 'Streetlight Pole Fallen on Road', 'An old streetlight pole has fallen on the road and is blocking one lane. Live wires may still be connected. Emergency situation.', 'Streetlight Failure', 'Raja Street, Chennai', 13.0700, 80.2600, 'Submitted', 'Critical', 97, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000028', 'CC-2024-01028', 'Flickering Lights in School Zone', 'Streetlights near the school are flickering badly. Children waiting for buses in early morning or late evening are unsafe.', 'Streetlight Failure', 'School Area, Andheri, Mumbai', 19.1136, 72.8697, 'Under Review', 'High', 73, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000029', 'CC-2024-01029', 'Streetlight Not Working for 2 Weeks', 'The streetlight in front of our apartment has not been working for 2 weeks. The area is dark and unsafe.', 'Streetlight Failure', 'MG Colony, Bengaluru', 12.9550, 77.6000, 'Resolved', 'Low', 28, 'd1000000-0000-0000-0000-000000000004', 'Bulb replaced', false),
('c1000000-0000-0000-0000-000000000030', 'CC-2024-01030', 'Solar Panel Streetlight Damaged', 'Solar panel streetlight on the highway approach road has been vandalized. Light not working for 3 days.', 'Streetlight Failure', 'Highway Approach, Hyderabad', 17.4550, 78.5100, 'Assigned', 'Medium', 52, 'd1000000-0000-0000-0000-000000000004', NULL, false),
('c1000000-0000-0000-0000-000000000031', 'CC-2024-01031', 'Multiple Lights Out at Park', 'Several streetlights in the public park have stopped working. Night visitors especially women feel unsafe.', 'Streetlight Failure', 'City Park, Kolkata', 22.5600, 88.3500, 'In Progress', 'High', 68, 'd1000000-0000-0000-0000-000000000004', NULL, false),

-- DRAINAGE (5 complaints)
('c1000000-0000-0000-0000-000000000032', 'CC-2024-01032', 'Clogged Drain Causing Road Overflow', 'The main drain on Sarjapur Road is completely blocked causing road flooding. Sewage mixing with rainwater is a health hazard.', 'Drainage Problem', 'Sarjapur Road, Bengaluru', 12.9082, 77.6847, 'In Progress', 'High', 85, 'd1000000-0000-0000-0000-000000000005', NULL, false),
('c1000000-0000-0000-0000-000000000033', 'CC-2024-01033', 'Broken Drain Cover on Main Road', 'A drain cover on the main road has been broken and missing for days. Risk of pedestrians and cyclists falling in.', 'Drainage Problem', 'Main Road, Pune', 18.5150, 73.8550, 'Under Review', 'High', 77, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000034', 'CC-2024-01034', 'Sewage Overflow in Residential Area', 'The sewage drain near our residential block is overflowing. Raw sewage on the road. Extremely unhealthy conditions especially for children.', 'Drainage Problem', 'Residential Block 7, Delhi', 28.6350, 77.2890, 'Assigned', 'Critical', 93, 'd1000000-0000-0000-0000-000000000005', 'Emergency team dispatched', false),
('c1000000-0000-0000-0000-000000000035', 'CC-2024-01035', 'Drain Overflow Near Silk Board - Area Pattern', 'Drain connected to the Silk Board area is overflowing. Part of the same drainage problem cluster in this locality.', 'Drainage Problem', 'Silk Board Area, Bengaluru', 12.9180, 77.6225, 'Submitted', 'High', 80, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000036', 'CC-2024-01036', 'Drainage Smell from Open Drain', 'Open drainage near the bus stand emits strong sewage smell affecting nearby shops and residents. Health concern.', 'Drainage Problem', 'Bus Stand, Hyderabad', 17.3700, 78.4750, 'Resolved', 'Medium', 45, 'd1000000-0000-0000-0000-000000000005', 'Drain cleaned and covered', false),

-- WATER SUPPLY (4 complaints)
('c1000000-0000-0000-0000-000000000037', 'CC-2024-01037', 'No Water Supply for 3 Days', 'Our area has had no water supply for 3 consecutive days. Residents including elderly and sick people are in distress. Tankers needed urgently.', 'Water Supply', 'HSR Layout, Bengaluru', 12.9116, 77.6389, 'In Progress', 'Critical', 94, 'd1000000-0000-0000-0000-000000000002', 'Tankers dispatched, pipe repair ongoing', false),
('c1000000-0000-0000-0000-000000000038', 'CC-2024-01038', 'Contaminated Water from Tap', 'Brown colored water with foul smell coming from taps for 2 days. Residents suspect sewage contamination. Multiple families affected.', 'Water Supply', 'Koramangala, Bengaluru', 12.9352, 77.6245, 'Under Review', 'Critical', 89, NULL, NULL, false),
('c1000000-0000-0000-0000-000000000039', 'CC-2024-01039', 'Water Pipe Burst on Main Road', 'Main water pipeline has burst on the road near the market. Water wasting continuously. Road also damaged by water erosion.', 'Water Supply', 'Market Road, Chennai', 13.0400, 80.2750, 'In Progress', 'High', 78, 'd1000000-0000-0000-0000-000000000002', NULL, false),
('c1000000-0000-0000-0000-000000000040', 'CC-2024-01040', 'Low Water Pressure in Housing Society', 'Water pressure has been very low for past week. Residents on upper floors receive almost no water. Problem since pipeline repair work nearby.', 'Water Supply', 'Housing Society, Mumbai', 19.0400, 72.8850, 'Submitted', 'Medium', 48, NULL, NULL, false)

ON CONFLICT (complaint_number) DO NOTHING;

-- ============================================================
-- INSERT AI ANALYSIS FOR SEEDED COMPLAINTS
-- ============================================================
INSERT INTO ai_analysis (complaint_id, ai_category, ai_summary, priority, priority_score, priority_reason, suggested_department, recommended_action, severity, analysis_status) VALUES
('c1000000-0000-0000-0000-000000000001', 'Road Damage', 'Large critical pothole near a busy bus stop on MG Road posing immediate vehicle and pedestrian safety risk.', 'Critical', 92, 'Pothole near high-traffic bus stop. Vehicle damage reported. Night visibility risk. Immediate safety concern.', 'Road Maintenance', 'Deploy road repair team immediately. Fill pothole with cold asphalt as temporary fix, schedule permanent resurfacing.', 'Critical', 'completed'),
('c1000000-0000-0000-0000-000000000004', 'Road Damage', 'Pothole on Park Street has already caused accidents. Urgent repair required to prevent further incidents.', 'Critical', 88, 'Accidents already occurred. High-traffic urban road. Potential for serious injury without immediate repair.', 'Road Maintenance', 'Emergency repair within 24 hours. Install warning signs immediately. Coordinate with traffic police.', 'Critical', 'completed'),
('c1000000-0000-0000-0000-000000000011', 'Waterlogging', 'Severe waterlogging at Silk Board Junction causing complete traffic disruption during rain events.', 'Critical', 95, 'High-traffic junction. Complete traffic blockade. Repeated flooding pattern. Economic and safety impact.', 'Drainage', 'Inspect and clear storm drains. Check drain capacity. Long-term: upgrade drainage infrastructure at junction.', 'Critical', 'completed'),
('c1000000-0000-0000-0000-000000000016', 'Waterlogging', 'Road flooding near hospital blocking ambulance access. Life-threatening infrastructure failure.', 'Critical', 98, 'Hospital access road. Emergency vehicle access compromised. Life safety risk. Requires immediate resolution.', 'Drainage', 'Emergency drain clearance. Deploy pumps immediately. Coordinate with hospital administration.', 'Critical', 'completed'),
('c1000000-0000-0000-0000-000000000022', 'Garbage Overflow', 'Suspected medical waste including sharps found on public road near clinic. Immediate biohazard response needed.', 'Critical', 96, 'Biohazard material. Public health emergency. Risk of injury and disease transmission.', 'Sanitation', 'Alert health department immediately. Cordon area. Deploy biohazard cleanup team. Investigate waste source.', 'Critical', 'completed'),
('c1000000-0000-0000-0000-000000000026', 'Streetlight Failure', '500m dark stretch on Outer Ring Road with reported crimes. Immediate security and safety concern.', 'Critical', 91, 'Extended dark stretch. Criminal activity reported. Safety risk to road users and pedestrians.', 'Electricity', 'Emergency repair of all non-functional lights. Coordinate with police for patrol during repair period.', 'Critical', 'completed'),
('c1000000-0000-0000-0000-000000000037', 'Water Supply', 'Complete water supply failure for 3 days in residential area. Distress to elderly and sick residents.', 'Critical', 94, 'Essential utility failure. Vulnerable population affected. Extended duration. Urgent humanitarian need.', 'Water Supply', 'Deploy tankers immediately. Identify and repair pipeline fault. Restore supply within 24 hours.', 'Critical', 'completed')
ON CONFLICT (complaint_id) DO NOTHING;

-- ============================================================
-- INSERT DUPLICATE LINKS
-- ============================================================
INSERT INTO duplicate_links (original_complaint_id, duplicate_complaint_id, similarity_score, confirmed) VALUES
('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000010', 87.5, true),
('c1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000014', 91.2, true),
('c1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000023', 83.7, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INSERT STATUS HISTORY
-- ============================================================
INSERT INTO status_history (complaint_id, old_status, new_status, remarks) VALUES
('c1000000-0000-0000-0000-000000000001', 'Submitted', 'Under Review', 'Complaint received and logged'),
('c1000000-0000-0000-0000-000000000001', 'Under Review', 'Assigned', 'Assigned to Road Maintenance team'),
('c1000000-0000-0000-0000-000000000001', 'Assigned', 'In Progress', 'Team dispatched to location'),
('c1000000-0000-0000-0000-000000000005', 'Submitted', 'Under Review', 'Complaint received'),
('c1000000-0000-0000-0000-000000000005', 'Under Review', 'Assigned', 'Assigned to Roads Dept'),
('c1000000-0000-0000-0000-000000000005', 'Assigned', 'In Progress', 'Work started'),
('c1000000-0000-0000-0000-000000000005', 'In Progress', 'Resolved', 'Road repaired and resurfaced'),
('c1000000-0000-0000-0000-000000000008', 'Submitted', 'Resolved', 'Small pothole filled quickly'),
('c1000000-0000-0000-0000-000000000011', 'Submitted', 'Under Review', 'Logged as critical'),
('c1000000-0000-0000-0000-000000000011', 'Under Review', 'In Progress', 'Drainage inspection team dispatched')
ON CONFLICT DO NOTHING;
