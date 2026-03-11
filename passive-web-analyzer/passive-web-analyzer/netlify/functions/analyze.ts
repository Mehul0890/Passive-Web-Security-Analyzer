import type { Handler, HandlerEvent } from '@netlify/functions';
import * as https from 'https';
import * as http from 'http';
import * as tls from 'tls';
import * as dns from 'dns';
import { URL } from 'url';
import { promisify } from 'util';

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveNs = promisify(dns.resolveNs);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveCname = promisify(dns.resolveCname);

const TIMEOUT_MS = 12000;

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u;
  }
  try {
    const parsed = new URL(u);
    return parsed.href;
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }
}

interface FetchResult {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
  finalUrl: string;
  redirectChain: Array<{ url: string; statusCode: number; location?: string }>;
  responseTimeMs: number;
  error?: string;
}

function fetchWithRedirects(
  startUrl: string,
  maxRedirects = 8
): Promise<FetchResult> {
  return new Promise((resolve) => {
    const chain: Array<{ url: string; statusCode: number; location?: string }> = [];
    const startTime = Date.now();

    function doRequest(currentUrl: string, redirectCount: number) {
      if (redirectCount > maxRedirects) {
        resolve({
          statusCode: 0,
          headers: {},
          body: '',
          finalUrl: currentUrl,
          redirectChain: chain,
          responseTimeMs: Date.now() - startTime,
          error: 'Too many redirects',
        });
        return;
      }

      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch {
        resolve({
          statusCode: 0,
          headers: {},
          body: '',
          finalUrl: currentUrl,
          redirectChain: chain,
          responseTimeMs: Date.now() - startTime,
          error: 'Invalid URL during redirect',
        });
        return;
      }

      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;
      const port = parsed.port
        ? parseInt(parsed.port)
        : isHttps
        ? 443
        : 80;

      const options = {
        hostname: parsed.hostname,
        port,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; PassiveWebAnalyzerBot/1.0; +https://passive-analyzer.netlify.app)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        rejectUnauthorized: false,
        timeout: TIMEOUT_MS,
      };

      const req = lib.request(options, (res) => {
        const statusCode = res.statusCode ?? 0;
        const headers: Record<string, string | string[]> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v !== undefined) headers[k.toLowerCase()] = v as string | string[];
        }

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          headers['location']
        ) {
          const loc = Array.isArray(headers['location'])
            ? headers['location'][0]
            : headers['location'];
          chain.push({ url: currentUrl, statusCode, location: loc });
          let nextUrl = loc;
          if (nextUrl.startsWith('/')) {
            nextUrl = `${parsed.protocol}//${parsed.host}${nextUrl}`;
          } else if (!nextUrl.startsWith('http')) {
            nextUrl = `${parsed.protocol}//${parsed.host}/${nextUrl}`;
          }
          res.destroy();
          doRequest(nextUrl, redirectCount + 1);
          return;
        }

        chain.push({ url: currentUrl, statusCode });

        let body = '';
        res.setEncoding('utf8');
        let size = 0;
        res.on('data', (chunk: string) => {
          size += chunk.length;
          if (size < 200000) body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode,
            headers,
            body,
            finalUrl: currentUrl,
            redirectChain: chain,
            responseTimeMs: Date.now() - startTime,
          });
        });
        res.on('error', () => {
          resolve({
            statusCode,
            headers,
            body,
            finalUrl: currentUrl,
            redirectChain: chain,
            responseTimeMs: Date.now() - startTime,
            error: 'Response stream error',
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 0,
          headers: {},
          body: '',
          finalUrl: currentUrl,
          redirectChain: chain,
          responseTimeMs: Date.now() - startTime,
          error: 'Request timed out',
        });
      });

      req.on('error', (err) => {
        resolve({
          statusCode: 0,
          headers: {},
          body: '',
          finalUrl: currentUrl,
          redirectChain: chain,
          responseTimeMs: Date.now() - startTime,
          error: err.message,
        });
      });

      req.end();
    }

    doRequest(startUrl, 0);
  });
}

function getSslCert(
  hostname: string,
  port = 443
): Promise<{
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  serialNumber?: string;
  subjectAltName?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port, rejectUnauthorized: false, servername: hostname },
      () => {
        const cert = socket.getPeerCertificate(false);
        socket.destroy();
        if (!cert || !cert.subject) {
          resolve({ error: 'No certificate returned' });
          return;
        }
        resolve({
          subject:
            cert.subject?.CN || Object.values(cert.subject || {}).join(', '),
          issuer:
            cert.issuer?.CN || Object.values(cert.issuer || {}).join(', '),
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          serialNumber: cert.serialNumber,
          subjectAltName: cert.subjectaltname,
        });
      }
    );
    socket.on('error', (err) => resolve({ error: err.message }));
    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve({ error: 'TLS connection timed out' });
    });
  });
}

async function checkUrl(hostname: string, path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname,
      path,
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PassiveWebAnalyzerBot/1.0)',
      },
      rejectUnauthorized: false,
      timeout: 5000,
    };
    const req = https.request(options, (res) => {
      resolve((res.statusCode ?? 0) < 500);
      res.destroy();
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function parseSetCookieHeader(raw: string): {
  name: string;
  value: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
  path: string | null;
  domain: string | null;
  expires: string | null;
} {
  const parts = raw.split(';').map((p) => p.trim());
  const [nameVal, ...attrs] = parts;
  const eqIdx = nameVal.indexOf('=');
  const name = eqIdx >= 0 ? nameVal.slice(0, eqIdx) : nameVal;
  const value = eqIdx >= 0 ? nameVal.slice(eqIdx + 1) : '';

  let secure = false;
  let httpOnly = false;
  let sameSite: string | null = null;
  let path: string | null = null;
  let domain: string | null = null;
  let expires: string | null = null;

  for (const attr of attrs) {
    const lower = attr.toLowerCase();
    if (lower === 'secure') secure = true;
    else if (lower === 'httponly') httpOnly = true;
    else if (lower.startsWith('samesite='))
      sameSite = attr.split('=')[1]?.trim() ?? null;
    else if (lower.startsWith('path='))
      path = attr.split('=')[1]?.trim() ?? null;
    else if (lower.startsWith('domain='))
      domain = attr.split('=')[1]?.trim() ?? null;
    else if (lower.startsWith('expires='))
      expires = attr.split('=').slice(1).join('=').trim();
  }
  return { name, value, secure, httpOnly, sameSite, path, domain, expires };
}

function extractMeta(
  html: string
): {
  title?: string;
  description?: string;
  canonical?: string;
  generator?: string;
  language?: string;
  ogTitle?: string;
  ogDescription?: string;
} {
  const get = (pattern: RegExp): string | undefined => {
    const m = html.match(pattern);
    return m ? m[1]?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : undefined;
  };

  return {
    title: get(/<title[^>]*>([^<]{1,300})<\/title>/i),
    description:
      get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i) ||
      get(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i),
    canonical: get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']{1,500})["']/i),
    generator:
      get(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']{1,200})["']/i) ||
      get(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+name=["']generator["']/i),
    language:
      get(/<html[^>]+lang=["']([^"']{1,20})["']/i),
    ogTitle: get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i),
    ogDescription: get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i),
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let inputUrl = '';
  try {
    const body = JSON.parse(event.body || '{}');
    inputUrl = body.url || '';
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  if (!inputUrl) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'URL is required' }),
    };
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(inputUrl);
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: (e as Error).message }),
    };
  }

  const parsedUrl = new URL(normalizedUrl);
  const hostname = parsedUrl.hostname;

  // ─── Parallel data collection ───────────────────────────────────────────────
  const [fetchResult, sslResult, dnsResults, robotsExists, sitemapExists] =
    await Promise.allSettled([
      fetchWithRedirects(normalizedUrl),
      getSslCert(hostname),
      Promise.allSettled([
        dnsResolve4(hostname).catch(() => null),
        dnsResolve6(hostname).catch(() => null),
        dnsResolveMx(hostname).catch(() => null),
        dnsResolveNs(hostname).catch(() => null),
        dnsResolveTxt(hostname).catch(() => null),
        dnsResolveCname(hostname).catch(() => null),
      ]),
      checkUrl(hostname, '/robots.txt'),
      checkUrl(hostname, '/sitemap.xml'),
    ]);

  // ─── Process HTTP fetch ──────────────────────────────────────────────────────
  const fetch =
    fetchResult.status === 'fulfilled' ? fetchResult.value : null;
  const fetchError =
    fetchResult.status === 'rejected'
      ? (fetchResult.reason as Error).message
      : fetch?.error;

  // ─── Process SSL ─────────────────────────────────────────────────────────────
  const ssl = sslResult.status === 'fulfilled' ? sslResult.value : null;

  const sslInfo = (() => {
    if (parsedUrl.protocol !== 'https:' && (!fetch || !fetch.finalUrl.startsWith('https:'))) {
      return { available: false, status: 'complete' as const };
    }
    if (!ssl || ssl.error) {
      return {
        available: parsedUrl.protocol === 'https:',
        error: ssl?.error || 'Could not retrieve certificate',
        status: 'error' as const,
      };
    }

    let daysRemaining: number | undefined;
    let expired = false;
    if (ssl.validTo) {
      const expiry = new Date(ssl.validTo);
      const now = new Date();
      daysRemaining = Math.floor((expiry.getTime() - now.getTime()) / 86400000);
      expired = daysRemaining < 0;
    }

    const sanEntries = ssl.subjectAltName
      ? ssl.subjectAltName.split(',').map((s) => s.trim().replace(/^DNS:/, ''))
      : undefined;

    const selfSigned = ssl.subject === ssl.issuer ||
      !!(ssl.issuer && ssl.issuer.toLowerCase() === ssl.subject?.toLowerCase());

    return {
      available: true,
      subject: ssl.subject,
      issuer: ssl.issuer,
      serialNumber: ssl.serialNumber,
      validFrom: ssl.validFrom,
      validTo: ssl.validTo,
      daysRemaining,
      expired,
      selfSigned,
      sanEntries,
      status: 'complete' as const,
    };
  })();

  // ─── Process DNS ─────────────────────────────────────────────────────────────
  const dnsRaw =
    dnsResults.status === 'fulfilled'
      ? dnsResults.value
      : Array(6).fill({ status: 'rejected', reason: 'DNS resolution failed' });

  const getRecords = (settled: PromiseSettledResult<unknown>, transform?: (v: unknown) => string[]): { values: string[]; status: 'complete' | 'unavailable' | 'error' } => {
    if (settled.status === 'fulfilled' && settled.value !== null) {
      const raw = settled.value as unknown;
      let values: string[] = [];
      if (transform) {
        values = transform(raw);
      } else if (Array.isArray(raw)) {
        values = raw.flatMap((r) => (Array.isArray(r) ? r : [String(r)]));
      }
      return { values, status: 'complete' };
    }
    return { values: [], status: settled.status === 'rejected' ? 'unavailable' : 'error' };
  };

  const aRec = getRecords(dnsRaw[0] as PromiseSettledResult<unknown>);
  const aaaaRec = getRecords(dnsRaw[1] as PromiseSettledResult<unknown>);
  const mxRec = getRecords(dnsRaw[2] as PromiseSettledResult<unknown>, (v) =>
    (v as Array<{ priority: number; exchange: string }>).map((r) => `${r.priority} ${r.exchange}`)
  );
  const nsRec = getRecords(dnsRaw[3] as PromiseSettledResult<unknown>);
  const txtRec = getRecords(dnsRaw[4] as PromiseSettledResult<unknown>, (v) =>
    (v as string[][]).map((arr) => arr.join(''))
  );
  const cnameRec = getRecords(dnsRaw[5] as PromiseSettledResult<unknown>);

  const allTxt = txtRec.values;
  const spfRecord = allTxt.find((t) => t.toLowerCase().startsWith('v=spf1'));
  const dmarcRecord = allTxt.find((t) => t.toLowerCase().startsWith('v=dmarc1'));

  const dnsInfo = {
    a: { type: 'A', values: aRec.values, status: aRec.status },
    aaaa: { type: 'AAAA', values: aaaaRec.values, status: aaaaRec.status },
    mx: { type: 'MX', values: mxRec.values, status: mxRec.status },
    ns: { type: 'NS', values: nsRec.values, status: nsRec.status },
    txt: { type: 'TXT', values: txtRec.values, status: txtRec.status },
    cname: { type: 'CNAME', values: cnameRec.values, status: cnameRec.status },
    spfFound: !!spfRecord,
    dmarcFound: !!dmarcRecord,
    spfRecord,
    dmarcRecord,
    status: aRec.status === 'complete' ? 'complete' : 'partial',
  };

  // ─── Process Headers ─────────────────────────────────────────────────────────
  const responseHeaders = fetch?.headers || {};

  const SECURITY_HEADERS = [
    {
      name: 'Strict-Transport-Security',
      key: 'strict-transport-security',
      severity: 'high' as const,
      description: 'Enforces HTTPS connections and prevents protocol downgrade attacks.',
      recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
      impact: 'Without HSTS, attackers can intercept unencrypted connections via man-in-the-middle attacks.',
    },
    {
      name: 'Content-Security-Policy',
      key: 'content-security-policy',
      severity: 'high' as const,
      description: 'Controls which resources can be loaded, preventing XSS and data injection attacks.',
      recommendation: "Define a strict CSP policy: Content-Security-Policy: default-src 'self'; script-src 'self'",
      impact: 'Missing CSP allows attackers to inject and execute malicious scripts.',
    },
    {
      name: 'X-Frame-Options',
      key: 'x-frame-options',
      severity: 'moderate' as const,
      description: 'Prevents your site from being embedded in iframes, blocking clickjacking attacks.',
      recommendation: 'Add: X-Frame-Options: DENY or SAMEORIGIN',
      impact: 'Without this, attackers can embed your site invisibly to trick users into unintended actions.',
    },
    {
      name: 'X-Content-Type-Options',
      key: 'x-content-type-options',
      severity: 'moderate' as const,
      description: 'Prevents browsers from MIME-sniffing responses away from the declared content type.',
      recommendation: 'Add: X-Content-Type-Options: nosniff',
      impact: 'MIME sniffing can allow attackers to execute malicious content disguised as safe files.',
    },
    {
      name: 'Referrer-Policy',
      key: 'referrer-policy',
      severity: 'low' as const,
      description: 'Controls how much referrer information is included in requests.',
      recommendation: 'Add: Referrer-Policy: strict-origin-when-cross-origin',
      impact: 'Without this, sensitive URL fragments can leak to third-party services.',
    },
    {
      name: 'Permissions-Policy',
      key: 'permissions-policy',
      severity: 'low' as const,
      description: 'Controls browser features and APIs available to the page.',
      recommendation: "Add: Permissions-Policy: geolocation=(), microphone=(), camera=()",
      impact: "Uncontrolled access to browser features may be exploited by malicious scripts.",
    },
    {
      name: 'Cross-Origin-Opener-Policy',
      key: 'cross-origin-opener-policy',
      severity: 'low' as const,
      description: 'Isolates the browsing context to prevent cross-origin attacks.',
      recommendation: 'Add: Cross-Origin-Opener-Policy: same-origin',
      impact: 'Without COOP, malicious pages may access your window object.',
    },
    {
      name: 'Cross-Origin-Resource-Policy',
      key: 'cross-origin-resource-policy',
      severity: 'low' as const,
      description: 'Restricts cross-origin resource loading.',
      recommendation: 'Add: Cross-Origin-Resource-Policy: same-origin',
      impact: 'Without CORP, attackers may load your resources in unauthorized contexts.',
    },
    {
      name: 'Cross-Origin-Embedder-Policy',
      key: 'cross-origin-embedder-policy',
      severity: 'low' as const,
      description: 'Ensures all cross-origin resources have opted in to being embedded.',
      recommendation: 'Add: Cross-Origin-Embedder-Policy: require-corp',
      impact: 'Required for isolating your page and enabling high-resolution timer APIs safely.',
    },
  ];

  const headerEntries = SECURITY_HEADERS.map((h) => {
    const rawVal = responseHeaders[h.key];
    const value = rawVal
      ? Array.isArray(rawVal)
        ? rawVal.join(', ')
        : rawVal
      : null;
    return {
      name: h.name,
      value,
      present: value !== null,
      severity: value ? ('info' as const) : h.severity,
      description: h.description,
      recommendation: h.recommendation,
      impact: h.impact,
    };
  });

  // ─── Process Cookies ─────────────────────────────────────────────────────────
  const rawSetCookie = responseHeaders['set-cookie'];
  const setCookieHeaders: string[] = rawSetCookie
    ? Array.isArray(rawSetCookie)
      ? rawSetCookie
      : [rawSetCookie]
    : [];

  const cookieEntries = setCookieHeaders.map((raw) => {
    const parsed = parseSetCookieHeader(raw);
    const issues: string[] = [];
    const flags: string[] = [];

    if (!parsed.secure) issues.push('Missing Secure flag — cookie can be sent over HTTP');
    if (!parsed.httpOnly) issues.push('Missing HttpOnly flag — accessible via JavaScript');
    if (!parsed.sameSite) issues.push('Missing SameSite attribute — vulnerable to CSRF');
    else if (parsed.sameSite.toLowerCase() === 'none' && !parsed.secure)
      issues.push('SameSite=None requires Secure flag');

    if (parsed.secure) flags.push('Secure');
    if (parsed.httpOnly) flags.push('HttpOnly');
    if (parsed.sameSite) flags.push(`SameSite=${parsed.sameSite}`);

    return { ...parsed, flags, issues };
  });

  // ─── Process Metadata ────────────────────────────────────────────────────────
  const meta = fetch?.body ? extractMeta(fetch.body) : {};
  const robotsTxtExists = robotsExists.status === 'fulfilled' ? robotsExists.value : null;
  const sitemapXmlExists = sitemapExists.status === 'fulfilled' ? sitemapExists.value : null;

  const metadataInfo = {
    ...meta,
    robotsTxt: robotsTxtExists,
    sitemapXml: sitemapXmlExists,
    status: fetch ? 'complete' : 'unavailable',
  };

  // ─── Redirect chain ──────────────────────────────────────────────────────────
  const chain = fetch?.redirectChain || [];
  const hasHttpToHttps =
    chain.length > 0 &&
    chain[0].url.startsWith('http://') &&
    (chain[chain.length - 1].url.startsWith('https://') ||
      (fetch?.finalUrl || '').startsWith('https://'));

  const redirectInfo = {
    chain: chain.slice(0, -1).map((h) => ({
      url: h.url,
      statusCode: h.statusCode,
      location: h.location,
    })),
    finalUrl: fetch?.finalUrl || normalizedUrl,
    httpToHttps: hasHttpToHttps,
    excessiveRedirects: chain.length > 4,
    status: fetch ? 'complete' : 'unavailable',
  };

  // ─── Overview ────────────────────────────────────────────────────────────────
  const ipAddress = aRec.values[0] || undefined;
  const serverHeader = responseHeaders['server'];

  const overviewInfo = {
    inputUrl,
    normalizedUrl,
    hostname,
    finalUrl: fetch?.finalUrl || normalizedUrl,
    ipAddress,
    httpStatus: fetch?.statusCode,
    responseTimeMs: fetch?.responseTimeMs,
    contentType: (responseHeaders['content-type'] as string)?.split(';')[0]?.trim(),
    serverHeader: Array.isArray(serverHeader) ? serverHeader[0] : serverHeader,
    timestamp: new Date().toISOString(),
    durationMs: fetch?.responseTimeMs || 0,
    collectionStatus: fetchError ? 'error' : 'complete',
  };

  // ─── Findings Engine ─────────────────────────────────────────────────────────
  const findings: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    confidence: string;
    evidence: string;
    technicalDetails: string;
    learnerExplanation: string;
    analystNote: string;
    recommendation: string;
  }> = [];

  let findingIdx = 0;
  const fid = () => `F${String(++findingIdx).padStart(3, '0')}`;

  // HTTPS check
  if (!sslInfo.available || !fetch?.finalUrl.startsWith('https://')) {
    findings.push({
      id: fid(),
      title: 'Site Not Served Over HTTPS',
      category: 'Transport Security',
      severity: 'critical',
      confidence: 'high',
      evidence: `Final URL: ${fetch?.finalUrl || normalizedUrl}`,
      technicalDetails: 'The site is not using TLS encryption. All data transmitted is in plaintext.',
      learnerExplanation: 'HTTPS encrypts data between your browser and the server. Without it, anyone on the same network can see and modify the data.',
      analystNote: 'No TLS observed on final URL. Certificate retrieval was not attempted or failed.',
      recommendation: 'Obtain a TLS certificate (free via Let\'s Encrypt) and redirect all HTTP traffic to HTTPS.',
    });
  }

  // SSL expiry check
  if (sslInfo.available && sslInfo.daysRemaining !== undefined) {
    if (sslInfo.expired) {
      findings.push({
        id: fid(),
        title: 'SSL Certificate Is Expired',
        category: 'SSL/TLS',
        severity: 'critical',
        confidence: 'high',
        evidence: `Valid to: ${sslInfo.validTo} (${Math.abs(sslInfo.daysRemaining)} days ago)`,
        technicalDetails: `Certificate expired on ${sslInfo.validTo}. Browsers will show security warnings.`,
        learnerExplanation: 'An expired SSL certificate means the site\'s identity cannot be verified. Browsers show scary warnings to users.',
        analystNote: 'Certificate validity period has lapsed. Immediate renewal required.',
        recommendation: 'Renew the TLS certificate immediately. Use automation (e.g., certbot) to prevent future expiry.',
      });
    } else if (sslInfo.daysRemaining < 14) {
      findings.push({
        id: fid(),
        title: `SSL Certificate Expiring in ${sslInfo.daysRemaining} Days`,
        category: 'SSL/TLS',
        severity: 'high',
        confidence: 'high',
        evidence: `Valid to: ${sslInfo.validTo} (${sslInfo.daysRemaining} days remaining)`,
        technicalDetails: 'Certificate expiry is imminent. Failure to renew will break HTTPS.',
        learnerExplanation: 'The SSL certificate that keeps this site secure is about to expire. Users will see warnings soon.',
        analystNote: 'Certificate expiry within 14-day critical window.',
        recommendation: 'Renew the TLS certificate now before it expires.',
      });
    } else if (sslInfo.daysRemaining < 30) {
      findings.push({
        id: fid(),
        title: `SSL Certificate Expiring in ${sslInfo.daysRemaining} Days`,
        category: 'SSL/TLS',
        severity: 'moderate',
        confidence: 'high',
        evidence: `Valid to: ${sslInfo.validTo} (${sslInfo.daysRemaining} days remaining)`,
        technicalDetails: 'Certificate expiry within 30-day warning window.',
        learnerExplanation: 'The site\'s SSL certificate will expire soon. This should be renewed before it causes disruption.',
        analystNote: 'Proactive renewal recommended within 30-day window.',
        recommendation: 'Schedule certificate renewal now.',
      });
    }
  }

  // Self-signed cert
  if (sslInfo.available && sslInfo.selfSigned) {
    findings.push({
      id: fid(),
      title: 'Self-Signed SSL Certificate Detected',
      category: 'SSL/TLS',
      severity: 'high',
      confidence: 'medium',
      evidence: `Issuer: ${sslInfo.issuer}, Subject: ${sslInfo.subject}`,
      technicalDetails: 'The certificate issuer matches the subject, suggesting a self-signed certificate not trusted by browsers.',
      learnerExplanation: 'A self-signed certificate is like creating your own ID card — no trusted authority vouches for it. Browsers warn users.',
      analystNote: 'Issuer/subject match detected. Browser trust chains not established.',
      recommendation: 'Replace with a CA-signed certificate from Let\'s Encrypt or another trusted CA.',
    });
  }

  // Missing security headers
  for (const h of headerEntries) {
    if (!h.present) {
      findings.push({
        id: fid(),
        title: `Missing Security Header: ${h.name}`,
        category: 'Security Headers',
        severity: h.severity,
        confidence: 'high',
        evidence: `Header "${h.name}" not present in HTTP response`,
        technicalDetails: `The ${h.name} header was not found in the server response. ${h.description}`,
        learnerExplanation: `${h.description} Without this, ${h.impact}`,
        analystNote: `Header absent from response. ${h.impact}`,
        recommendation: h.recommendation,
      });
    }
  }

  // Cookie issues
  for (const cookie of cookieEntries) {
    for (const issue of cookie.issues) {
      findings.push({
        id: fid(),
        title: `Cookie Issue: ${cookie.name} — ${issue.split('—')[0].trim()}`,
        category: 'Cookies',
        severity: issue.includes('Secure') ? 'moderate' : issue.includes('HttpOnly') ? 'moderate' : 'low',
        confidence: 'high',
        evidence: `Cookie: ${cookie.name}; Flags: ${cookie.flags.join(', ') || 'none'}`,
        technicalDetails: `Cookie "${cookie.name}" has misconfiguration: ${issue}`,
        learnerExplanation: issue,
        analystNote: `Cookie attribute deficiency detected on "${cookie.name}".`,
        recommendation: `Set appropriate cookie attributes: Secure; HttpOnly; SameSite=Strict or Lax`,
      });
    }
  }

  // Missing SPF
  if (!dnsInfo.spfFound && mxRec.values.length > 0) {
    findings.push({
      id: fid(),
      title: 'Missing SPF Record',
      category: 'DNS / Email Security',
      severity: 'moderate',
      confidence: 'high',
      evidence: 'No TXT record starting with "v=spf1" found',
      technicalDetails: 'SPF (Sender Policy Framework) record not found. Mail servers accept SPF as an email authentication mechanism.',
      learnerExplanation: 'Without SPF, anyone can send emails pretending to be from your domain. This enables phishing attacks.',
      analystNote: 'SPF TXT record absent. Domain has MX records, making this a higher-risk omission.',
      recommendation: 'Add a TXT record: v=spf1 include:_spf.yourmailprovider.com ~all',
    });
  }

  // Missing DMARC
  if (!dnsInfo.dmarcFound) {
    findings.push({
      id: fid(),
      title: 'Missing DMARC Record',
      category: 'DNS / Email Security',
      severity: 'moderate',
      confidence: 'high',
      evidence: 'No TXT record starting with "v=DMARC1" found',
      technicalDetails: 'DMARC (Domain-based Message Authentication, Reporting and Conformance) record not configured.',
      learnerExplanation: 'DMARC tells email servers what to do when an email fails authentication — without it, fake emails from your domain may be delivered.',
      analystNote: 'DMARC TXT record absent. No policy enforcement for domain spoofing.',
      recommendation: 'Add a TXT record at _dmarc.yourdomain.com: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
    });
  }

  // Missing robots.txt
  if (robotsTxtExists === false) {
    findings.push({
      id: fid(),
      title: 'robots.txt Not Found',
      category: 'Metadata',
      severity: 'info',
      confidence: 'high',
      evidence: 'GET /robots.txt returned non-2xx or unavailable',
      technicalDetails: 'No robots.txt file was found at the expected location.',
      learnerExplanation: 'robots.txt tells search engine crawlers which pages to index. Its absence is not a security issue but is a best practice.',
      analystNote: 'robots.txt absent. No crawler directives present.',
      recommendation: 'Create a robots.txt file to control search engine crawling.',
    });
  }

  // Missing sitemap
  if (sitemapXmlExists === false) {
    findings.push({
      id: fid(),
      title: 'sitemap.xml Not Found',
      category: 'Metadata',
      severity: 'info',
      confidence: 'high',
      evidence: 'GET /sitemap.xml returned non-2xx or unavailable',
      technicalDetails: 'No XML sitemap found at the standard location.',
      learnerExplanation: 'A sitemap helps search engines discover and index your pages efficiently.',
      analystNote: 'sitemap.xml absent.',
      recommendation: 'Create an XML sitemap and submit it to search consoles.',
    });
  }

  // Excessive redirects
  if (redirectInfo.excessiveRedirects) {
    findings.push({
      id: fid(),
      title: 'Excessive Redirect Chain Detected',
      category: 'Redirects',
      severity: 'low',
      confidence: 'high',
      evidence: `${chain.length} redirect hops observed`,
      technicalDetails: `More than 4 redirects in chain: ${chain.map((c) => c.url).join(' → ')}`,
      learnerExplanation: 'Too many redirects slow down page load times and can confuse browsers and crawlers.',
      analystNote: `Redirect depth: ${chain.length}. Review chain for consolidation opportunities.`,
      recommendation: 'Consolidate redirect chains to a maximum of 2 hops.',
    });
  }

  // HTTP→HTTPS missing
  if (normalizedUrl.startsWith('http://') && !hasHttpToHttps) {
    findings.push({
      id: fid(),
      title: 'No HTTP to HTTPS Redirect',
      category: 'Transport Security',
      severity: 'high',
      confidence: 'high',
      evidence: `Initial URL ${normalizedUrl} did not redirect to HTTPS`,
      technicalDetails: 'Site accepts HTTP requests without upgrading to HTTPS.',
      learnerExplanation: 'Users who type the URL without https:// will get an unencrypted connection and no warning.',
      analystNote: 'HTTP→HTTPS redirect absent. Plaintext connections accepted.',
      recommendation: 'Configure server to redirect all HTTP requests to HTTPS with 301 status.',
    });
  }

  // ─── Risk Scoring ─────────────────────────────────────────────────────────────
  let score = 100;
  const breakdown: Array<{ category: string; deduction: number; reason: string }> = [];

  const criticalFindings = findings.filter((f) => f.severity === 'critical');
  const highFindings = findings.filter((f) => f.severity === 'high');
  const moderateFindings = findings.filter((f) => f.severity === 'moderate');
  const lowFindings = findings.filter((f) => f.severity === 'low');

  for (const f of criticalFindings) {
    const ded = 25;
    score -= ded;
    breakdown.push({ category: f.category, deduction: ded, reason: f.title });
  }
  for (const f of highFindings) {
    const ded = 12;
    score -= ded;
    breakdown.push({ category: f.category, deduction: ded, reason: f.title });
  }
  for (const f of moderateFindings) {
    const ded = 6;
    score -= ded;
    breakdown.push({ category: f.category, deduction: ded, reason: f.title });
  }
  for (const f of lowFindings) {
    const ded = 2;
    score -= ded;
    breakdown.push({ category: f.category, deduction: ded, reason: f.title });
  }

  score = Math.max(0, score);

  const label =
    score >= 90
      ? 'Minimal'
      : score >= 70
      ? 'Low'
      : score >= 50
      ? 'Moderate'
      : score >= 30
      ? 'High'
      : 'Critical';

  const riskScore = {
    score,
    label,
    rationale: `Score of ${score}/100 based on ${findings.length} findings: ${criticalFindings.length} critical, ${highFindings.length} high, ${moderateFindings.length} moderate, ${lowFindings.length} low.`,
    breakdown,
  };

  // ─── Recommendations ──────────────────────────────────────────────────────────
  const recommendations = findings
    .filter((f) => f.severity !== 'info')
    .map((f, i) => ({
      id: `R${String(i + 1).padStart(3, '0')}`,
      title: f.recommendation.split(':')[0] || f.title,
      priority: f.severity as 'critical' | 'high' | 'moderate' | 'low',
      reason: f.technicalDetails,
      benefit: `Resolving "${f.title}" will improve security posture and reduce ${f.category} risk.`,
      learnerNote: f.learnerExplanation,
      findingRef: f.id,
    }));

  // ─── Data Quality ─────────────────────────────────────────────────────────────
  const modules: Record<string, string> = {
    http: fetchError ? 'error' : 'complete',
    ssl: sslInfo.status,
    dns: dnsInfo.status,
    metadata: metadataInfo.status,
    redirects: redirectInfo.status,
    whois: 'unavailable', // WHOIS not implemented server-side (rate limited, varied formats)
  };

  const statuses = Object.values(modules);
  const overall = statuses.every((s) => s === 'complete')
    ? 'complete'
    : statuses.some((s) => s === 'error' || s === 'timed_out')
    ? 'partial'
    : statuses.some((s) => s === 'complete')
    ? 'partial'
    : 'unavailable';

  // ─── Final Report ─────────────────────────────────────────────────────────────
  const report = {
    id: `scan_${Date.now()}`,
    timestamp: new Date().toISOString(),
    overview: overviewInfo,
    ssl: sslInfo,
    headers: headerEntries,
    cookies: cookieEntries,
    dns: dnsInfo,
    whois: { status: 'unavailable', error: 'WHOIS lookup not performed server-side.' },
    metadata: metadataInfo,
    redirects: redirectInfo,
    findings,
    riskScore,
    recommendations,
    dataQuality: { overall, modules },
  };

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  };
};
