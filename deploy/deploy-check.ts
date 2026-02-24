#!/usr/bin/env -S npx tsx
/**
 * pj18_apple -- Next.js Deployment Checklist (Vercel-Optimized)
 *
 * Environment variable validation, API route health check,
 * static asset optimization, SEO validation, performance budget.
 * Generates optimized vercel.json.
 *
 * Usage:
 *   npx tsx deploy/deploy-check.ts              # Full check
 *   npx tsx deploy/deploy-check.ts --env        # Env validation only
 *   npx tsx deploy/deploy-check.ts --seo        # SEO check only
 *   npx tsx deploy/deploy-check.ts --perf       # Performance budget only
 *   npx tsx deploy/deploy-check.ts --generate   # Generate vercel.json
 *
 * Runs with Node.js built-ins only (fs, path, child_process).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve, extname } from "path";
import { execSync } from "child_process";

// ── Constants ───────────────────────────────────────────────────────

const APP_ROOT = resolve(import.meta.dirname, "..", "app");
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEPLOY_DIR = resolve(import.meta.dirname);
const NEXT_DIR = join(APP_ROOT, ".next");
const PUBLIC_DIR = join(APP_ROOT, "public");
const SRC_DIR = join(APP_ROOT, "src");

// Performance budgets
const PERF_BUDGET = {
  maxBundleSizeKB: 500,        // First-load JS budget
  maxTotalBundleMB: 2,         // Total JS budget
  maxImageSizeKB: 200,         // Per-image budget
  maxTotalImagesMB: 5,         // Total images budget
  maxFirstLoadJS: 250,         // kB — Next.js first load
};

// Required environment variables
const ENV_VARS = [
  { name: "NEXT_PUBLIC_CLARITY_ID", required: false, desc: "Microsoft Clarity analytics ID" },
  { name: "NEXT_PUBLIC_API_URL", required: false, desc: "Backend API URL" },
  { name: "NODE_ENV", required: false, desc: "Node environment (auto-set by Vercel)" },
];

// API routes to check
const API_ROUTES = [
  "/api/price",
  "/api/subscribe",
  "/api/usage",
  "/api/weather",
];

// Expected pages for SEO
const PAGES = [
  "/",
  "/price",
  "/weather",
  "/calendar",
  "/consumer",
  "/producer",
  "/varieties",
  "/resources",
  "/simulation",
  "/design",
];

// ── Utilities ───────────────────────────────────────────────────────

function log(icon: string, msg: string): void {
  console.log(`  ${icon} ${msg}`);
}

function heading(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

function collectFiles(dir: string, ext?: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          if (!["node_modules", ".next", ".git"].includes(entry)) walk(full);
        } else if (!ext || extname(entry) === ext) {
          results.push(full);
        }
      } catch {
        // permission or symlink error, skip
      }
    }
  }
  walk(dir);
  return results;
}

function fileSizeKB(path: string): number {
  return statSync(path).size / 1024;
}

// ── Check 1: Environment Variables ──────────────────────────────────

function checkEnvVars(): boolean {
  heading("1. Environment Variable Validation");

  let issues = 0;

  // Check .env.local exists
  const envLocal = join(APP_ROOT, ".env.local");
  if (existsSync(envLocal)) {
    log("[OK]", ".env.local found");
  } else {
    log("[INFO]", ".env.local not found (OK for Vercel -- set in dashboard)");
  }

  for (const v of ENV_VARS) {
    const val = process.env[v.name];
    if (val) {
      log("[SET]", `${v.name} = ${val.substring(0, 8)}...`);
    } else if (v.required) {
      log("[MISSING]", `${v.name} -- ${v.desc}`);
      issues++;
    } else {
      log("[OPTIONAL]", `${v.name} -- ${v.desc}`);
    }
  }

  // Verify no secrets in source code
  const srcFiles = collectFiles(SRC_DIR, ".tsx").concat(collectFiles(SRC_DIR, ".ts"));
  let secretLeaks = 0;
  const secretPatterns = [/sk_live_/, /sk_test_/, /AKIA[A-Z0-9]{16}/, /-----BEGIN.*KEY/];

  for (const f of srcFiles) {
    const content = readFileSync(f, "utf-8");
    for (const pat of secretPatterns) {
      if (pat.test(content)) {
        log("[SECURITY]", `Potential secret in ${f}`);
        secretLeaks++;
      }
    }
  }

  if (secretLeaks === 0) {
    log("[OK]", "No hardcoded secrets detected in source");
  }

  return issues === 0 && secretLeaks === 0;
}

// ── Check 2: API Route Health ───────────────────────────────────────

function checkApiRoutes(): boolean {
  heading("2. API Route Structure Check");

  let pass = 0;
  let fail = 0;

  for (const route of API_ROUTES) {
    // Convert /api/price to src/app/api/price/route.ts
    const routeDir = join(SRC_DIR, "app", ...route.split("/").filter(Boolean));
    const routeFile = join(routeDir, "route.ts");
    const routeFileJs = join(routeDir, "route.js");

    if (existsSync(routeFile)) {
      const content = readFileSync(routeFile, "utf-8");
      const methods: string[] = [];
      if (content.includes("export async function GET") || content.includes("export function GET")) methods.push("GET");
      if (content.includes("export async function POST") || content.includes("export function POST")) methods.push("POST");
      if (content.includes("export async function PUT")) methods.push("PUT");
      if (content.includes("export async function DELETE")) methods.push("DELETE");

      log("[OK]", `${route} [${methods.join(", ") || "?"}]`);
      pass++;
    } else if (existsSync(routeFileJs)) {
      log("[OK]", `${route} (.js)`);
      pass++;
    } else {
      log("[MISSING]", `${route} -- route handler not found`);
      fail++;
    }
  }

  // Check for error handling
  const routeFiles = collectFiles(join(SRC_DIR, "app", "api"), ".ts");
  let errorHandling = 0;
  for (const rf of routeFiles) {
    const content = readFileSync(rf, "utf-8");
    if (content.includes("try") && content.includes("catch")) {
      errorHandling++;
    }
  }
  log("[INFO]", `${errorHandling}/${routeFiles.length} API routes have try/catch`);

  console.log(`\n  Result: ${pass} OK, ${fail} missing`);
  return fail === 0;
}

// ── Check 3: Static Asset Optimization ──────────────────────────────

function checkStaticAssets(): boolean {
  heading("3. Static Asset Optimization");

  let issues = 0;

  // Check public directory
  if (!existsSync(PUBLIC_DIR)) {
    log("[WARN]", "public/ directory not found");
    return true;
  }

  const publicFiles = collectFiles(PUBLIC_DIR);
  log("[INFO]", `public/ files: ${publicFiles.length}`);

  // Check image sizes
  const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"];
  const images = publicFiles.filter((f) => imageExts.includes(extname(f).toLowerCase()));

  let totalImageKB = 0;
  let oversized = 0;

  for (const img of images) {
    const sizeKB = fileSizeKB(img);
    totalImageKB += sizeKB;

    if (sizeKB > PERF_BUDGET.maxImageSizeKB && !img.endsWith(".svg")) {
      log("[WARN]", `Large image: ${img.split(/[/\\]/).pop()} (${sizeKB.toFixed(0)} KB)`);
      oversized++;
      issues++;
    }
  }

  const totalImageMB = totalImageKB / 1024;
  log(
    totalImageMB < PERF_BUDGET.maxTotalImagesMB ? "[OK]" : "[WARN]",
    `Total image size: ${totalImageMB.toFixed(2)} MB (budget: ${PERF_BUDGET.maxTotalImagesMB} MB)`,
  );

  if (oversized === 0) {
    log("[OK]", `All ${images.length} images within size budget (${PERF_BUDGET.maxImageSizeKB} KB)`);
  }

  // Check for Next.js Image component usage
  const tsxFiles = collectFiles(SRC_DIR, ".tsx");
  let usesNextImage = false;
  for (const f of tsxFiles) {
    if (readFileSync(f, "utf-8").includes("next/image")) {
      usesNextImage = true;
      break;
    }
  }
  log(usesNextImage ? "[OK]" : "[SUGGEST]", `next/image usage: ${usesNextImage ? "Yes" : "Consider using for automatic optimization"}`);

  return issues === 0;
}

// ── Check 4: SEO Validation ─────────────────────────────────────────

function checkSeo(): boolean {
  heading("4. SEO Validation");

  let issues = 0;

  // Check layout.tsx for metadata
  const layoutPath = join(SRC_DIR, "app", "layout.tsx");
  if (existsSync(layoutPath)) {
    const content = readFileSync(layoutPath, "utf-8");

    const checks: [string, RegExp][] = [
      ["metadata export", /export\s+(const|function)\s+metadata/],
      ["title", /title/],
      ["description", /description/],
      ["viewport meta", /viewport/],
    ];

    for (const [name, pattern] of checks) {
      if (pattern.test(content)) {
        log("[OK]", `layout.tsx: ${name}`);
      } else {
        log("[WARN]", `layout.tsx: ${name} not found`);
        issues++;
      }
    }
  } else {
    log("[FAIL]", "src/app/layout.tsx not found");
    issues++;
  }

  // Check for page-level metadata
  const pageFiles = collectFiles(join(SRC_DIR, "app"), ".tsx").filter(
    (f) => f.endsWith("page.tsx"),
  );
  let pagesWithMeta = 0;
  for (const pf of pageFiles) {
    const content = readFileSync(pf, "utf-8");
    if (content.includes("metadata") || content.includes("generateMetadata")) {
      pagesWithMeta++;
    }
  }
  log("[INFO]", `${pagesWithMeta}/${pageFiles.length} pages have metadata`);

  // Check for sitemap
  const sitemapTs = join(SRC_DIR, "app", "sitemap.ts");
  const sitemapXml = join(PUBLIC_DIR, "sitemap.xml");
  if (existsSync(sitemapTs)) {
    log("[OK]", "Dynamic sitemap.ts found");
  } else if (existsSync(sitemapXml)) {
    log("[OK]", "Static sitemap.xml found");
  } else {
    log("[WARN]", "No sitemap found -- create src/app/sitemap.ts");
    issues++;
  }

  // Check for robots.txt
  const robotsTs = join(SRC_DIR, "app", "robots.ts");
  const robotsTxt = join(PUBLIC_DIR, "robots.txt");
  if (existsSync(robotsTs)) {
    log("[OK]", "Dynamic robots.ts found");
  } else if (existsSync(robotsTxt)) {
    log("[OK]", "Static robots.txt found");
  } else {
    log("[WARN]", "No robots.txt found -- create src/app/robots.ts");
    issues++;
  }

  // Check for favicon
  const faviconPaths = [
    join(SRC_DIR, "app", "favicon.ico"),
    join(PUBLIC_DIR, "favicon.ico"),
    join(SRC_DIR, "app", "icon.png"),
  ];
  const hasFavicon = faviconPaths.some((p) => existsSync(p));
  log(hasFavicon ? "[OK]" : "[WARN]", `Favicon: ${hasFavicon ? "Found" : "Missing"}`);
  if (!hasFavicon) issues++;

  // Check for Open Graph images
  const ogPaths = [
    join(SRC_DIR, "app", "opengraph-image.png"),
    join(PUBLIC_DIR, "og-image.png"),
  ];
  const hasOg = ogPaths.some((p) => existsSync(p));
  log(hasOg ? "[OK]" : "[SUGGEST]", `OG Image: ${hasOg ? "Found" : "Consider adding for social sharing"}`);

  return issues === 0;
}

// ── Check 5: Performance Budget ─────────────────────────────────────

function checkPerformanceBudget(): boolean {
  heading("5. Performance Budget Validation");

  let issues = 0;

  // Check .next build output
  if (!existsSync(NEXT_DIR)) {
    log("[WARN]", '.next/ not found. Run "npm run build" in app/ first.');
    log("[INFO]", "Skipping bundle analysis.");

    // Still check source-level indicators
    const tsxFiles = collectFiles(SRC_DIR, ".tsx");
    const tsFiles = collectFiles(SRC_DIR, ".ts");
    log("[INFO]", `Source files: ${tsxFiles.length} TSX, ${tsFiles.length} TS`);

    // Check for dynamic imports (code splitting)
    let dynamicImports = 0;
    for (const f of [...tsxFiles, ...tsFiles]) {
      const content = readFileSync(f, "utf-8");
      if (content.includes("dynamic(") || content.includes("import(")) {
        dynamicImports++;
      }
    }
    log("[INFO]", `Files with dynamic imports: ${dynamicImports}`);
    log("[SUGGEST]", "Use next/dynamic for heavy components");

    return true;
  }

  // Analyze .next build output
  const buildManifest = join(NEXT_DIR, "build-manifest.json");
  if (existsSync(buildManifest)) {
    const manifest = JSON.parse(readFileSync(buildManifest, "utf-8"));
    const pages = Object.keys(manifest.pages || {});
    log("[INFO]", `Build pages: ${pages.length}`);
  }

  // Check total JS size
  const jsFiles = collectFiles(join(NEXT_DIR, "static"), ".js");
  let totalJSKB = 0;
  for (const f of jsFiles) {
    totalJSKB += fileSizeKB(f);
  }
  const totalJSMB = totalJSKB / 1024;

  log(
    totalJSMB < PERF_BUDGET.maxTotalBundleMB ? "[OK]" : "[WARN]",
    `Total JS bundle: ${totalJSMB.toFixed(2)} MB (budget: ${PERF_BUDGET.maxTotalBundleMB} MB)`,
  );
  if (totalJSMB >= PERF_BUDGET.maxTotalBundleMB) issues++;

  // Check dependencies size
  const pkgPath = join(APP_ROOT, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = Object.keys(pkg.dependencies || {});
    const heavyDeps = ["recharts", "@turf/turf", "leaflet"];
    const found = heavyDeps.filter((d) => deps.includes(d));
    if (found.length > 0) {
      log("[INFO]", `Heavy deps detected: ${found.join(", ")} -- ensure tree-shaking`);
    }
  }

  return issues === 0;
}

// ── Check 6: Generate vercel.json ───────────────────────────────────

function generateVercelConfig(): boolean {
  heading("6. Vercel Configuration Generation");

  const config = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    framework: "nextjs",
    rootDirectory: "app",
    buildCommand: "npm run build",
    installCommand: "npm install",
    regions: ["icn1"],  // Seoul for Korean audience
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.clarity.ms; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://www.clarity.ms https://*.clarity.ms",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ],
    env: {
      NEXT_PUBLIC_CLARITY_ID: "@next_public_clarity_id",
      NEXT_PUBLIC_API_URL: "@next_public_api_url",
    },
    crons: [],
  };

  const vercelPath = join(PROJECT_ROOT, "vercel.json");
  writeFileSync(vercelPath, JSON.stringify(config, null, 2) + "\n");
  log("[CREATED]", "vercel.json (optimized for Seoul region)");

  // Generate sitemap.ts template if missing
  const sitemapTs = join(SRC_DIR, "app", "sitemap.ts");
  if (!existsSync(sitemapTs)) {
    const sitemapContent = `import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://apple.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
${PAGES.map((p) => `    { url: \`\${BASE_URL}${p}\`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: ${p === "/" ? "1.0" : "0.8"} },`).join("\n")}
  ];

  return pages;
}
`;
    writeFileSync(sitemapTs, sitemapContent);
    log("[CREATED]", "src/app/sitemap.ts");
  } else {
    log("[EXISTS]", "src/app/sitemap.ts already exists");
  }

  // Generate robots.ts template if missing
  const robotsTs = join(SRC_DIR, "app", "robots.ts");
  if (!existsSync(robotsTs)) {
    const robotsContent = `import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://apple.example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: \`\${BASE_URL}/sitemap.xml\`,
  };
}
`;
    writeFileSync(robotsTs, robotsContent);
    log("[CREATED]", "src/app/robots.ts");
  } else {
    log("[EXISTS]", "src/app/robots.ts already exists");
  }

  return true;
}

// ── Main ────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const mode = args[0] || "--full";

  console.log("+" + "=".repeat(58) + "+");
  console.log("|  pj18_apple -- Next.js Deployment Checklist              |");
  console.log("|  Vercel-Optimized | React 19 + Next.js 16               |");
  console.log("+" + "=".repeat(58) + "+");

  const results: Record<string, boolean> = {};

  if (mode === "--env") {
    results.env = checkEnvVars();
  } else if (mode === "--seo") {
    results.seo = checkSeo();
  } else if (mode === "--perf") {
    results.performance = checkPerformanceBudget();
  } else if (mode === "--generate") {
    results.generate = generateVercelConfig();
  } else {
    // Full check
    results.env = checkEnvVars();
    results.apiRoutes = checkApiRoutes();
    results.assets = checkStaticAssets();
    results.seo = checkSeo();
    results.performance = checkPerformanceBudget();
    results.vercelConfig = generateVercelConfig();
  }

  // Summary
  heading("DEPLOYMENT READINESS SUMMARY");
  let allOk = true;
  for (const [name, ok] of Object.entries(results)) {
    log(ok ? "[PASS]" : "[FAIL]", name);
    if (!ok) allOk = false;
  }

  console.log();
  log("[RESULT]", allOk ? "READY TO DEPLOY" : "ISSUES FOUND -- review above");
  log("[PLATFORM]", "Vercel (Next.js native)");
  log("[REGION]", "icn1 (Seoul)");
  log("[FRAMEWORK]", "Next.js 16 + React 19 + Tailwind 4");

  process.exit(allOk ? 0 : 1);
}

main();
