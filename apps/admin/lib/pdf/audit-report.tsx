import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import {
  VERDICT_LABELS,
  VERDICT_COLORS,
  type ChecklistTemplate,
  type Verdict,
} from '@vo360/shared';

export interface AuditReportData {
  auditId: string;
  vendorName: string;
  vendorAddress: string;
  vendorContact: string;
  auditorName: string;
  template: ChecklistTemplate;
  scheduledAt: string | null;
  submittedAt: string | null;
  responses: Array<{
    questionId: string;
    verdict: Verdict | null;
    comment: string | null;
    source: 'tap' | 'voice';
    photoUrls: string[];
  }>;
  /** Optional final transcript shown at the end. */
  transcriptText: string | null;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingHorizontal: 36, paddingBottom: 60, fontSize: 10, fontFamily: 'Helvetica', color: '#0a0a0a' },
  header: { borderBottom: '1pt solid #d4d4d4', paddingBottom: 12, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#525252' },
  metaRow: { flexDirection: 'row', marginTop: 10, gap: 24 },
  metaCol: { flexGrow: 1 },
  metaLabel: { fontSize: 8, color: '#737373', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  metaValue: { fontSize: 10, color: '#0a0a0a' },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    border: '1pt solid #e5e5e5',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    gap: 12,
  },
  summaryItem: { flexGrow: 1 },
  summaryNum: { fontSize: 18, fontWeight: 'bold' },
  summaryLabel: { fontSize: 8, color: '#525252', textTransform: 'uppercase', marginTop: 2 },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    padding: 6,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  q: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottom: '0.5pt solid #e5e5e5',
    gap: 8,
  },
  qNum: { width: 18, color: '#737373' },
  qBody: { flexGrow: 1, flexShrink: 1 },
  qText: { fontSize: 10 },
  qComment: { fontSize: 9, color: '#525252', marginTop: 3, fontStyle: 'italic' },
  qMeta: { fontSize: 8, color: '#737373', marginTop: 3 },
  verdictPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  noVerdict: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
    color: '#737373',
    border: '1pt solid #e5e5e5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  photoRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  photo: { width: 60, height: 60 },
  transcript: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#fafafa',
    border: '1pt solid #e5e5e5',
    borderRadius: 4,
  },
  transcriptText: { fontSize: 9, color: '#404040', lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#737373',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.5pt solid #e5e5e5',
    paddingTop: 6,
  },
});

function fmt(d: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export function AuditReport({ data }: { data: AuditReportData }) {
  const responseByQ = new Map(data.responses.map((r) => [r.questionId, r] as const));
  const sections = [...data.template.sections].sort((a, b) => a.order - b.order);
  const totalQs = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const counts: Record<Verdict | 'unanswered', number> = {
    majorly_comply: 0,
    partial_comply: 0,
    not_complied: 0,
    na: 0,
    unanswered: 0,
  };
  for (const s of sections) {
    for (const q of s.questions) {
      const v = responseByQ.get(q.id)?.verdict;
      if (v) counts[v]++;
      else counts.unanswered++;
    }
  }

  return (
    <Document title={`Audit ${data.vendorName} ${data.template.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.template.name}</Text>
          <Text style={styles.subtitle}>
            {data.vendorName} · {data.template.industry.toUpperCase()} · v{data.template.version}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Vendor address</Text>
              <Text style={styles.metaValue}>{data.vendorAddress || '—'}</Text>
              <Text style={styles.metaValue}>{data.vendorContact || ''}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Auditor</Text>
              <Text style={styles.metaValue}>{data.auditorName}</Text>
              <Text style={styles.metaLabel}>Submitted</Text>
              <Text style={styles.metaValue}>{fmt(data.submittedAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: VERDICT_COLORS.majorly_comply }]}>
              {counts.majorly_comply}
            </Text>
            <Text style={styles.summaryLabel}>Comply</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: VERDICT_COLORS.partial_comply }]}>
              {counts.partial_comply}
            </Text>
            <Text style={styles.summaryLabel}>Partial</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: VERDICT_COLORS.not_complied }]}>
              {counts.not_complied}
            </Text>
            <Text style={styles.summaryLabel}>Not</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: VERDICT_COLORS.na }]}>{counts.na}</Text>
            <Text style={styles.summaryLabel}>N/A</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>
              {totalQs - counts.unanswered}/{totalQs}
            </Text>
            <Text style={styles.summaryLabel}>Answered</Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.id} wrap>
            <Text style={styles.sectionHeader}>{section.name}</Text>
            {[...section.questions]
              .sort((a, b) => a.order - b.order)
              .map((q, idx) => {
                const r = responseByQ.get(q.id);
                const v = r?.verdict ?? null;
                return (
                  <View key={q.id} style={styles.q} wrap={false}>
                    <Text style={styles.qNum}>{idx + 1}.</Text>
                    <View style={styles.qBody}>
                      <Text style={styles.qText}>{q.text}</Text>
                      {r?.comment ? (
                        <Text style={styles.qComment}>“{r.comment}”</Text>
                      ) : null}
                      {r?.source === 'voice' ? (
                        <Text style={styles.qMeta}>via voice</Text>
                      ) : null}
                      {r && r.photoUrls.length > 0 ? (
                        <View style={styles.photoRow}>
                          {r.photoUrls.slice(0, 4).map((url, i) => (
                            <Image key={i} src={url} style={styles.photo} />
                          ))}
                        </View>
                      ) : null}
                    </View>
                    {v ? (
                      <Text style={[styles.verdictPill, { backgroundColor: VERDICT_COLORS[v] }]}>
                        {VERDICT_LABELS[v]}
                      </Text>
                    ) : (
                      <Text style={styles.noVerdict}>UNANSWERED</Text>
                    )}
                  </View>
                );
              })}
          </View>
        ))}

        {data.transcriptText ? (
          <View style={styles.transcript} wrap>
            <Text style={styles.metaLabel}>Voice transcript</Text>
            <Text style={styles.transcriptText}>{data.transcriptText}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Audit ID {data.auditId}</Text>
          <Text>Generated {fmt(data.generatedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}
