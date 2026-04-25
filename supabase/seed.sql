-- Seed data for the audit POC.
-- Mirrors packages/checklists/src — regenerate with `pnpm --filter @vo360/checklists build:sql`.

-- Demo users (mirror these UUIDs into auth.users when you create the auth accounts)
insert into public.users (id, email, name, role) values
  ('bbbb2222-0000-0000-0000-000000000001', 'qa.lead@vo360.demo', 'Priya Sharma (QA Lead)', 'admin'),
  ('bbbb2222-0000-0000-0000-000000000002', 'auditor1@vo360.demo', 'Ramesh Kumar', 'auditor'),
  ('bbbb2222-0000-0000-0000-000000000003', 'auditor2@vo360.demo', 'Lakshmi Iyer', 'auditor')
on conflict (id) do nothing;

-- Vendors
insert into public.vendors (id, name, type, address, contact_name, contact_phone) values
  ('aaaa1111-0000-0000-0000-000000000001', 'Sundar Foods Pvt Ltd', 'Food processing — frozen', 'Plot 14, MIDC Bhiwandi, Maharashtra 421308', 'Ravi Deshmukh', '+91 98200 00001'),
  ('aaaa1111-0000-0000-0000-000000000002', 'Greenleaf Dairy Co-op', 'Food processing — dairy', '23, Industrial Estate, Anand, Gujarat 388001', 'Ketan Patel', '+91 98200 00002'),
  ('aaaa1111-0000-0000-0000-000000000003', 'Crescent Pharma Manufacturing', 'Pharma — oral solid dose', 'Survey 211, Baddi, Himachal Pradesh 173205', 'Dr. Anjali Mehta', '+91 98200 00003'),
  ('aaaa1111-0000-0000-0000-000000000004', 'Vidya Pharma Liquids', 'Pharma — oral liquids', 'Ankleshwar GIDC, Gujarat 393002', 'Suresh Iyer', '+91 98200 00004'),
  ('aaaa1111-0000-0000-0000-000000000005', 'Stitchwell Apparel Exports', 'Retail — apparel manufacturing', 'Tirupur SEZ, Tamil Nadu 641604', 'Meena Subramaniam', '+91 98200 00005'),
  ('aaaa1111-0000-0000-0000-000000000006', 'NorthStar Knits', 'Retail — knitted garments', 'Sector 63, Noida, UP 201301', 'Harish Bhatia', '+91 98200 00006')
on conflict (id) do nothing;

-- ============================================================
-- Template 1: Food Pre-Shipment Audit
-- ============================================================
insert into public.checklist_templates (id, name, industry, version, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'Food Pre-Shipment Audit', 'food', 1, true)
on conflict (id) do nothing;

insert into public.checklist_sections (id, template_id, name, display_order) values
  ('11111111-1111-1111-1111-1111aaaa0001', '11111111-1111-1111-1111-111111111111', 'Documentation & Records', 1),
  ('11111111-1111-1111-1111-1111aaaa0002', '11111111-1111-1111-1111-111111111111', 'Personnel & Hygiene', 2),
  ('11111111-1111-1111-1111-1111aaaa0003', '11111111-1111-1111-1111-111111111111', 'Facility & Equipment', 3),
  ('11111111-1111-1111-1111-1111aaaa0004', '11111111-1111-1111-1111-111111111111', 'Product Quality', 4),
  ('11111111-1111-1111-1111-1111aaaa0005', '11111111-1111-1111-1111-111111111111', 'Storage & Dispatch', 5)
on conflict (id) do nothing;

insert into public.checklist_questions (id, section_id, text, is_mandatory, display_order) values
  ('11111111-1111-1111-1111-1111aaaa1001', '11111111-1111-1111-1111-1111aaaa0001', 'Are batch production records complete and signed by the supervisor?', true, 1),
  ('11111111-1111-1111-1111-1111aaaa1002', '11111111-1111-1111-1111-1111aaaa0001', 'Are HACCP records (CCPs, temperature logs) current and reviewed for the last 7 days?', true, 2),
  ('11111111-1111-1111-1111-1111aaaa1003', '11111111-1111-1111-1111-1111aaaa0001', 'Are GMP and food-safety training records up to date for all production staff?', true, 3),
  ('11111111-1111-1111-1111-1111aaaa1004', '11111111-1111-1111-1111-1111aaaa0001', 'Are pest control reports from a licensed pest control vendor available?', true, 4),
  ('11111111-1111-1111-1111-1111aaaa1005', '11111111-1111-1111-1111-1111aaaa0001', 'Are calibration certificates available for thermometers and weighing scales?', false, 5),
  ('11111111-1111-1111-1111-1111aaaa1006', '11111111-1111-1111-1111-1111aaaa0002', 'Are all personnel wearing required PPE — hairnets, gloves, aprons, beard covers?', true, 1),
  ('11111111-1111-1111-1111-1111aaaa1007', '11111111-1111-1111-1111-1111aaaa0002', 'Is the handwashing facility functional with soap, sanitizer and disposable towels?', true, 2),
  ('11111111-1111-1111-1111-1111aaaa1008', '11111111-1111-1111-1111-1111aaaa0002', 'Are health declaration / fitness records current for all staff in production zones?', true, 3),
  ('11111111-1111-1111-1111-1111aaaa1009', '11111111-1111-1111-1111-1111aaaa0002', 'Is restricted access enforced for non-production personnel entering processing area?', false, 4),
  ('11111111-1111-1111-1111-1111aaaa1010', '11111111-1111-1111-1111-1111aaaa0003', 'Are processing surfaces visibly clean and sanitized per the cleaning schedule?', true, 1),
  ('11111111-1111-1111-1111-1111aaaa1011', '11111111-1111-1111-1111-1111aaaa0003', 'Is fire safety equipment (extinguishers, alarms) accessible and within inspection date?', true, 2),
  ('11111111-1111-1111-1111-1111aaaa1012', '11111111-1111-1111-1111-1111aaaa0003', 'Are pest entry points (doors, windows, drains) sealed and fly catchers operational?', true, 3),
  ('11111111-1111-1111-1111-1111aaaa1013', '11111111-1111-1111-1111-1111aaaa0003', 'Is lighting adequate at processing stations and free from broken or unshielded bulbs?', false, 4),
  ('11111111-1111-1111-1111-1111aaaa1014', '11111111-1111-1111-1111-1111aaaa0003', 'Is the metal detector functional and tested with standard test pieces this shift?', true, 5),
  ('11111111-1111-1111-1111-1111aaaa1015', '11111111-1111-1111-1111-1111aaaa0004', 'Does product weight meet specification within ±2% tolerance on sampled units?', true, 1),
  ('11111111-1111-1111-1111-1111aaaa1016', '11111111-1111-1111-1111-1111aaaa0004', 'Are labels accurate including allergen declarations, ingredients and FSSAI license number?', true, 2),
  ('11111111-1111-1111-1111-1111aaaa1017', '11111111-1111-1111-1111-1111aaaa0004', 'Are MFG and best-before dates correctly printed and legible on packaging?', true, 3),
  ('11111111-1111-1111-1111-1111aaaa1018', '11111111-1111-1111-1111-1111aaaa0004', 'Is packaging integrity intact for sample units (no leaks, tears, swelling)?', true, 4),
  ('11111111-1111-1111-1111-1111aaaa1019', '11111111-1111-1111-1111-1111aaaa0005', 'Is cold chain maintained — chilled below 4°C, frozen below -18°C — at storage and loading bay?', true, 1),
  ('11111111-1111-1111-1111-1111aaaa1020', '11111111-1111-1111-1111-1111aaaa0005', 'Is FIFO / FEFO followed in dispatch staging with clear date marking?', true, 2),
  ('11111111-1111-1111-1111-1111aaaa1021', '11111111-1111-1111-1111-1111aaaa0005', 'Are dispatch vehicles inspected for cleanliness and pre-cooled before loading?', true, 3),
  ('11111111-1111-1111-1111-1111aaaa1022', '11111111-1111-1111-1111-1111aaaa0005', 'Does shipment documentation match the purchase order (SKU, qty, batch numbers)?', true, 4)
on conflict (id) do nothing;

-- ============================================================
-- Template 2: Pharma QMS Audit
-- ============================================================
insert into public.checklist_templates (id, name, industry, version, is_active) values
  ('22222222-2222-2222-2222-222222222222', 'Pharma QMS Audit', 'pharma', 1, true)
on conflict (id) do nothing;

insert into public.checklist_sections (id, template_id, name, display_order) values
  ('22222222-2222-2222-2222-2222bbbb0001', '22222222-2222-2222-2222-222222222222', 'Quality Management System', 1),
  ('22222222-2222-2222-2222-2222bbbb0002', '22222222-2222-2222-2222-222222222222', 'Documentation & Records', 2),
  ('22222222-2222-2222-2222-2222bbbb0003', '22222222-2222-2222-2222-222222222222', 'Personnel & Training', 3),
  ('22222222-2222-2222-2222-2222bbbb0004', '22222222-2222-2222-2222-222222222222', 'Facility & Equipment', 4),
  ('22222222-2222-2222-2222-2222bbbb0005', '22222222-2222-2222-2222-222222222222', 'Materials & Products', 5),
  ('22222222-2222-2222-2222-2222bbbb0006', '22222222-2222-2222-2222-222222222222', 'Quality Control Lab', 6)
on conflict (id) do nothing;

insert into public.checklist_questions (id, section_id, text, is_mandatory, display_order) values
  ('22222222-2222-2222-2222-2222bbbb1001', '22222222-2222-2222-2222-2222bbbb0001', 'Is the Quality Manual current, approved and accessible to relevant personnel?', true, 1),
  ('22222222-2222-2222-2222-2222bbbb1002', '22222222-2222-2222-2222-2222bbbb0001', 'Are SOPs available at point of use and within their review date?', true, 2),
  ('22222222-2222-2222-2222-2222bbbb1003', '22222222-2222-2222-2222-2222bbbb0001', 'Are deviation reports raised, investigated and CAPAs closed within timelines?', true, 3),
  ('22222222-2222-2222-2222-2222bbbb1004', '22222222-2222-2222-2222-2222bbbb0001', 'Is the change control process being followed with QA approval before implementation?', true, 4),
  ('22222222-2222-2222-2222-2222bbbb1005', '22222222-2222-2222-2222-2222bbbb0002', 'Are batch manufacturing records (BMR) complete, contemporaneous and reviewed?', true, 1),
  ('22222222-2222-2222-2222-2222bbbb1006', '22222222-2222-2222-2222-2222bbbb0002', 'Are batch packaging records (BPR) signed by supervisor and QA before release?', true, 2),
  ('22222222-2222-2222-2222-2222bbbb1007', '22222222-2222-2222-2222-2222bbbb0002', 'Are equipment logbooks current with usage, cleaning and maintenance entries?', true, 3),
  ('22222222-2222-2222-2222-2222bbbb1008', '22222222-2222-2222-2222-2222bbbb0002', 'Is electronic data integrity (audit trails, time-stamps, user access) verified per ALCOA+?', true, 4),
  ('22222222-2222-2222-2222-2222bbbb1009', '22222222-2222-2222-2222-2222bbbb0003', 'Are training records current for all GMP-relevant personnel including refresher cycles?', true, 1),
  ('22222222-2222-2222-2222-2222bbbb1010', '22222222-2222-2222-2222-2222bbbb0003', 'Is gowning procedure followed in classified areas (Grade C/D as applicable)?', true, 2),
  ('22222222-2222-2222-2222-2222bbbb1011', '22222222-2222-2222-2222-2222bbbb0003', 'Are health checks documented for production staff including pre-employment medicals?', true, 3),
  ('22222222-2222-2222-2222-2222bbbb1012', '22222222-2222-2222-2222-2222bbbb0004', 'Are HVAC pressure differentials between classified areas within specification?', true, 1),
  ('22222222-2222-2222-2222-2222bbbb1013', '22222222-2222-2222-2222-2222bbbb0004', 'Is environmental monitoring data (viable + non-viable particles) within action limits?', true, 2),
  ('22222222-2222-2222-2222-2222bbbb1014', '22222222-2222-2222-2222-2222bbbb0004', 'Are equipment calibration certificates current for critical instruments?', true, 3),
  ('22222222-2222-2222-2222-2222bbbb1015', '22222222-2222-2222-2222-2222bbbb0004', 'Is the preventive maintenance schedule adhered to without overdue items?', true, 4),
  ('22222222-2222-2222-2222-2222bbbb1016', '22222222-2222-2222-2222-2222bbbb0004', 'Are cleaning validation records present for product changeover on shared equipment?', true, 5),
  ('22222222-2222-2222-2222-2222bbbb1017', '22222222-2222-2222-2222-2222bbbb0005', 'Is raw material quarantine and release process followed with QC approval?', true, 1),
  ('22222222-2222-2222-2222-2222bbbb1018', '22222222-2222-2222-2222-2222bbbb0005', 'Are reference samples and retention samples maintained per regulatory requirement?', true, 2),
  ('22222222-2222-2222-2222-2222bbbb1019', '22222222-2222-2222-2222-2222bbbb0005', 'Is stability data current for all marketed products with no out-of-trend results?', false, 3),
  ('22222222-2222-2222-2222-2222bbbb1020', '22222222-2222-2222-2222-2222bbbb0005', 'Has the product recall procedure been mock-tested in the last 12 months?', false, 4),
  ('22222222-2222-2222-2222-2222bbbb1021', '22222222-2222-2222-2222-2222bbbb0006', 'Are analytical method validation records current and approved?', true, 1),
  ('22222222-2222-2222-2222-2222bbbb1022', '22222222-2222-2222-2222-2222bbbb0006', 'Are reagent and reference standard expiries tracked and labelled?', true, 2),
  ('22222222-2222-2222-2222-2222bbbb1023', '22222222-2222-2222-2222-2222bbbb0006', 'Are out-of-specification investigations documented with phase 1 / phase 2 conclusions?', true, 3)
on conflict (id) do nothing;

-- ============================================================
-- Template 3: Retail Inline Inspection
-- ============================================================
insert into public.checklist_templates (id, name, industry, version, is_active) values
  ('33333333-3333-3333-3333-333333333333', 'Retail Inline Inspection', 'retail', 1, true)
on conflict (id) do nothing;

insert into public.checklist_sections (id, template_id, name, display_order) values
  ('33333333-3333-3333-3333-3333cccc0001', '33333333-3333-3333-3333-333333333333', 'Pre-Production Setup', 1),
  ('33333333-3333-3333-3333-3333cccc0002', '33333333-3333-3333-3333-333333333333', 'Workmanship - Visual', 2),
  ('33333333-3333-3333-3333-3333cccc0003', '33333333-3333-3333-3333-333333333333', 'Measurements', 3),
  ('33333333-3333-3333-3333-3333cccc0004', '33333333-3333-3333-3333-333333333333', 'Trims & Labels', 4),
  ('33333333-3333-3333-3333-3333cccc0005', '33333333-3333-3333-3333-333333333333', 'Packing & Cartons', 5),
  ('33333333-3333-3333-3333-3333cccc0006', '33333333-3333-3333-3333-333333333333', 'Compliance & Documentation', 6)
on conflict (id) do nothing;

insert into public.checklist_questions (id, section_id, text, is_mandatory, display_order) values
  ('33333333-3333-3333-3333-3333cccc1001', '33333333-3333-3333-3333-3333cccc0001', 'Is the buyer-approved sample available at the production line for reference?', true, 1),
  ('33333333-3333-3333-3333-3333cccc1002', '33333333-3333-3333-3333-3333cccc0001', 'Are trims and accessories matching the bulk approval sheet (color, size, brand)?', true, 2),
  ('33333333-3333-3333-3333-3333cccc1003', '33333333-3333-3333-3333-3333cccc0001', 'Is the line layout consistent with the approved process flow?', false, 3),
  ('33333333-3333-3333-3333-3333cccc1004', '33333333-3333-3333-3333-3333cccc0001', 'Have operators been briefed on the critical defect list for this style?', true, 4),
  ('33333333-3333-3333-3333-3333cccc1005', '33333333-3333-3333-3333-3333cccc0002', 'Are stitching defects (skip stitch, broken stitch, loose thread) within AQL 2.5?', true, 1),
  ('33333333-3333-3333-3333-3333cccc1006', '33333333-3333-3333-3333-3333cccc0002', 'Are seam puckering and uneven seams absent on inspected pieces?', true, 2),
  ('33333333-3333-3333-3333-3333cccc1007', '33333333-3333-3333-3333-3333cccc0002', 'Is color shading within the approved range across cut, sewn and finished pieces?', true, 3),
  ('33333333-3333-3333-3333-3333cccc1008', '33333333-3333-3333-3333-3333cccc0002', 'Are print, embroidery and applique placements per the approved spec?', true, 4),
  ('33333333-3333-3333-3333-3333cccc1009', '33333333-3333-3333-3333-3333cccc0002', 'Are stains, holes, and fabric defects absent on inspected pieces?', true, 5),
  ('33333333-3333-3333-3333-3333cccc1010', '33333333-3333-3333-3333-3333cccc0003', 'Do garment measurements fall within the approved tolerance (±0.5 inch typical)?', true, 1),
  ('33333333-3333-3333-3333-3333cccc1011', '33333333-3333-3333-3333-3333cccc0003', 'Are critical points of measure (chest, length, sleeve) checked per AQL plan?', true, 2),
  ('33333333-3333-3333-3333-3333cccc1012', '33333333-3333-3333-3333-3333cccc0003', 'Is the measurement record signed by both QC and floor supervisor?', false, 3),
  ('33333333-3333-3333-3333-3333cccc1013', '33333333-3333-3333-3333-3333cccc0004', 'Is the main label correctly attached and oriented per the spec sheet?', true, 1),
  ('33333333-3333-3333-3333-3333cccc1014', '33333333-3333-3333-3333-3333cccc0004', 'Are care label and country-of-origin label present, legible and durable?', true, 2),
  ('33333333-3333-3333-3333-3333cccc1015', '33333333-3333-3333-3333-3333cccc0004', 'Are size labels correctly sequenced when packed in cartons (assortment correct)?', true, 3),
  ('33333333-3333-3333-3333-3333cccc1016', '33333333-3333-3333-3333-3333cccc0004', 'Are buttons, zippers and snaps functional on tested samples (pull/peel test)?', true, 4),
  ('33333333-3333-3333-3333-3333cccc1017', '33333333-3333-3333-3333-3333cccc0005', 'Is poly bag size, barcode and warning text correct per buyer requirement?', true, 1),
  ('33333333-3333-3333-3333-3333cccc1018', '33333333-3333-3333-3333-3333cccc0005', 'Are folding and presentation per the buyer-approved presentation board?', true, 2),
  ('33333333-3333-3333-3333-3333cccc1019', '33333333-3333-3333-3333-3333cccc0005', 'Are carton markings (PO, style, color, qty, dimensions) accurate and legible?', true, 3),
  ('33333333-3333-3333-3333-3333cccc1020', '33333333-3333-3333-3333-3333cccc0005', 'Has carton drop test been performed and passed for sample cartons?', false, 4),
  ('33333333-3333-3333-3333-3333cccc1021', '33333333-3333-3333-3333-3333cccc0006', 'Is the inline inspection report being filled in real-time on the line?', true, 1),
  ('33333333-3333-3333-3333-3333cccc1022', '33333333-3333-3333-3333-3333cccc0006', 'Are needle policy and metal detection logs maintained and signed?', true, 2),
  ('33333333-3333-3333-3333-3333cccc1023', '33333333-3333-3333-3333-3333cccc0006', 'Are reject and rework counts being tracked against shift production?', false, 3)
on conflict (id) do nothing;

-- ============================================================
-- Default verdict lexicon
-- ============================================================
insert into public.lexicon (verdict, keywords) values
  ('majorly_comply', '["majorly comply","fully comply","comply","complies","compliant","meets","passes","good","okay","fine","no issues","all good","satisfactory","approved","pass"]'::jsonb),
  ('partial_comply', '["partial comply","partial compliance","partially","partial","somewhat","mostly but","kind of","sort of","almost","half comply"]'::jsonb),
  ('not_complied',   '["not comply","does not comply","fails","failed","fail","non-compliant","not compliant","issue","problem","violation","bad","rejected","reject","unsatisfactory"]'::jsonb),
  ('na',             '["not applicable","doesn''t apply","does not apply","skip","not relevant","not required","n a","na"]'::jsonb)
on conflict (verdict) do update set keywords = excluded.keywords, updated_at = now();

-- ============================================================
-- Sample audits — 1 scheduled per industry, against demo auditors.
-- template_snapshot is hydrated from the live checklist tables so the mobile
-- app gets a complete, frozen JSON tree at pull time (matches what the
-- production audit.start flow will write).
-- ============================================================
create or replace function public._build_template_snapshot(p_template uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', t.id::text,
    'name', t.name,
    'industry', t.industry,
    'version', t.version,
    'isActive', t.is_active,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id::text,
        'name', s.name,
        'order', s.display_order,
        'questions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', q.id::text,
            'text', q.text,
            'isMandatory', q.is_mandatory,
            'responseOptions', q.response_options,
            'order', q.display_order
          ) order by q.display_order)
          from public.checklist_questions q where q.section_id = s.id
        ), '[]'::jsonb)
      ) order by s.display_order)
      from public.checklist_sections s where s.template_id = t.id
    ), '[]'::jsonb)
  )
  from public.checklist_templates t where t.id = p_template;
$$;

insert into public.audits (id, vendor_id, template_id, template_snapshot, auditor_id, status, scheduled_at) values
  ('cccc3333-0000-0000-0000-000000000001',
   'aaaa1111-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   public._build_template_snapshot('11111111-1111-1111-1111-111111111111'),
   'bbbb2222-0000-0000-0000-000000000002',
   'scheduled',
   now() + interval '1 day'),
  ('cccc3333-0000-0000-0000-000000000002',
   'aaaa1111-0000-0000-0000-000000000003',
   '22222222-2222-2222-2222-222222222222',
   public._build_template_snapshot('22222222-2222-2222-2222-222222222222'),
   'bbbb2222-0000-0000-0000-000000000002',
   'scheduled',
   now() + interval '2 day'),
  ('cccc3333-0000-0000-0000-000000000003',
   'aaaa1111-0000-0000-0000-000000000005',
   '33333333-3333-3333-3333-333333333333',
   public._build_template_snapshot('33333333-3333-3333-3333-333333333333'),
   'bbbb2222-0000-0000-0000-000000000003',
   'scheduled',
   now() + interval '3 day')
on conflict (id) do nothing;

-- ============================================================
-- Storage buckets (private — access via signed URLs only)
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('reports', 'reports', false),
  ('photos', 'photos', false),
  ('audio', 'audio', false)
on conflict (id) do nothing;

-- Storage policies: authenticated users can write their own audit's photos
-- and read them back. Admin reads happen via the service-role key in API routes.
create policy "auth uploads to photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

create policy "auth reads own photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos');
