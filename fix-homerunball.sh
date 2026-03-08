#!/bin/bash
# homerunball.groumo.com Invalid API KEY 자동 수정 스크립트
# Author: Agent (Mini) 🦊

set -e

echo "======================================"
echo "🔧 homerunball 자동 수정 시작"
echo "======================================"
echo ""

# 1. homerunball 컨테이너 확인
echo "1️⃣ homerunball 컨테이너 확인 중..."
CONTAINER=$(docker ps --filter "name=homerunball" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ homerunball 컨테이너를 찾을 수 없습니다."
    echo ""
    echo "현재 실행 중인 테넌트 컨테이너:"
    docker ps --filter "label=groumo.tenant.subdomain" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ 컨테이너 발견: $CONTAINER"
echo ""

# 2. 현재 환경변수 확인
echo "2️⃣ 현재 환경변수 확인 중..."
echo ""
echo "📋 Supabase URL:"
docker exec $CONTAINER env | grep NEXT_PUBLIC_SUPABASE_URL || echo "  ❌ 없음"

echo ""
echo "📋 Supabase Anon Key:"
CURRENT_KEY=$(docker exec $CONTAINER env | grep NEXT_PUBLIC_SUPABASE_ANON_KEY | cut -d'=' -f2)
if [[ $CURRENT_KEY == *"okplzivnosqawvoxnndu"* ]]; then
    echo "  ❌ 잘못된 키 (GROUMO_SETTING 키 사용 중)"
    NEEDS_FIX=true
elif [[ $CURRENT_KEY == *"nbdkcefclvnvxykitdpg"* ]]; then
    echo "  ✅ 올바른 키 (RANDOM_GROUP 키)"
    NEEDS_FIX=false
else
    echo "  ⚠️ 알 수 없는 키: ${CURRENT_KEY:0:50}..."
    NEEDS_FIX=true
fi

echo ""
echo "📋 API URL:"
docker exec $CONTAINER env | grep NEXT_PUBLIC_API_URL || echo "  ❌ 없음"
echo ""

# 3. GROUMO_SETTING 환경변수 확인
echo "3️⃣ GROUMO_SETTING 환경변수 확인 중..."
cd /root/GROUMO_SETTING 2>/dev/null || cd ~/GROUMO_SETTING 2>/dev/null || {
    echo "❌ GROUMO_SETTING 디렉토리를 찾을 수 없습니다."
    echo "경로를 입력해주세요:"
    read -r GROUMO_SETTING_PATH
    cd "$GROUMO_SETTING_PATH"
}

echo ""
if grep -q "TEMPLATE_SUPABASE_URL" .env; then
    echo "✅ TEMPLATE_SUPABASE_URL 존재"
    grep "TEMPLATE_SUPABASE_URL" .env
else
    echo "❌ TEMPLATE_SUPABASE_URL 없음 - .env 업데이트 필요"
    NEEDS_ENV_UPDATE=true
fi

echo ""

# 4. 수정 필요 여부 판단
if [ "$NEEDS_FIX" = true ] || [ "$NEEDS_ENV_UPDATE" = true ]; then
    echo "======================================"
    echo "⚠️  수정이 필요합니다"
    echo "======================================"
    echo ""
    
    if [ "$NEEDS_ENV_UPDATE" = true ]; then
        echo "📝 GROUMO_SETTING .env 업데이트 중..."
        git pull origin main
        
        if [ -f update-env.sh ]; then
            ./update-env.sh
        else
            echo "⚠️ update-env.sh 없음 - 수동으로 .env 확인 필요"
        fi
        
        echo "🔄 GROUMO_SETTING 재시작 중..."
        docker-compose down
        docker-compose up -d
        echo "✅ GROUMO_SETTING 재시작 완료"
        echo ""
    fi
    
    echo "🔄 homerunball 컨테이너 재생성 중..."
    echo "   (Admin Dashboard에서 테넌트 재승인이 권장되지만, 컨테이너만 재시작합니다)"
    
    docker stop $CONTAINER
    docker rm $CONTAINER
    
    echo "✅ homerunball 컨테이너 삭제 완료"
    echo ""
    echo "======================================"
    echo "📋 다음 단계"
    echo "======================================"
    echo ""
    echo "Admin Dashboard에서 homerunball 재승인:"
    echo "  1. https://admin.groumo.com 접속"
    echo "  2. homerunball 테넌트 찾기"
    echo "  3. '삭제' 후 재승인"
    echo ""
    echo "또는 자동 재배포:"
    echo "  (GROUMO_SETTING API를 통해 자동 재생성 가능)"
    echo ""
    
else
    echo "======================================"
    echo "✅ 모든 설정이 올바릅니다"
    echo "======================================"
    echo ""
    echo "문제가 계속되면 다음을 확인하세요:"
    echo "  1. Backend 로그: docker logs randomgroup-backend --tail 100"
    echo "  2. Frontend 로그: docker logs $CONTAINER --tail 100"
    echo "  3. 브라우저 개발자 도구 → Network 탭 → API 호출 확인"
fi

echo ""
echo "======================================"
echo "🎯 스크립트 완료"
echo "======================================"
