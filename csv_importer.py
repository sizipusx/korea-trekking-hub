#!/usr/bin/env python3
"""
Korea Trekking Hub — 지자체 CSV 자동 처리 스크립트
============================================================
사용법:
  python csv_importer.py

지원 CSV 형식:
  1. 자전거도로 (제천시 등)   — 노선명, 총길이(km), 기점/종점 주소
  2. 등산로/트레킹 (연천군 등) — 코스명, 거리, 시점/종점, 위도/경도
  3. 기타 일반 형식           — 자동 컬럼 매핑

출력:
  - Supabase SQL 파일 (바로 SQL Editor에 붙여넣기 가능)
  - 처리 결과 요약 리포트
"""

import pandas as pd
import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime

# ── 설정 ──────────────────────────────────────────────────────────────────────

# 처리할 CSV 파일들이 있는 폴더 (이 스크립트와 같은 폴더)
CSV_FOLDER = Path(__file__).parent / "csv_data"

# 출력 SQL 파일 경로
OUTPUT_SQL  = Path(__file__).parent / "output_import.sql"
OUTPUT_JSON = Path(__file__).parent / "output_import.json"

# 카테고리 자동 판별 키워드
CATEGORY_KEYWORDS = {
    "동서트레일":    ["동서트레일"],
    "국가숲길":      ["국가숲길", "둘레길", "숲길"],
    "코리아둘레길":  ["해파랑", "남파랑", "서해랑", "DMZ평화"],
    "국립공원":      ["국립공원"],
    "제주 올레":     ["올레"],
    "지자체 트레일": ["트레킹", "등산로", "산책로", "자전거", "자전거도로", "bike"],
    "백두대간":      ["백두대간"],
}

# 난이도 자동 판별
def guess_difficulty(name: str, distance: float) -> str:
    name_lower = str(name).lower()
    if "자전거" in name_lower or distance < 5:
        return "하"
    elif distance < 15:
        return "중하"
    elif distance < 30:
        return "중"
    elif distance < 50:
        return "중상"
    else:
        return "상"

# ── 컬럼 자동 매핑 ────────────────────────────────────────────────────────────

# 각 유형별 컬럼명 후보 (우선순위 순)
COL_MAPPING = {
    "name":       ["노선명", "코스명", "트레킹코스명", "등산로명", "시설명", "명칭"],
    "distance":   ["총길이(km)", "거리(km)", "연장(km)", "길이(km)", "총연장", "거리"],
    "start":      ["기점도로명주소", "기점지번주소", "시점", "출발지", "시작점"],
    "end":        ["종점도로명주소", "종점지번주소", "종점", "도착지", "종점지"],
    "waypoints":  ["주요경유지", "경유지", "주요지점"],
    "lat":        ["기점위도", "위도", "lat", "latitude", "시점위도"],
    "lng":        ["기점경도", "경도", "lng", "longitude", "시점경도"],
    "city":       ["시군구명", "시군구", "지역명"],
    "province":   ["시도명", "광역시도"],
    "type":       ["자전거도로종류", "도로종류", "시설종류"],
    "org":        ["관리기관명", "관리기관", "담당기관"],
    "date":       ["데이터기준일자", "기준일자", "수정일"],
}

def find_col(df: pd.DataFrame, candidates: list) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    # 부분 일치
    for c in candidates:
        for col in df.columns:
            if c in col or col in c:
                return col
    return None

# ── CSV 파일 자동 분석 ────────────────────────────────────────────────────────

def detect_csv_type(df: pd.DataFrame, filename: str) -> str:
    """CSV 유형 자동 판별"""
    cols = " ".join(df.columns.tolist()).lower()
    fname = filename.lower()

    if "자전거" in cols or "자전거" in fname:
        return "bike"
    elif "등산로" in fname or "등산" in cols:
        return "hiking"
    elif "트레킹" in fname or "트레킹" in cols:
        return "trekking"
    elif "올레" in fname:
        return "olle"
    elif "둘레" in fname or "둘레" in cols:
        return "dulre"
    else:
        return "general"

def guess_category(csv_type: str, filename: str) -> str:
    """카테고리 자동 판별"""
    text = (csv_type + filename).lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                return cat
    return "지자체 트레일"

def safe_str(val) -> str:
    if pd.isna(val):
        return ""
    return str(val).strip().replace("'", "''")

def safe_float(val) -> float:
    try:
        return float(val)
    except:
        return 0.0

# ── 메인 처리 ─────────────────────────────────────────────────────────────────

def process_csv(filepath: Path) -> dict:
    """단일 CSV 파일 처리"""
    print(f"\n📂 처리 중: {filepath.name}")

    # 인코딩 자동 감지
    for enc in ["utf-8-sig", "utf-8", "cp949", "euc-kr"]:
        try:
            df = pd.read_csv(filepath, encoding=enc)
            print(f"   인코딩: {enc} ✅")
            break
        except:
            continue
    else:
        print(f"   ❌ 인코딩 감지 실패")
        return None

    print(f"   행 수: {len(df)}, 컬럼 수: {len(df.columns)}")

    # 컬럼 매핑
    cols = {k: find_col(df, v) for k, v in COL_MAPPING.items()}
    print(f"   컬럼 매핑: name={cols['name']}, dist={cols['distance']}, lat={cols['lat']}, lng={cols['lng']}")

    if not cols["name"]:
        print("   ❌ 코스명 컬럼을 찾을 수 없습니다")
        return None

    # CSV 유형 및 카테고리 판별
    csv_type = detect_csv_type(df, filepath.name)
    category = guess_category(csv_type, filepath.name)

    # 지역 정보 추출
    province = ""
    city     = ""
    if cols["province"]:
        province = safe_str(df[cols["province"]].dropna().iloc[0]) if len(df) > 0 else ""
    if cols["city"]:
        city = safe_str(df[cols["city"]].dropna().iloc[0]) if len(df) > 0 else ""

    region = f"{province} {city}".strip()

    # 대주제 trail ID 생성 (파일명 기반)
    base_name = filepath.stem  # 예: '충청북도_제천시_자전거도로_20260323'
    trail_id  = re.sub(r'[^a-z0-9]', '-', base_name.lower())[:40]
    trail_id  = re.sub(r'-+', '-', trail_id).strip('-')

    # 전체 거리 합산
    total_km = 0.0
    if cols["distance"]:
        total_km = df[cols["distance"]].apply(safe_float).sum()
        total_km = round(total_km, 1)

    # 대주제 코스명 생성
    trail_name = f"{city} {csv_type == 'bike' and '자전거길' or '트레킹코스'}"
    if "자전거" in filepath.name:
        trail_name = f"{city} 자전거길"
    elif "등산" in filepath.name:
        trail_name = f"{city} 등산로"
    elif "트레킹" in filepath.name:
        trail_name = f"{city} 트레킹"

    # 세부 코스 목록
    sections = []
    for i, row in df.iterrows():
        name_val = safe_str(row[cols["name"]])
        if not name_val:
            continue

        dist_val = safe_float(row[cols["distance"]]) if cols["distance"] else 0.0
        start_val = safe_str(row[cols["start"]]) if cols["start"] else ""
        end_val   = safe_str(row[cols["end"]]) if cols["end"] else ""
        wp_val    = safe_str(row[cols["waypoints"]]) if cols["waypoints"] else ""
        lat_val   = safe_float(row[cols["lat"]]) if cols["lat"] else None
        lng_val   = safe_float(row[cols["lng"]]) if cols["lng"] else None

        # 주소에서 lat/lng 없으면 None
        if lat_val == 0.0:
            lat_val = None
        if lng_val == 0.0:
            lng_val = None

        diff = guess_difficulty(name_val, dist_val)

        sections.append({
            "section_no": i + 1,
            "name":       name_val,
            "start":      start_val[:200] if start_val else "",
            "end":        end_val[:200]   if end_val else "",
            "distance":   dist_val,
            "highlights": wp_val[:300]    if wp_val else "",
            "difficulty": diff,
            "lat":        lat_val,
            "lng":        lng_val,
        })

    print(f"   세부 코스: {len(sections)}개, 총 거리: {total_km}km, 카테고리: {category}")

    return {
        "trail_id":   trail_id,
        "trail_name": trail_name,
        "region":     region,
        "province":   province,
        "total_km":   total_km,
        "category":   category,
        "sections":   sections,
        "source":     f"{city} 공공데이터",
    }

def generate_sql(results: list) -> str:
    """처리 결과를 SQL로 변환"""
    lines = [
        "-- ================================================================",
        "-- Korea Trekking Hub — 지자체 데이터 자동 임포트",
        f"-- 생성일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"-- 처리 파일 수: {len(results)}",
        "-- Supabase SQL Editor에 붙여넣고 Run 클릭",
        "-- ================================================================",
        "",
        "-- trail_sections 테이블이 없으면 먼저 아래 SQL 실행:",
        "-- supabase/migrations/002_phase4_auth_logs.sql 참고",
        "",
    ]

    for r in results:
        if not r:
            continue

        tid    = r["trail_id"]
        tname  = r["trail_name"].replace("'", "''")
        region = r["region"].replace("'", "''")
        prov   = r["province"].replace("'", "''")
        km     = r["total_km"]
        cat    = r["category"]
        source = r["source"].replace("'", "''")

        lines.append(f"-- ── {tname} ({'='*40}")
        lines.append("")

        # 1. trails 대주제 삽입
        lines.append("-- 1) 대주제 코스 추가")
        lines.append(f"""INSERT INTO public.trails (id, name, region, province, distance_km, days_required, difficulty, camping, backpacking, category, status, highlights, source, official_url)
VALUES (
  '{tid}',
  '{tname}',
  '{region}',
  '{prov}',
  {km},
  '자유',
  '하',
  FALSE,
  FALSE,
  '{cat}',
  '운영중',
  '{region} 지역 자전거/트레킹 코스 모음',
  '{source}',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  distance_km = EXCLUDED.distance_km,
  updated_at  = NOW();
""")

        # 2. trail_sections 세부 코스 삽입
        if r["sections"]:
            lines.append("-- 2) 세부 코스 추가")
            # 기존 세부 코스 삭제 후 재삽입
            lines.append(f"DELETE FROM public.trail_sections WHERE trail_id = '{tid}';")
            lines.append("")

            for s in r["sections"]:
                sname  = s["name"].replace("'", "''")
                sstart = s["start"].replace("'", "''")
                send   = s["end"].replace("'", "''")
                shigh  = s["highlights"].replace("'", "''")
                sdiff  = s["difficulty"]
                sdist  = s["distance"]
                sno    = s["section_no"]

                lat_sql = f"{s['lat']}" if (s['lat'] and str(s['lat']) != 'nan') else "NULL"
                lng_sql = f"{s['lng']}" if (s['lng'] and str(s['lng']) != 'nan') else "NULL"

                lines.append(f"""INSERT INTO public.trail_sections (trail_id, section_no, name, start_point, end_point, distance_km, difficulty, highlights, lat, lng)
VALUES ('{tid}', {sno}, '{sname}', '{sstart}', '{send}', {sdist}, '{sdiff}', '{shigh}', {lat_sql}, {lng_sql});""")

            lines.append("")

    lines.append("-- 완료! 위 SQL을 Supabase SQL Editor에서 실행하세요.")
    return "\n".join(lines)

# ── 실행 ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("🥾 Korea Trekking Hub — CSV 자동 임포터")
    print("=" * 60)

    # csv_data 폴더 확인
    if not CSV_FOLDER.exists():
        CSV_FOLDER.mkdir()
        print(f"\n📁 '{CSV_FOLDER}' 폴더를 만들었습니다.")
        print("   처리할 CSV 파일을 이 폴더에 넣고 다시 실행하세요.")
        return

    # CSV 파일 목록
    csv_files = list(CSV_FOLDER.glob("*.csv"))
    if not csv_files:
        print(f"\n❌ '{CSV_FOLDER}' 폴더에 CSV 파일이 없습니다.")
        print("   처리할 CSV 파일을 이 폴더에 넣고 다시 실행하세요.")
        return

    print(f"\n📋 발견된 CSV 파일: {len(csv_files)}개")
    for f in csv_files:
        print(f"   - {f.name}")

    # 각 CSV 처리
    results = []
    for filepath in csv_files:
        result = process_csv(filepath)
        if result:
            results.append(result)

    if not results:
        print("\n❌ 처리 가능한 파일이 없습니다.")
        return

    # SQL 생성
    sql_content = generate_sql(results)
    OUTPUT_SQL.write_text(sql_content, encoding="utf-8")

    # JSON 생성 (확인용)
    OUTPUT_JSON.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    # 결과 요약
    print("\n" + "=" * 60)
    print("✅ 처리 완료!")
    print("=" * 60)
    total_trails   = len(results)
    total_sections = sum(len(r["sections"]) for r in results)
    total_km       = sum(r["total_km"] for r in results)

    print(f"   대주제 코스:  {total_trails}개")
    print(f"   세부 코스:    {total_sections}개")
    print(f"   총 거리:      {round(total_km, 1)}km")
    print(f"\n📄 SQL 파일:  {OUTPUT_SQL}")
    print(f"📄 JSON 파일: {OUTPUT_JSON}")
    print("\n다음 단계:")
    print("   1. output_import.sql 파일을 메모장으로 열기")
    print("   2. 전체 내용 복사 (Ctrl+A → Ctrl+C)")
    print("   3. Supabase SQL Editor → New query → 붙여넣기 → Run")

if __name__ == "__main__":
    main()
