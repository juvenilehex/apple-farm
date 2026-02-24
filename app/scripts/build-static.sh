#!/bin/bash
# Cloudflare Pages 정적 빌드 스크립트
# API 라우트는 서버 전용이라 정적 빌드에서 제외

set -e

echo "📦 정적 빌드 시작..."

# API route.ts 파일들을 임시로 이름 변경
API_FILES=$(find src/app/api -name "route.ts" 2>/dev/null)
for f in $API_FILES; do
  mv "$f" "${f}.bak"
done
echo "  API 라우트 ${#API_FILES[@]}개 임시 제외"

# 정적 빌드
STATIC_EXPORT=true npx next build || BUILD_FAILED=true

# API 라우트 복원
for f in $(find src/app/api -name "route.ts.bak" 2>/dev/null); do
  mv "$f" "${f%.bak}"
done
echo "  API 라우트 복원"

if [ "$BUILD_FAILED" = true ]; then
  echo "❌ 빌드 실패"
  exit 1
fi

echo "✅ 정적 빌드 완료 → out/ 폴더"
echo "   Cloudflare Pages에 out/ 폴더를 업로드하세요"
