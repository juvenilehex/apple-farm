/**
 * validate-build.mjs — Next.js 빌드 후 품질 검증 (L1 워크플로우)
 *
 * 검증 항목:
 *   1. .next/BUILD_ID 존재 확인
 *   2. 빌드 크기 분석 (pages, chunks)
 *   3. 환경변수 검증 (NEXT_PUBLIC_ 필수값)
 *   4. 빌드 매니페스트 검증
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const NEXT_DIR = '.next';
const REQUIRED_ENV = ['NEXT_PUBLIC_CLARITY_ID'];

const results = { pass: [], warn: [], fail: [] };

// 1. 빌드 아티팩트 존재 확인
function checkBuildExists() {
  if (!existsSync(NEXT_DIR)) {
    results.fail.push('.next/ 디렉토리 없음 — 빌드가 실행되지 않았습니다');
    return false;
  }
  if (!existsSync(join(NEXT_DIR, 'BUILD_ID'))) {
    results.fail.push('.next/BUILD_ID 없음 — 빌드가 완료되지 않았습니다');
    return false;
  }
  const buildId = readFileSync(join(NEXT_DIR, 'BUILD_ID'), 'utf-8').trim();
  results.pass.push(`빌드 ID: ${buildId}`);
  return true;
}

// 2. 빌드 크기 분석
function analyzeBuildSize() {
  const staticDir = join(NEXT_DIR, 'static');
  if (!existsSync(staticDir)) {
    results.warn.push('.next/static/ 없음 — 정적 에셋 확인 불가');
    return;
  }

  let totalSize = 0;
  let fileCount = 0;
  const largFiles = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const size = statSync(full).size;
        totalSize += size;
        fileCount++;
        if (size > 500 * 1024) {
          largFiles.push({ name: entry.name, size });
        }
      }
    }
  }
  walk(staticDir);

  const totalMB = (totalSize / 1024 / 1024).toFixed(2);
  if (totalSize > 5 * 1024 * 1024) {
    results.warn.push(`정적 에셋 ${totalMB}MB (${fileCount}개 파일) — 5MB 초과 주의`);
  } else {
    results.pass.push(`정적 에셋 ${totalMB}MB (${fileCount}개 파일)`);
  }

  if (largFiles.length > 0) {
    largFiles.forEach((f) => {
      results.warn.push(
        `대형 파일: ${f.name} (${(f.size / 1024).toFixed(0)}KB)`
      );
    });
  }
}

// 3. 환경변수 검증
function checkEnvVars() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    results.warn.push(`환경변수 미설정: ${missing.join(', ')}`);
  } else {
    results.pass.push(`필수 환경변수 ${REQUIRED_ENV.length}개 확인됨`);
  }
}

// 4. 빌드 매니페스트 검증
function checkManifest() {
  const manifestPath = join(NEXT_DIR, 'build-manifest.json');
  if (!existsSync(manifestPath)) {
    results.warn.push('build-manifest.json 없음');
    return;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const pages = Object.keys(manifest.pages || {});
    results.pass.push(`빌드 매니페스트: ${pages.length}개 페이지`);

    // 에러 페이지 존재 확인
    if (!manifest.pages['/_error']) {
      results.warn.push('에러 페이지 (_error) 미정의');
    }
  } catch (e) {
    results.warn.push(`매니페스트 파싱 실패: ${e.message}`);
  }
}

// 실행
console.log('\n╔══════════════════════════════════════╗');
console.log('║   pj18_apple 빌드 품질 검증          ║');
console.log('╚══════════════════════════════════════╝\n');

const buildExists = checkBuildExists();
if (buildExists) {
  analyzeBuildSize();
  checkEnvVars();
  checkManifest();
}

// 결과 출력
const status = results.fail.length > 0 ? 'FAIL' : results.warn.length > 0 ? 'WARN' : 'PASS';
const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';

console.log(`\n${icon} 결과: ${status}`);
console.log(`  ✅ ${results.pass.length} pass | ⚠️ ${results.warn.length} warn | ❌ ${results.fail.length} fail\n`);

results.pass.forEach((m) => console.log(`  ✅ ${m}`));
results.warn.forEach((m) => console.log(`  ⚠️ ${m}`));
results.fail.forEach((m) => console.log(`  ❌ ${m}`));

console.log('');

// 빌드 실패 시 비-zero exit (warn은 통과)
if (results.fail.length > 0) {
  process.exit(1);
}
