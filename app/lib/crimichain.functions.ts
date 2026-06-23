// ─── Types ───────────────────────────────────────────────────────────────────
export type ReportStage =
  | "submitted"
  | "assigned"
  | "investigating"
  | "closed"
  | "reopened";

export type ReportCategory =
  | "pencurian"
  | "penipuan"
  | "kekerasan"
  | "narkoba"
  | "lainnya";

export interface Report {
  id: string;
  title: string;
  category: ReportCategory;
  chronology: string;
  attachment_name: string | null;
  hash: string;
  tx_id: string | null;
  explorer_url: string | null;
  stage: ReportStage;
  reporter: string;
  reporter_nik: string;
  reporter_phone: string;
  location: string;
  description: string;
  assigned_officer: any | null;
  investigation_started_at: string | null;
  closure: any | null;
  reopen: any | null;
  blockchain_tx: any | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  report_id: string;
  ts: string;
  actor: string;
  action: string;
  detail: string;
  signature?: string | null;
  explorer_url?: string | null;
  cluster?: string;
  payer?: string | null;
  memo?: string | null;
  anchored: boolean;
  anchor_error?: string | null;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const REPORTS_KEY = "crimichain_reports";
const AUDIT_KEY = "crimichain_audit";

function getReports(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveReports(reports: Report[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

function getAuditEntries(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAudit(entries: AuditEntry[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries));
}

function nextReportId(): string {
  const reports = getReports();
  if (reports.length === 0) return "RPT-0001";
  const last = Math.max(
    ...reports.map((r) => parseInt(r.id.replace("RPT-", ""), 10))
  );
  return `RPT-${String(last + 1).padStart(4, "0")}`;
}

function nextAuditId(): string {
  const entries = getAuditEntries();
  return `AUD-${String(entries.length + 1).padStart(4, "0")}`;
}

// ─── listReports ─────────────────────────────────────────────────────────────
export async function listReports(_?: { data?: { stage?: string; reporter?: string } }): Promise<Report[]> {
  const data = _?.data;
  let reports = getReports();
  if (data?.stage) reports = reports.filter((r) => r.stage === data.stage);
  if (data?.reporter) reports = reports.filter((r) => r.reporter === data.reporter);
  return reports.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ─── listAudit ───────────────────────────────────────────────────────────────
export async function listAudit(_?: { data?: { reportId?: string } }): Promise<AuditEntry[]> {
  const data = _?.data;
  let entries = getAuditEntries();
  if (data?.reportId) entries = entries.filter((e) => e.report_id === data.reportId);
  return entries.sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
  );
}

// ─── createReport ─────────────────────────────────────────────────────────────
export async function createReport(input: {
  data: {
    title: string;
    category: ReportCategory;
    chronology: string;
    attachment_name?: string;
    hash: string;
    tx_id?: string;
    explorer_url?: string;
    reporter: string;
    reporter_nik: string;
    reporter_phone: string;
    location?: string;
    blockchain_tx?: any;
  };
}): Promise<Report> {
  const { data } = input;
  const id = nextReportId();
  const now = new Date().toISOString();
  const report: Report = {
    id,
    title: data.title,
    category: data.category,
    chronology: data.chronology,
    description: data.chronology,
    location: data.location || "-",
    attachment_name: data.attachment_name || null,
    hash: data.hash,
    tx_id: data.tx_id || null,
    explorer_url: data.explorer_url || null,
    stage: "submitted",
    reporter: data.reporter,
    reporter_nik: data.reporter_nik,
    reporter_phone: data.reporter_phone,
    assigned_officer: null,
    investigation_started_at: null,
    closure: null,
    reopen: null,
    blockchain_tx: data.blockchain_tx || null,
    created_at: now,
    updated_at: now,
  };
  const reports = getReports();
  reports.push(report);
  saveReports(reports);
  return report;
}

// ─── recordAuditEvent ─────────────────────────────────────────────────────────
export async function recordAuditEvent(input: {
  data: {
    report_id: string;
    actor: string;
    action: string;
    detail: string;
    signature?: string;
    explorer_url?: string;
    cluster?: string;
    payer?: string;
    memo?: string;
    anchored?: boolean;
    anchor_error?: string;
  };
}): Promise<{ ok: boolean }> {
  const { data } = input;
  const entry: AuditEntry = {
    id: nextAuditId(),
    report_id: data.report_id,
    ts: new Date().toISOString(),
    actor: data.actor,
    action: data.action,
    detail: data.detail,
    signature: data.signature || null,
    explorer_url: data.explorer_url || null,
    cluster: data.cluster || "devnet",
    payer: data.payer || null,
    memo: data.memo || null,
    anchored: data.anchored ?? false,
    anchor_error: data.anchor_error || null,
  };
  const entries = getAuditEntries();
  entries.push(entry);
  saveAudit(entries);
  return { ok: true };
}

// ─── updateReportStage ────────────────────────────────────────────────────────
export async function updateReportStage(input: {
  data: {
    id: string;
    stage: ReportStage;
    assigned_officer?: any;
    investigation_started_at?: string;
    closure?: any;
    reopen?: any;
  };
}): Promise<Report> {
  const { data } = input;
  const reports = getReports();
  const idx = reports.findIndex((r) => r.id === data.id);
  if (idx === -1) throw new Error("Report not found: " + data.id);

  const report = { ...reports[idx], stage: data.stage, updated_at: new Date().toISOString() };
  if (data.assigned_officer !== undefined) report.assigned_officer = data.assigned_officer;
  if (data.investigation_started_at !== undefined) report.investigation_started_at = data.investigation_started_at;
  if (data.closure !== undefined) report.closure = data.closure;
  if (data.reopen !== undefined) report.reopen = data.reopen;

  reports[idx] = report;
  saveReports(reports);
  return report;
}
