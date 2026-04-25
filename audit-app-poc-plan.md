# Voice-Driven Audit App — 3-Month POC Plan

**Document version:** 1.0
**Date:** April 25, 2026
**Owner:** QA Lead

---

## 1. Executive Summary

A mobile-first audit platform for non-IT auditors (food, pharma, retail) that captures audit responses through both tap and **continuous voice narration in noisy field environments**. The app works fully offline, runs all voice processing on-device, and syncs to the cloud only for PDF report generation and admin oversight.

**Three-month POC goal:** prove that voice-driven audits work in real factory/depot conditions, capture quantitative accuracy data, and produce a stakeholder-ready demo with real audit reports.

**Operating constraints:**
- Offline-first transcription (no cloud ML for primary pipeline)
- Zero recurring infrastructure cost during POC (target: $0–25/month)
- Auditors are daily-wage workers with basic English literacy — UX must be visual, forgiving, large-tap-target
- Single-tenant, English-only
- 3-month shelf life — no over-engineering

---

## 2. Scope

### In scope
- Admin web app: checklist template builder, audit scheduler, vendor management, report viewer
- Mobile app for auditors: scheduled audit list, tap-answer flow, voice mode, photo capture, offline storage, sync queue
- Voice pipeline: on-device transcription, denoising, verdict classification, semantic question matching
- PDF report generation triggered on audit submission
- Three industry templates: food (pre-shipment), pharma (QMS), retail (inline inspection)
- Lightweight analytics for stakeholder review

### Out of scope (explicitly deferred)
- Multi-tenant / vendor isolation
- Multiple languages or non-English accents beyond Indian English
- LLM fallback for ambiguous voice utterances (handled via UX confirmation instead)
- Advanced reporting dashboards, BI integrations
- App Store / Play Store public submission (internal distribution only)
- Compliance certifications (SOC 2, ISO, etc.)
- Push notifications, SMS alerts
- Auditor performance scoring / gamification

---

## 3. Personas

**Admin / QA Manager** — desktop user, creates checklist templates, schedules audits against vendors, reviews submitted reports. Tech-comfortable.

**Auditor** — field user on mobile, daily-wage worker, basic English, often wearing gloves, in noisy environments (machinery, crowds), unreliable WiFi at vendor sites. **The primary user the UX is built for.**

**Vendor / Factory Owner** — receives the final PDF report. Not a direct app user.

---

## 4. Functional Requirements

### Admin web app
- Create, edit, version checklist templates
- Define sections (QMS, Compliance, Defects), questions (mandatory/optional), and configurable response options
- Schedule audits by vendor, audit type, date
- View audit status pipeline: Scheduled → In Progress → Draft → Submitted
- View submitted audits with response details, photos, transcripts, generated PDF
- Edit verdict lexicon (JSON config) without code deploys

### Mobile audit app
- View today's scheduled audits with clear status indicators
- Start / resume / submit audits
- Tap-to-answer: 4 verdict buttons (Majorly comply, Partial comply, Not complied, N/A) per question
- Voice mode: continuous narration with live transcription, auto-suggested question matches and verdicts, one-tap confirmation
- Per-question comment field
- Photo capture per question with auto-attachment
- Offline-first: every action works without network
- Visual review screen before submit (colored grid by section)
- Submit flow: validates required questions, queues for sync, shows success state

### Voice pipeline (on-device)
- Capture audio in chunks during voice mode
- Denoise each chunk before transcription
- Transcribe to text using on-device Whisper
- Classify verdict from transcript using keyword/regex lexicon
- Match utterance to checklist question via on-device embeddings
- Show suggestion card with confidence score; auditor confirms, edits, or rejects
- Confidence below threshold → "couldn't match, please tap manually" prompt (no silent failure)

### Backend
- Auth (admin + auditor accounts, role-based)
- CRUD for checklist templates, vendors, audits, responses, photos, transcripts
- Sync endpoint accepting batched offline mutations
- PDF generation on audit submission
- Audio file lifecycle: keep 7 days, then auto-delete
- Verdict lexicon as remote config

---

## 5. Non-Functional Requirements

| Concern | Target |
|---|---|
| Voice transcription accuracy (light noise, Indian English) | ≥85% word accuracy |
| Verdict classifier accuracy | ≥95% on natural English audit speech |
| Question match top-1 accuracy | ≥80% when transcription is correct |
| Time to first transcript token after speaking | <3 seconds on mid-range Android |
| App cold start | <3 seconds |
| PDF generation time | <5 seconds per audit |
| Offline support | All audit actions except download new audits, receive PDF |
| Sync resilience | Retry on failure, dedupe on server, no data loss |
| Mobile app size | <300MB total (after first-run model download) |
| Battery drain in voice mode | <15% per 30-min audit on mid-range device |

---

## 6. Tech Stack

### Mobile
- **Framework:** React Native via Expo
- **Local DB:** SQLite (`expo-sqlite`)
- **Audio:** `expo-av`
- **Camera:** `expo-camera`, `expo-image-manipulator`
- **ASR:** `whisper.rn` with Whisper `base.en` model (~140MB, downloaded on first run)
- **Denoising:** RNNoise via native module
- **Embeddings:** `all-MiniLM-L6-v2` exported to ONNX, run via `onnxruntime-react-native`
- **Verdict classifier:** plain JS, lexicon loaded from remote config
- **UI primitives:** Lucide icons, Reanimated for transitions, Lottie for celebration animations
- **State:** Zustand or React Context (avoid Redux for POC)
- **Sync queue:** custom SQLite-backed queue with retry/backoff

### Backend & infrastructure
- **Database + auth + storage + auto-APIs:** Supabase (Postgres, Auth, Storage, pgvector available if needed later)
- **Admin web:** Next.js 15 + shadcn/ui + TanStack Query, hosted on Vercel
- **Custom backend logic:** Vercel API routes (sync endpoint, PDF generation, lexicon config)
- **PDF generation:** `@react-pdf/renderer` in Vercel API route
- **Mobile builds & OTA:** Expo Application Services (EAS Build + EAS Update)
- **Analytics:** PostHog cloud
- **DNS:** Cloudflare

### Optional
- **Cloud Whisper toggle** for opt-in accuracy comparison: OpenAI Whisper API via Vercel API route, gated behind a per-auditor flag. Provides A/B data without changing the offline default.

---

## 7. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ MOBILE APP (auditor, offline-first)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Voice Pipeline (on-device)                           │   │
│  │  expo-av → RNNoise → whisper.rn → MiniLM ONNX        │   │
│  │                                  → verdict regex     │   │
│  └──────────────────────────────────────────────────────┘   │
│  SQLite (audits, responses, photos, transcripts, queue)     │
└────────────────────┬────────────────────────────────────────┘
                     │ sync (when online)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ VERCEL                                                      │
│  - Next.js admin web app                                    │
│  - API routes: /sync, /generate-pdf, /lexicon               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE                                                    │
│  Postgres: users, vendors, checklist_templates,             │
│            audits, responses, photos, transcripts, lexicon  │
│  Storage:  audio (7-day retention), photos, generated PDFs  │
│  Auth:     email/password, role = admin | auditor           │
│  pg_cron:  audio retention cleanup                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Data Model (high level)

| Table | Purpose | Key fields |
|---|---|---|
| `users` | Admin and auditor accounts | id, email, role, name |
| `vendors` | Audited entities | id, name, type, address |
| `checklist_templates` | Reusable templates | id, name, industry, version, is_active |
| `checklist_sections` | QMS / Compliance / Defects | id, template_id, name, order |
| `checklist_questions` | Individual questions | id, section_id, text, is_mandatory, response_options[], embedding (vector) |
| `audits` | Scheduled or running audits | id, vendor_id, template_snapshot (JSON), auditor_id, status, scheduled_at, started_at, submitted_at |
| `responses` | One per question per audit | id, audit_id, question_id, verdict, comment, confidence, source (tap/voice) |
| `photos` | Evidence | id, response_id, storage_path |
| `transcripts` | Voice recordings as text | id, audit_id, full_text, utterances (JSON with timestamps) |
| `audio_files` | Temporary audio | id, audit_id, storage_path, expires_at |
| `lexicon` | Verdict keywords | id, verdict, keywords (JSON), updated_at |
| `sync_log` | Idempotency for offline sync | id, client_mutation_id, applied_at |

**Critical rule:** `audits.template_snapshot` contains the full checklist JSON at audit start. Edits to `checklist_templates` after that point do not affect in-progress audits.

---

## 9. UX Principles

1. **Visual-first** — icons + colors + words (triple redundancy)
2. **Big tap targets** — 56dp minimum
3. **Color = meaning, consistently** — green/amber/red/grey across all surfaces
4. **One screen, one job** — no nested navigation
5. **Voice as the hero** — large persistent mic button, single dedicated voice mode
6. **Progress always visible** — every audit screen shows N of M completed
7. **Forgiving** — every action reversible, no scary error states
8. **Offline looks like online** — quiet status indicator, no anxiety-inducing warnings

Key screen flows: audit list → question → voice mode → review grid → submit confirmation → success.

First-run onboarding: 3 screens, ends with a calibration practice that validates mic, accent, and verdict classifier baseline.

---

## 10. Voice Pipeline Detail

### Stage 1 — Audio capture
- 5–10 second chunks while voice mode is active
- 16kHz mono, sufficient for Whisper

### Stage 2 — Denoising
- RNNoise pre-processing on each chunk
- ~100KB native module, runs in real-time

### Stage 3 — Transcription
- `whisper.rn` with `base.en` model
- Initial prompt biased with audit vocabulary: "GMP HACCP MOQ PPE comply partial fire safety temperature log"
- Returns timestamped utterances

### Stage 4 — Verdict classification
- Keyword/regex over each utterance
- Lexicon stored as JSON, fetched from Supabase on app launch with bundled fallback
- Verdicts: Majorly comply, Partial comply, Not complied, N/A
- Sample lexicon entries:
  - Comply: comply, complies, compliant, meets, passes, good, okay, fine, no issues, all good
  - Partial: partial, partially, somewhat, mostly but, kind of
  - Not: not comply, fails, non-compliant, issue, problem, violation, bad, dodgy
  - N/A: not applicable, n a, doesn't apply, skip, not relevant

### Stage 5 — Question matching
- Embed utterance via MiniLM ONNX on-device
- Cosine similarity against pre-computed question embeddings (stored in SQLite at audit start)
- Top-1 if score ≥ 0.65, else show "couldn't match — please tap"
- Top-2 within 0.05 of each other → show both, let auditor pick

### Stage 6 — Comment extraction
- Tail of utterance after verdict keyword becomes the comment
- Example: *"Fire engine place is partial comply, due to exposed to sunlight"* → comment = "exposed to sunlight"

### Stage 7 — Suggestion card UX
- Card shows matched question, proposed verdict, confidence, extracted comment
- Auditor: ✓ Confirm | ✏ Edit | ↺ Re-record
- Confirmation auto-saves response and dismisses card

### No LLM fallback
When confidence is low or verdict can't be classified, the UX shows the transcript and asks the auditor to tap manually. This is acceptable because: voice is augmenting tap-to-answer, not replacing it.

---

## 11. Hosting & Cost

| Service | Tier | POC cost |
|---|---|---|
| Supabase | Free (upgrade to Pro $25 if needed) | $0–25/mo |
| Vercel | Hobby | $0 |
| EAS Build + Update | Free | $0 |
| PostHog | Free (1M events) | $0 |
| Cloudflare DNS | Free | $0 |
| Cloud Whisper API (optional toggle) | Pay-per-use | ~$5/mo if used |

**Total expected cost over 3 months: $0–75.**

Free-tier guardrails:
- Audio auto-deleted after 7 days via `pg_cron` to stay under Supabase 1GB storage
- Photos compressed to 1080p JPEG (~200KB each)
- Embeddings stored in SQLite on device, not Postgres (no pgvector dependency for POC)

---

## 12. 12-Week Build Plan

### Weeks 1–2: Foundation
- Monorepo setup, Supabase project, Vercel project, EAS project
- Auth flow (admin + auditor)
- Schema and migrations
- Admin: vendor CRUD, basic checklist builder
- Mobile: shell, audit list, audit detail, single-question screen with tap answers

### Weeks 3–4: Voice pipeline
- `whisper.rn` integration with first-run download
- RNNoise wiring
- MiniLM ONNX embedding model
- Verdict classifier with bundled lexicon
- Voice mode UI: listening screen, suggestion card, confirm/edit flow
- Per-question photo capture

### Week 5: Offline + PDF
- SQLite sync queue with retry
- Sync API route with idempotency
- PDF template per industry
- PDF generation API route
- Submit flow: review grid, validation, success state

### Week 6: First field test ⚠ critical milestone
- Onboard 2 real auditors at 1 vendor
- Run 5 real audits across food + pharma
- Capture analytics, audio samples, classifier override events
- Daily standups during this week — fast iteration

### Weeks 7–8: Polish based on field feedback
- Expand verdict lexicon based on real auditor speech
- Tune confidence thresholds
- Fix UX gaps surfaced in field test
- Add cloud Whisper toggle (if pursuing)
- First-run onboarding refinement

### Weeks 9–10: Wider rollout
- Add retail inline inspection template
- Onboard 5–8 auditors across 3 industries
- Run ~30 audits
- Monitor sync failures, transcription accuracy, completion rates

### Weeks 11–12: Stakeholder demo + retrospective
- Polish admin reporting view
- Compile analytics: completion rates, voice usage %, classifier accuracy, override patterns
- Live demo with one auditor running a fresh audit
- Decision document: continue / pivot / shelve, with cost estimate for production version

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Whisper base too inaccurate in heavy machinery noise | High | High | RNNoise upstream; cloud Whisper toggle; UX always allows manual tap |
| Auditor accents reduce transcription quality | Medium | Medium | Calibration step in onboarding; initial prompt biasing with audit vocab |
| First-run model download fails on flaky depot WiFi | Medium | Medium | Resumable downloads via `expo-file-system`; option to ship pre-loaded devices |
| Low-end Android phones too slow for Whisper base | Medium | High | Test on target device early (week 1); fall back to `tiny.en` if needed |
| Sync conflicts when same audit edited offline | Low | Medium | Last-write-wins per response; `client_mutation_id` for idempotency |
| Free tier limits hit before 3 months | Medium | Low | Audio retention policy; upgrade Supabase Pro if needed ($25) |
| Auditors don't adopt voice mode | Medium | Medium | Tap mode always works; analytics will tell us; not a blocker for POC |
| Field test (week 6) reveals fundamental UX issues | Medium | High | Two weeks (7–8) explicitly reserved for rework |

---

## 14. Success Metrics for Stakeholder Decision

Tracked from week 6 onwards:

- **Audit completion rate** — % of started audits that get submitted (target: ≥85%)
- **Voice mode adoption** — % of audits using voice for ≥1 question (target: ≥60%)
- **Verdict classifier acceptance** — % of voice suggestions confirmed without override (target: ≥75%)
- **Question match accuracy** — top-1 correct based on auditor confirm/reject (target: ≥80%)
- **Time per audit** — voice-heavy vs tap-only median (target: voice ≥20% faster)
- **Sync failure rate** — failed mutations per 1000 attempts (target: <5)
- **Auditor satisfaction** — qualitative interview at week 12 (target: positive on UX, mixed acceptable on voice)

These numbers, plus 30+ real PDF reports, are what gets shown to stakeholders at week 12.

---

## 15. Open Questions

1. **Mobile devices** — confirm target phone model. Drives whether `base.en` or `tiny.en` is the right Whisper choice.
2. **Pilot vendor for week 6** — which vendor will be the first field test partner? Conversation should start by week 2.
3. **Cloud Whisper toggle** — include or skip? Recommend include for A/B accuracy data and stakeholder transparency.
4. **Lexicon ownership** — who edits the JSON when new auditor phrasings are discovered? QA lead vs developer vs shared.
5. **Photo expectations per audit** — affects local storage and sync payload sizing.
6. **Data residency** — does Indian residency matter from POC day one? Affects Supabase region (free us-east vs Pro Mumbai).

---

## 16. What Comes After the POC

If the 3-month POC succeeds and stakeholders approve a production build, the natural next steps are:

- Replace on-device Whisper as default with cloud Whisper for accuracy (keep on-device as offline fallback)
- Multi-tenant architecture with row-level security
- App Store / Play Store distribution
- Multi-language support (Hindi first)
- LLM-assisted disambiguation for low-confidence utterances
- Compliance work (data retention policies, audit logs, role-based access control)
- Native dashboards for QA leadership

These are explicitly out of scope for the 3-month POC and should not be built speculatively.

---

*End of plan.*
