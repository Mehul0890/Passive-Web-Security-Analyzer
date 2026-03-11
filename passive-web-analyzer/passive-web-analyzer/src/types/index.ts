export type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info';
export type Confidence = 'high' | 'medium' | 'low';
export type DataStatus = 'complete' | 'partial' | 'restricted' | 'blocked' | 'timed_out' | 'unavailable' | 'error';
export type RiskLabel = 'Critical' | 'High' | 'Moderate' | 'Low' | 'Minimal';
export type AppMode = 'learner' | 'analyst';

export interface SslInfo {
  available: boolean;
  subject?: string;
  issuer?: string;
  serialNumber?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  expired?: boolean;
  selfSigned?: boolean;
  sanEntries?: string[];
  protocol?: string;
  error?: string;
  status: DataStatus;
}

export interface HeaderEntry {
  name: string;
  value: string | null;
  present: boolean;
  severity: Severity;
  description: string;
  recommendation: string;
  impact: string;
}

export interface CookieEntry {
  name: string;
  value: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
  path: string | null;
  domain: string | null;
  expires: string | null;
  flags: string[];
  issues: string[];
}

export interface DnsRecord {
  type: string;
  values: string[];
  status: DataStatus;
}

export interface DnsInfo {
  a: DnsRecord;
  aaaa: DnsRecord;
  mx: DnsRecord;
  ns: DnsRecord;
  txt: DnsRecord;
  cname: DnsRecord;
  spfFound: boolean;
  dmarcFound: boolean;
  spfRecord?: string;
  dmarcRecord?: string;
  status: DataStatus;
}

export interface WhoisInfo {
  registrar?: string;
  createdDate?: string;
  expiresDate?: string;
  updatedDate?: string;
  nameservers?: string[];
  statuses?: string[];
  raw?: string;
  status: DataStatus;
  error?: string;
}

export interface MetadataInfo {
  title?: string;
  description?: string;
  canonical?: string;
  generator?: string;
  language?: string;
  robotsTxt: boolean | null;
  sitemapXml: boolean | null;
  robotsContent?: string;
  ogTitle?: string;
  ogDescription?: string;
  status: DataStatus;
}

export interface RedirectHop {
  url: string;
  statusCode: number;
  location?: string;
}

export interface RedirectInfo {
  chain: RedirectHop[];
  finalUrl: string;
  httpToHttps: boolean;
  excessiveRedirects: boolean;
  status: DataStatus;
}

export interface Finding {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  confidence: Confidence;
  evidence: string;
  technicalDetails: string;
  learnerExplanation: string;
  analystNote: string;
  recommendation: string;
}

export interface RiskScore {
  score: number;
  label: RiskLabel;
  rationale: string;
  breakdown: { category: string; deduction: number; reason: string }[];
}

export interface Recommendation {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'moderate' | 'low';
  reason: string;
  benefit: string;
  learnerNote: string;
  findingRef?: string;
}

export interface OverviewInfo {
  inputUrl: string;
  normalizedUrl: string;
  hostname: string;
  finalUrl: string;
  ipAddress?: string;
  httpStatus?: number;
  responseTimeMs?: number;
  contentType?: string;
  serverHeader?: string;
  timestamp: string;
  durationMs: number;
  collectionStatus: DataStatus;
}

export interface ScanReport {
  id: string;
  timestamp: string;
  overview: OverviewInfo;
  ssl: SslInfo;
  headers: HeaderEntry[];
  cookies: CookieEntry[];
  dns: DnsInfo;
  whois: WhoisInfo;
  metadata: MetadataInfo;
  redirects: RedirectInfo;
  findings: Finding[];
  riskScore: RiskScore;
  recommendations: Recommendation[];
  dataQuality: {
    overall: DataStatus;
    modules: Record<string, DataStatus>;
  };
}

export interface HistoryEntry {
  id: string;
  target: string;
  timestamp: string;
  score: number;
  label: RiskLabel;
  summary: string;
  report: ScanReport;
}

export interface BatchTarget {
  url: string;
  status: 'pending' | 'scanning' | 'done' | 'error';
  report?: ScanReport;
  error?: string;
}

export type ScanProgress =
  | 'idle'
  | 'validating'
  | 'resolving'
  | 'fetching_headers'
  | 'fetching_ssl'
  | 'fetching_dns'
  | 'fetching_whois'
  | 'fetching_metadata'
  | 'building_findings'
  | 'done'
  | 'error';
