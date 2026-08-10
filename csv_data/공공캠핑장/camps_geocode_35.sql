-- ================================================================
-- Korea Trekking Hub — 좌표 없던 고캠핑 보강분 좌표 채우기
-- 파일: camps_geocode_35.sql (csv_data/공공캠핑장/)
--
-- 출처: 한국관광공사 고캠핑 캠핑장 상세페이지의 지도 좌표(WGS84).
-- 캠핑장명으로 검색해 찾은 뒤, 상세페이지 주소의 시군구가 일치하는 건만 넣었습니다.
--
-- 008 실행 + camps_seed.sql(또는 seed_camps.ts) 적재가 끝난 뒤 실행하세요.
-- 여러 번 실행해도 안전합니다.
-- ================================================================

UPDATE public.camps SET lat = 38.1901515558208, lng = 128.603529382636, geocoded = TRUE
 WHERE id = 'camp-gc-002';  -- 속초해변 국민여가 캠핑장 (속초시, 고캠핑 c_no=1742)
UPDATE public.camps SET lat = 37.1385799, lng = 128.8084158, geocoded = TRUE
 WHERE id = 'camp-gc-003';  -- 상동 선바위골 국민여가캠핑장 (영월군, 고캠핑 c_no=100385)
UPDATE public.camps SET lat = 37.970409, lng = 128.421977, geocoded = TRUE
 WHERE id = 'camp-gc-004';  -- 진동리 국민여가캠핑장 by zapza (인제군, 고캠핑 c_no=8175)
UPDATE public.camps SET lat = 37.7949223, lng = 127.6086596, geocoded = TRUE
 WHERE id = 'camp-gc-005';  -- 구곡폭포 국민여가 캠핑장 (춘천시, 고캠핑 c_no=7879)
UPDATE public.camps SET lat = 37.9829673908578, lng = 127.817991854262, geocoded = TRUE
 WHERE id = 'camp-gc-006';  -- 청평사 국민여가 캠핑장 (춘천시, 고캠핑 c_no=8159)
UPDATE public.camps SET lat = 37.4275606, lng = 128.385870, geocoded = TRUE
 WHERE id = 'camp-gc-007';  -- 평창 국민여가캠핑장 (평창군, 고캠핑 c_no=100920)
UPDATE public.camps SET lat = 38.1338482105654, lng = 127.62751438948, geocoded = TRUE
 WHERE id = 'camp-gc-008';  -- 만산동 국민여가 캠핑장 (화천군, 고캠핑 c_no=1029)
UPDATE public.camps SET lat = 37.5622773, lng = 127.9547878, geocoded = TRUE
 WHERE id = 'camp-gc-009';  -- 솔밭체육공원오토캠핑장 (횡성군, 고캠핑 c_no=1770)
UPDATE public.camps SET lat = 35.1953233, lng = 126.7303820, geocoded = TRUE
 WHERE id = 'camp-gc-016';  -- 광산구 국민여가 친환경 오토캠핑장 (광산구, 고캠핑 c_no=8074)
UPDATE public.camps SET lat = 35.0067685, lng = 127.581401, geocoded = TRUE
 WHERE id = 'camp-gc-019';  -- 백운제 농어촌테마공원 자동차 야영장 (광양시, 고캠핑 c_no=7276)
UPDATE public.camps SET lat = 34.7895733692037, lng = 126.691841825935, geocoded = TRUE
 WHERE id = 'camp-gc-020';  -- 영암군 국민여가 캠핑장 (영암군, 고캠핑 c_no=7693)
UPDATE public.camps SET lat = 37.4769006, lng = 130.8095695, geocoded = TRUE
 WHERE id = 'camp-gc-014';  -- 울릉군국민여가캠핑장 (울릉군, 고캠핑 c_no=2450)
UPDATE public.camps SET lat = 35.9809305, lng = 129.3139410, geocoded = TRUE
 WHERE id = 'camp-gc-015';  -- 포항국민여가캠핑장 (포항시, 고캠핑 c_no=7778)
UPDATE public.camps SET lat = 36.3969703, lng = 127.4385337, geocoded = TRUE
 WHERE id = 'camp-gc-017';  -- 산디마을 생태공원 캠핑장 (대덕구, 고캠핑 c_no=1487)
UPDATE public.camps SET lat = 36.1049416, lng = 127.5691925, geocoded = TRUE
 WHERE id = 'camp-gc-031';  -- 금산 국민여가캠핑장 (금산군, 고캠핑 c_no=404)
UPDATE public.camps SET lat = 36.0184355, lng = 126.7385344, geocoded = TRUE
 WHERE id = 'camp-gc-032';  -- 서천 국민여가 캠핑장 (서천군, 고캠핑 c_no=100643)
UPDATE public.camps SET lat = 36.8016541, lng = 127.2267849, geocoded = TRUE
 WHERE id = 'camp-gc-033';  -- 천안시 국민여가캠핑장 (천안시, 고캠핑 c_no=7271)
UPDATE public.camps SET lat = 35.7612032, lng = 127.7240007, geocoded = TRUE
 WHERE id = 'camp-gc-012';  -- 거창 국민여가캠핑장 (거창군, 고캠핑 c_no=6732)
UPDATE public.camps SET lat = 34.778005159336, lng = 127.950947438005, geocoded = TRUE
 WHERE id = 'camp-gc-013';  -- 남해 힐링국민여가캠핑장 (남해군, 고캠핑 c_no=100245)
UPDATE public.camps SET lat = 35.1664699070248, lng = 128.968683286896, geocoded = TRUE
 WHERE id = 'camp-gc-018';  -- 삼락생태공원 오토캠핑장 (사상구, 고캠핑 c_no=1547)
UPDATE public.camps SET lat = 37.3473669790763, lng = 126.918131824485, geocoded = TRUE
 WHERE id = 'camp-gc-010';  -- 초막골생태공원 느티나무야영장 (군포시, 고캠핑 c_no=2963)
UPDATE public.camps SET lat = 36.9332113, lng = 126.8963786, geocoded = TRUE
 WHERE id = 'camp-gc-011';  -- 평택항 국민여가캠핑장 (평택시, 고캠핑 c_no=100873)
UPDATE public.camps SET lat = 35.5025416, lng = 126.5829374, geocoded = TRUE
 WHERE id = 'camp-gc-022';  -- (중복제거) 선운산도립공원야영장 (고창군, 고캠핑 c_no=8201)
UPDATE public.camps SET lat = 35.5025416, lng = 126.5829374, geocoded = TRUE
 WHERE id = 'camp-gc-024';  -- 고창군 선운산 국민여가캠핑장 (고창군, 고캠핑 c_no=8201)
UPDATE public.camps SET lat = 35.5102165, lng = 126.4800517, geocoded = TRUE
 WHERE id = 'camp-gc-025';  -- 동호 국민여가캠핑장 (고창군, 고캠핑 c_no=100784)
UPDATE public.camps SET lat = 36.0202772651684, lng = 126.763564242219, geocoded = TRUE
 WHERE id = 'camp-gc-026';  -- 금강호 국민여가 캠핑장 (군산시, 고캠핑 c_no=101635)
UPDATE public.camps SET lat = 35.3998775910834, lng = 127.507701185487, geocoded = TRUE
 WHERE id = 'camp-gc-027';  -- 남원 백두대간 국민여가캠핑장 (남원시, 고캠핑 c_no=564)
UPDATE public.camps SET lat = 35.6373374, lng = 127.4035126, geocoded = TRUE
 WHERE id = 'camp-gc-028';  -- 성수산 왕의숲 국민여가캠핑장 (임실군, 고캠핑 c_no=100953)
UPDATE public.camps SET lat = 35.5400154875724, lng = 127.336421060977, geocoded = TRUE
 WHERE id = 'camp-gc-029';  -- 오수의견 국민여가캠핑장 (임실군, 고캠핑 c_no=101883)
UPDATE public.camps SET lat = 35.9747099074189, lng = 127.41608438212, geocoded = TRUE
 WHERE id = 'camp-gc-030';  -- 운일암반일암 국민여가캠핑장 (진안군, 고캠핑 c_no=7929)
UPDATE public.camps SET lat = 36.4896200, lng = 127.7557935, geocoded = TRUE
 WHERE id = 'camp-gc-034';  -- 보은국민여가캠핑장 (보은군, 고캠핑 c_no=101025)
UPDATE public.camps SET lat = 36.6744104, lng = 127.4477438, geocoded = TRUE
 WHERE id = 'camp-gc-035';  -- 문암생태공원 (청주시, 고캠핑 c_no=1139)

-- 좌표를 못 찾은 건 (지도 미표시). 확인되면 아래처럼 직접 채워 주세요.
-- 고캠핑에 등록이 없거나 명칭이 달라 자동 매칭에 실패했습니다.
-- UPDATE public.camps SET lat = 00.000000, lng = 000.000000, geocoded = TRUE
--  WHERE id = 'camp-gc-001';  -- 가곡 유황온천 국민여가캠핑장 / 강원특별자치도 삼척시 가곡면 가곡천로 1512
--  사유: 검색결과 없음
-- UPDATE public.camps SET lat = 00.000000, lng = 000.000000, geocoded = TRUE
--  WHERE id = 'camp-gc-021';  -- 정남진리조트 국민여가캠핑장 / 전라남도 장흥군 부산면 심천공원길 25-27
--  사유: 검색결과 없음
-- UPDATE public.camps SET lat = 00.000000, lng = 000.000000, geocoded = TRUE
--  WHERE id = 'camp-gc-023';  -- 고창군 국민여가캠핑장 / 전북특별자치도 고창군 부안면 복분자로 531
--  사유: 검색이 다른 캠핑장(선운산)을 잡음 — 주소 불일치

-- 결과 확인
SELECT COUNT(*) AS 전체, COUNT(*) FILTER (WHERE geocoded) AS 지도표시가능
FROM public.camps;
