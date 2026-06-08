// scripts/seed.ts
// 실행: npx ts-node --esm scripts/seed.ts
// (환경변수 .env.local 필요: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // 서비스 롤 키 (RLS bypass)
);

// ── 트레일 마스터 데이터 ─────────────────────────────────────────
const trails = [
  // 동서트레일
  { id:'et-all',    name:'동서트레일 (전체)',                   region:'충남→세종→대전→충북→경북', province:'충남/세종/대전/충북/경북', distance_km:849,   days_required:'55~60일', difficulty:'중',  camping:true,  backpacking:true,  category:'동서트레일',   status:'2027 전면개통예정', open_year:2027, segments:57, highlights:'태안 안면도~울진 망양정. 한국 최초 백패킹 장거리 숲길. 구간마다 야영장·거점마을 조성', source:'산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  { id:'et-55',     name:'동서트레일 55구간 (울진 우리금융길)',  region:'경북 울진',              province:'경북',               distance_km:20,    days_required:'1일',     difficulty:'중',  camping:true,  backpacking:true,  category:'동서트레일',   status:'개통완료(2023)',    open_year:2023, segments:1,  highlights:'최초 시범개통 구간. 망양정~성류굴~금강송 숲길. 동해안 울진 출발점',           source:'산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  { id:'et-1to4',   name:'동서트레일 1~4구간 (태안 안면)',       region:'충남 태안',              province:'충남',               distance_km:57,    days_required:'4일',     difficulty:'하',  camping:true,  backpacking:true,  category:'동서트레일',   status:'개통완료(2024)',    open_year:2024, segments:4,  highlights:'꽃지 해수욕장 출발. 안면송 해송림. 서쪽 관문 구간',                            source:'산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  { id:'et-47',     name:'동서트레일 47구간 (봉화 백두대간수목원)', region:'경북 봉화',            province:'경북',               distance_km:14.86, days_required:'1일',     difficulty:'중',  camping:true,  backpacking:true,  category:'동서트레일',   status:'개통완료(2024)',    open_year:2024, segments:1,  highlights:'국립백두대간수목원 경유. 봉화 금강송 숲길',                                    source:'산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  { id:'et-9to12',  name:'동서트레일 9~12구간 (홍성)',           region:'충남 홍성',              province:'충남',               distance_km:49,    days_required:'4일',     difficulty:'하',  camping:true,  backpacking:true,  category:'동서트레일',   status:'개통완료(2025)',    open_year:2025, segments:4,  highlights:'홍성 농촌 마을길·숲길 조화. 내포 문화권 연계',                                source:'산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  { id:'et-48to54', name:'동서트레일 48~54구간 (봉화·울진)',     region:'경북 봉화·울진',         province:'경북',               distance_km:103,   days_required:'7일',     difficulty:'중상',camping:true,  backpacking:true,  category:'동서트레일',   status:'개통완료(2025)',    open_year:2025, segments:7,  highlights:'불영계곡·금강송 핵심 구간. 봉화~울진 연결 장거리',                            source:'산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  // 국가숲길
  { id:'jiri-dl',   name:'지리산 둘레길',                       region:'지리산 권역',            province:'전남/경남/전북',      distance_km:295,   days_required:'20일',    difficulty:'중하',camping:true,  backpacking:true,  category:'국가숲길',     status:'운영중',            open_year:null, segments:21, highlights:'3도 5시군 21읍면 120마을 연결. 우리나라 대표 장거리 숲길 (21코스)',           source:'지리산둘레길 공식', official_url:'https://www.durunubi.kr' },
  { id:'bdt-trail', name:'백두대간 트레일',                      region:'강원 인제·홍천',         province:'강원',               distance_km:169.9, days_required:'7~10일',  difficulty:'상',  camping:true,  backpacking:true,  category:'국가숲길',     status:'운영중',            open_year:null, segments:6,  highlights:'홍천·인제·평창 조성. 아침가리 22km 예약탐방제 운영 (6코스)',                  source:'한국등산트레킹지원센터', official_url:'https://komount.or.kr' },
  { id:'dmz-punch', name:'DMZ 펀치볼 둘레길',                   region:'강원 양구',              province:'강원',               distance_km:70,    days_required:'3~4일',   difficulty:'중상',camping:false, backpacking:false, category:'국가숲길',     status:'운영중',            open_year:null, segments:null, highlights:'6·25 격전지 펀치볼 분지. 안보관광 + 청정 자연 체험',                         source:'한국등산트레킹지원센터', official_url:'https://komount.or.kr' },
  { id:'daegwall',  name:'대관령 숲길',                          region:'강원 평창',              province:'강원',               distance_km:102.96,days_required:'5~7일',   difficulty:'중',  camping:false, backpacking:false, category:'국가숲길',     status:'운영중',            open_year:null, segments:12, highlights:'영동·영서 분기점 대관령 옛길. 역사문화 고갯길 (12코스)',                     source:'한국등산트레킹지원센터', official_url:'https://komount.or.kr' },
  { id:'naepo',     name:'내포문화숲길',                         region:'충남 서산·당진·홍성·예산',province:'충남',              distance_km:328.7, days_required:'20일',    difficulty:'중하',camping:true,  backpacking:false, category:'국가숲길',     status:'운영중',            open_year:null, segments:26, highlights:'가야산 내포 지역 충남 최장 도보길. 26코스. 동서트레일과 일부 중복',          source:'내포문화숲길 공식', official_url:'https://www.naepotrail.org' },
  { id:'uljin-gg',  name:'울진 금강소나무숲길',                  region:'경북 울진',              province:'경북',               distance_km:79.4,  days_required:'3~4일',   difficulty:'중',  camping:true,  backpacking:true,  category:'국가숲길',     status:'예약탐방제',        open_year:null, segments:7,  highlights:'금강소나무 원시림. 보부상 역사길·화전민 문화. 7코스 (예약필수)',              source:'한국등산트레킹지원센터', official_url:'https://komount.or.kr' },
  { id:'hallasan-dl',name:'한라산 둘레길',                       region:'제주',                   province:'제주',               distance_km:80,    days_required:'4~5일',   difficulty:'중',  camping:false, backpacking:false, category:'국가숲길',     status:'운영중',            open_year:null, segments:6,  highlights:'일제강점기 병참로·임도 활용. 역사·문화·생태 경관 (6코스)',                    source:'한국등산트레킹지원센터', official_url:'https://komount.or.kr' },
  { id:'daejeon-dl',name:'대전 둘레산길',                        region:'대전',                   province:'대전',               distance_km:95,    days_required:'4~5일',   difficulty:'중',  camping:false, backpacking:false, category:'국가숲길',     status:'운영중',            open_year:null, segments:null, highlights:'대전 외곽 산줄기 연결. 계족산·보문산·식장산 통과',                           source:'한국등산트레킹지원센터', official_url:'https://komount.or.kr' },
  // 코리아둘레길
  { id:'haeparang', name:'해파랑길',                             region:'동해안',                 province:'부산/울산/경북/강원', distance_km:770,   days_required:'50~60일', difficulty:'중',  camping:true,  backpacking:true,  category:'코리아둘레길', status:'운영중',            open_year:null, segments:50, highlights:'오륙도→고성. 동해 일출·해안절경. 50개 코스',                                 source:'한국관광공사 두루누비', official_url:'https://www.durunubi.kr' },
  { id:'namparang', name:'남파랑길',                             region:'남해안',                 province:'부산/경남/전남',      distance_km:1470,  days_required:'90일',    difficulty:'중',  camping:true,  backpacking:true,  category:'코리아둘레길', status:'운영중',            open_year:null, segments:90, highlights:'부산→해남. 다도해·한려수도. 90개 코스',                                      source:'한국관광공사 두루누비', official_url:'https://www.durunubi.kr' },
  { id:'seohaerang',name:'서해랑길',                             region:'서해안',                 province:'전남/전북/충남/경기/인천',distance_km:1800,days_required:'90~120일',difficulty:'중',  camping:true,  backpacking:true,  category:'코리아둘레길', status:'운영중',            open_year:null, segments:109,highlights:'해남→강화. 갯벌·낙조·섬. 109개 코스',                                      source:'한국관광공사 두루누비', official_url:'https://www.durunubi.kr' },
  { id:'dmz-peace', name:'DMZ 평화의 길',                        region:'DMZ 접경',               province:'경기/강원',           distance_km:510,   days_required:'30~35일', difficulty:'중상',camping:false, backpacking:false, category:'코리아둘레길', status:'일부 제한운영',     open_year:null, segments:35, highlights:'강화→고성. DMZ 접경지역 안보+생태. 35개 코스',                               source:'한국관광공사 두루누비', official_url:'https://www.durunubi.kr' },
  // 국립공원
  { id:'jiri-jong', name:'지리산 주능선 종주',                   region:'지리산',                 province:'전남/경남',           distance_km:45,    days_required:'2~3일',   difficulty:'상',  camping:true,  backpacking:true,  category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'노고단→천왕봉. 칠선계곡·연하천 대피소. 국내 최고 종주 코스',                 source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'seorak-dr', name:'설악산 공룡능선',                      region:'설악산',                 province:'강원',               distance_km:15,    days_required:'1일',     difficulty:'최상',camping:false, backpacking:false, category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'기암괴석 절경. 가을 단풍 최고 명소',                                          source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'hallasan-s',name:'한라산 성판악 코스',                   region:'한라산',                 province:'제주',               distance_km:19.2,  days_required:'1일',     difficulty:'중상',camping:false, backpacking:false, category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'백록담 등정. 고산식물 군락. 입산통제 시간 준수 필수',                          source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'bukhan-dl', name:'북한산 둘레길',                        region:'북한산',                 province:'서울/경기',           distance_km:71,    days_required:'5~7일',   difficulty:'하',  camping:false, backpacking:false, category:'국립공원',     status:'운영중',            open_year:null, segments:21, highlights:'수도권 접근성 최고. 역사·문화 21코스',                                        source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'sobaek-j',  name:'소백산 연화봉 종주',                   region:'소백산',                 province:'경북/충북',           distance_km:23,    days_required:'1~2일',   difficulty:'중',  camping:true,  backpacking:true,  category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'철쭉 군락 (5~6월). 연화봉 전망대',                                             source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'deogyu-j',  name:'덕유산 향적봉 종주',                   region:'덕유산',                 province:'전북/경남',           distance_km:20,    days_required:'1~2일',   difficulty:'중상',camping:true,  backpacking:true,  category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'무주리조트 연계. 구천동 33경',                                                 source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'odae-s',    name:'오대산 선재길',                         region:'오대산',                 province:'강원',               distance_km:9,     days_required:'1일',     difficulty:'하',  camping:false, backpacking:false, category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'500년 전나무 숲길. 월정사 연계. 힐링 특화 코스',                               source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'taebaek',   name:'태백산 눈꽃 트레일',                   region:'태백산',                 province:'강원',               distance_km:11.5,  days_required:'1일',     difficulty:'중',  camping:false, backpacking:false, category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'겨울 설경 명소. 천제단·장군봉',                                               source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  { id:'naejang',   name:'내장산 단풍 트레일',                   region:'내장산',                 province:'전북',               distance_km:12,    days_required:'1일',     difficulty:'하',  camping:false, backpacking:false, category:'국립공원',     status:'운영중',            open_year:null, segments:null, highlights:'11색 단풍 (10~11월). 내장사',                                                 source:'국립공원공단', official_url:'https://www.knps.or.kr' },
  // 제주 올레
  { id:'olle-all',  name:'제주 올레 전체 (21코스)',               region:'제주 전역',              province:'제주',               distance_km:437,   days_required:'21~25일', difficulty:'중',  camping:true,  backpacking:false, category:'제주 올레',    status:'운영중',            open_year:null, segments:21, highlights:'제주 전 해안 일주. 세계적 도보 여행 브랜드',                                  source:'제주올레 공식', official_url:'https://www.jejuolle.org' },
  { id:'olle-1',    name:'제주 올레 1코스 (시흥~광치기)',          region:'제주 동부',              province:'제주',               distance_km:15.1,  days_required:'1일',     difficulty:'하',  camping:false, backpacking:false, category:'제주 올레',    status:'운영중',            open_year:null, segments:1,  highlights:'성산일출봉 조망. 올레 시작 코스',                                              source:'제주올레 공식', official_url:'https://www.jejuolle.org' },
  { id:'olle-7',    name:'제주 올레 7코스 (월정~행원)',            region:'제주 북부',              province:'제주',               distance_km:17.6,  days_required:'1일',     difficulty:'하',  camping:false, backpacking:false, category:'제주 올레',    status:'운영중',            open_year:null, segments:1,  highlights:'월정리 에메랄드 해변. 인기 최고 코스',                                        source:'제주올레 공식', official_url:'https://www.jejuolle.org' },
  // 지자체
  { id:'gyeonggi',  name:'경기 둘레길',                           region:'경기도 외곽',            province:'경기',               distance_km:860,   days_required:'25~30일', difficulty:'중',  camping:false, backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:60, highlights:'경기도 전체 외곽 순환. 60코스. 평화누리·숲길·물길·갯길 4권역',              source:'경기관광공사', official_url:'https://tour.gg.go.kr' },
  { id:'seoul-dl',  name:'서울 둘레길',                           region:'서울',                   province:'서울',               distance_km:157,   days_required:'7~8일',   difficulty:'중하',camping:false, backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:8,  highlights:'서울 외곽 산 8개 연결. 8코스. 지하철 접근 편리',                              source:'서울시 산림청 숲나들이', official_url:'https://www.foresttrip.go.kr' },
  { id:'jinan',     name:'진안고원길',                            region:'전북 진안',              province:'전북',               distance_km:200,   days_required:'10~15일', difficulty:'중',  camping:true,  backpacking:true,  category:'지자체 트레일',status:'운영중',            open_year:null, segments:15, highlights:'평균 고도 300m 이상 고원 순환. 15코스. 마이산·운장산·섬진강',              source:'진안고원길 공식', official_url:'https://www.jinan.go.kr' },
  { id:'nakdong',   name:'낙동정맥 트레일',                       region:'경북 전역',              province:'경북',               distance_km:389,   days_required:'25~30일', difficulty:'상',  camping:true,  backpacking:true,  category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'낙동강 분수령 종주. 동서트레일 경북 구간과 연계',                             source:'경상북도', official_url:'https://tour.gb.go.kr' },
  { id:'sokrisan',  name:'속리산 둘레길',                         region:'충북 보은·괴산 / 경북 문경·상주',province:'충북/경북',  distance_km:200,   days_required:'10~14일', difficulty:'중',  camping:true,  backpacking:false, category:'지자체 트레일',status:'운영중(일부 조성중)',open_year:null, segments:null, highlights:'속리산 권역 4개 시군. 보은 63km·괴산 71km 개통. 동서트레일 연결 예정',    source:'충청북도', official_url:'https://www.chungbuk.go.kr' },
  { id:'sobaek-jl', name:'소백산 자락길',                         region:'경북 영주·충북 단양',    province:'경북/충북',           distance_km:143,   days_required:'7~9일',   difficulty:'중하',camping:false, backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:12, highlights:'소수서원~죽계구곡~온달산성. 선비문화 + 소백산 생태. 12자락',              source:'영주시·단양군', official_url:'https://www.yeongju.go.kr' },
  { id:'byeonsan',  name:'변산마실길',                            region:'전북 부안',              province:'전북',               distance_km:65,    days_required:'4~5일',   difficulty:'하',  camping:true,  backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'채석강·격포 해수욕장·변산반도 해안',                                          source:'부안군', official_url:'https://www.buan.go.kr' },
  { id:'gyeongju',  name:'경주 역사 둘레길',                      region:'경북 경주',              province:'경북',               distance_km:152,   days_required:'5~7일',   difficulty:'하',  camping:false, backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'신라 천년 역사 유적지 연결. 보문호·남산·왕릉 탐방',                           source:'경주시', official_url:'https://www.gyeongju.go.kr' },
  { id:'gaya',      name:'가야산 둘레길',                         region:'경남 합천·경북 성주',    province:'경남/경북',           distance_km:60,    days_required:'3~4일',   difficulty:'중',  camping:true,  backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'해인사 연계. 가야 문화권. 홍류동 계곡',                                        source:'합천군·성주군', official_url:'' },
  { id:'juwang',    name:'주왕산 트레일',                         region:'경북 청송',              province:'경북',               distance_km:30,    days_required:'1~2일',   difficulty:'중',  camping:true,  backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'주왕암·주방계곡·절골계곡. 기암 절경 대표 코스',                               source:'청송군', official_url:'' },
  { id:'suncheon',  name:'순천만 갈대 둘레길',                    region:'전남 순천',              province:'전남',               distance_km:12,    days_required:'1일',     difficulty:'하',  camping:false, backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'순천만 갈대밭·흑두루미. 람사르 습지 생태 탐방',                               source:'순천시', official_url:'https://www.suncheon.go.kr' },
  { id:'dadohae',   name:'다도해 올레 (완도·신안)',               region:'전남 완도·신안',         province:'전남',               distance_km:150,   days_required:'7~10일',  difficulty:'중하',camping:true,  backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'다도해 섬 연결 트레일. 청산도 슬로길 포함',                                   source:'전라남도', official_url:'https://www.jeonnam.go.kr' },
  { id:'gangwon',   name:'강원 둘레길 (영서~영동)',               region:'강원 전역',              province:'강원',               distance_km:320,   days_required:'20일',    difficulty:'중상',camping:true,  backpacking:true,  category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'영서~영동 횡단. 설악·오대·태백·치악 연계',                                   source:'강원특별자치도', official_url:'https://www.gwtrail.kr' },
  { id:'taean-c',   name:'태안 해변길',                           region:'충남 태안',              province:'충남',               distance_km:97,    days_required:'5~6일',   difficulty:'하',  camping:true,  backpacking:false, category:'지자체 트레일',status:'운영중',            open_year:null, segments:null, highlights:'서해 해변·해송길. 천리포수목원 경유. 동서트레일 서쪽 연계',                  source:'태안군', official_url:'https://tour.taean.go.kr' },
  // 백두대간
  { id:'bdt-full',  name:'백두대간 (전체 종주)',                  region:'강원~경북~충북~전북',    province:'강원/경북/충북/전북', distance_km:684,   days_required:'40~60일', difficulty:'최상',camping:true,  backpacking:true,  category:'백두대간',     status:'운영중',            open_year:null, segments:null, highlights:'한반도 척추. 진부령~지리산 천왕봉. 국내 최고 난이도 종주',                   source:'산림청', official_url:'https://www.forest.go.kr' },
];

// ── GPX 시작점 데이터 ────────────────────────────────────────────
const gpxData = [
  { trail_id:'et-all',    lat:36.5183, lng:126.3167, elevation_m:5,   start_point:'충남 태안 안면도 자연휴양림' },
  { trail_id:'et-55',     lat:36.9875, lng:129.4118, elevation_m:15,  start_point:'경북 울진 망양정 해수욕장' },
  { trail_id:'et-1to4',   lat:36.4373, lng:126.3254, elevation_m:3,   start_point:'충남 태안 꽃지 해수욕장' },
  { trail_id:'et-47',     lat:36.9431, lng:128.9203, elevation_m:520, start_point:'경북 봉화 국립백두대간수목원 입구' },
  { trail_id:'et-9to12',  lat:36.5983, lng:126.6606, elevation_m:50,  start_point:'충남 홍성 홍성읍 오관리' },
  { trail_id:'et-48to54', lat:36.9412, lng:128.9850, elevation_m:480, start_point:'경북 봉화 춘양면' },
  { trail_id:'jiri-dl',   lat:35.3396, lng:127.7307, elevation_m:180, start_point:'전북 남원 주천면 노치마을' },
  { trail_id:'bdt-trail', lat:37.9852, lng:128.1234, elevation_m:780, start_point:'강원 홍천 내촌면 물걸리' },
  { trail_id:'dmz-punch', lat:38.2000, lng:128.1167, elevation_m:400, start_point:'강원 양구 해안면 펀치볼' },
  { trail_id:'daegwall',  lat:37.6861, lng:128.7353, elevation_m:840, start_point:'강원 평창 대관령면 횡계' },
  { trail_id:'naepo',     lat:36.7004, lng:126.4983, elevation_m:80,  start_point:'충남 서산 해미읍성' },
  { trail_id:'uljin-gg',  lat:36.8521, lng:129.2074, elevation_m:320, start_point:'경북 울진 서면 소광리' },
  { trail_id:'hallasan-dl',lat:33.3617,lng:126.5292, elevation_m:600, start_point:'제주 서귀포 남원읍 수망리' },
  { trail_id:'daejeon-dl',lat:36.3504, lng:127.3845, elevation_m:150, start_point:'대전 대덕구 장동 계족산' },
  { trail_id:'haeparang', lat:35.0770, lng:129.0929, elevation_m:5,   start_point:'부산 남구 오륙도 해맞이공원' },
  { trail_id:'namparang', lat:35.0765, lng:129.0731, elevation_m:5,   start_point:'부산 영도 태종대' },
  { trail_id:'seohaerang',lat:34.4768, lng:126.5282, elevation_m:3,   start_point:'전남 해남 땅끝마을' },
  { trail_id:'dmz-peace', lat:37.7123, lng:126.4875, elevation_m:30,  start_point:'인천 강화군 강화읍 갑곶돈대' },
  { trail_id:'jiri-jong', lat:35.3236, lng:127.5695, elevation_m:1507,start_point:'전남 구례 노고단 탐방지원센터' },
  { trail_id:'seorak-dr', lat:38.1194, lng:128.4657, elevation_m:1275,start_point:'강원 속초 설악동 소공원' },
  { trail_id:'hallasan-s',lat:33.3622, lng:126.6345, elevation_m:750, start_point:'제주 제주시 성판악 탐방지원센터' },
  { trail_id:'bukhan-dl', lat:37.6584, lng:126.9782, elevation_m:120, start_point:'서울 은평구 진관동 진관생태다리' },
  { trail_id:'sobaek-j',  lat:36.9587, lng:128.4893, elevation_m:1394,start_point:'경북 영주 희방사 탐방지원센터' },
  { trail_id:'deogyu-j',  lat:35.8374, lng:127.7352, elevation_m:640, start_point:'전북 무주 구천동 탐방지원센터' },
  { trail_id:'odae-s',    lat:37.7291, lng:128.5526, elevation_m:680, start_point:'강원 평창 진부면 월정사' },
  { trail_id:'taebaek',   lat:37.0965, lng:128.9167, elevation_m:870, start_point:'강원 태백 당골 탐방지원센터' },
  { trail_id:'naejang',   lat:35.4833, lng:126.8881, elevation_m:120, start_point:'전북 정읍 내장동 내장사 주차장' },
  { trail_id:'olle-all',  lat:33.4271, lng:126.9203, elevation_m:10,  start_point:'제주 서귀포 시흥초등학교 (1코스 시작)' },
  { trail_id:'olle-1',    lat:33.4271, lng:126.9203, elevation_m:10,  start_point:'제주 서귀포 시흥초등학교' },
  { trail_id:'olle-7',    lat:33.5613, lng:126.8001, elevation_m:5,   start_point:'제주 제주시 구좌읍 월정리 해변' },
  { trail_id:'gyeonggi',  lat:37.0671, lng:126.8019, elevation_m:10,  start_point:'경기 평택 포승읍 대명항' },
  { trail_id:'seoul-dl',  lat:37.4844, lng:127.1181, elevation_m:150, start_point:'서울 수서역 부근 (1코스 시작)' },
  { trail_id:'jinan',     lat:35.7912, lng:127.4125, elevation_m:320, start_point:'전북 진안읍 마이산 탐방지원센터' },
  { trail_id:'nakdong',   lat:37.0621, lng:128.7954, elevation_m:580, start_point:'경북 봉화 태백 매봉산 인근' },
  { trail_id:'sokrisan',  lat:36.5353, lng:127.8620, elevation_m:280, start_point:'충북 보은 속리산면 법주사' },
  { trail_id:'sobaek-jl', lat:36.8693, lng:128.6017, elevation_m:210, start_point:'경북 영주 순흥면 소수서원' },
  { trail_id:'byeonsan',  lat:35.6717, lng:126.6038, elevation_m:5,   start_point:'전북 부안 격포항' },
  { trail_id:'gyeongju',  lat:35.8562, lng:129.2247, elevation_m:30,  start_point:'경북 경주 보문호 탐방지원센터' },
  { trail_id:'gaya',      lat:35.7987, lng:128.1008, elevation_m:430, start_point:'경남 합천 가야면 홍류동 계곡 입구' },
  { trail_id:'juwang',    lat:36.3906, lng:129.1541, elevation_m:250, start_point:'경북 청송 부동면 주왕산 탐방지원센터' },
  { trail_id:'suncheon',  lat:34.8833, lng:127.5167, elevation_m:3,   start_point:'전남 순천 해룡면 순천만 생태공원' },
  { trail_id:'dadohae',   lat:34.1764, lng:126.9097, elevation_m:5,   start_point:'전남 완도 청산도 도청항' },
  { trail_id:'gangwon',   lat:37.8813, lng:127.7298, elevation_m:180, start_point:'강원 춘천 소양강 댐' },
  { trail_id:'taean-c',   lat:36.7746, lng:126.3243, elevation_m:5,   start_point:'충남 태안 원북면 백리포 해수욕장' },
  { trail_id:'bdt-full',  lat:38.2016, lng:128.2996, elevation_m:530, start_point:'강원 고성 진부령 (북쪽 시점)' },
];

// ── 시즌 데이터 ──────────────────────────────────────────────────
const seasonData = [
  { trail_id:'et-all',    spring:5, summer:3, fall:5, winter:2, best_months:[4,5,6,9,10,11], terrain_tags:['숲길','마을길','임도','해안'],       note_spring:'철쭉·벚꽃 개화. 4~5월 서쪽 태안 구간 최고',          note_summer:'금강송 숲 그늘 좋으나 고온다습. 충분한 수분 보충 필수', note_fall:'경북 구간 단풍 절정(10~11월). 전 구간 최적 시즌', note_winter:'동파 위험·결빙 주의. 충북 이동식 구간 통제 가능' },
  { trail_id:'et-55',     spring:4, summer:4, fall:5, winter:2, best_months:[4,5,9,10,11],   terrain_tags:['숲길','해안','계곡'],                  note_spring:'4~5월 금강송 신록 아름다움. 산행 최적',              note_summer:'동해안 해풍으로 비교적 선선. 성류굴 내부 시원',       note_fall:'금강소나무 숲 황금빛 단풍. 10월 중순 절정',        note_winter:'동해 설경 장관이나 해안 도로 결빙 주의' },
  { trail_id:'et-1to4',   spring:5, summer:3, fall:4, winter:3, best_months:[3,4,5,10,11],   terrain_tags:['해안','해송림','마을길'],               note_spring:'3~5월 유채꽃·철쭉 개화. 꽃지 해변 낙조 명소',        note_summer:'해수욕 연계 가능하나 고온. 이른 아침 산행 권장',      note_fall:'10~11월 단풍·억새. 서해 낙조 포인트 다수',         note_winter:'서해안 겨울 바람 강함. 방풍복 필수. 비교적 평탄하여 가능' },
  { trail_id:'jiri-dl',   spring:5, summer:3, fall:5, winter:3, best_months:[3,4,5,9,10,11], terrain_tags:['숲길','마을길','계곡'],                 note_spring:'산벚꽃·진달래·철쭉 릴레이. 3~5월 화개~쌍계사 구간 백미', note_summer:'계곡 구간은 쾌적하나 마을길 구간 炎熱 주의',         note_fall:'피아골·뱀사골 단풍 전국 최고 수준. 10월 중순~11월 초', note_winter:'적설 시 일부 구간 통제. 남부 구간(하동·구례)은 비교적 온화' },
  { trail_id:'haeparang', spring:4, summer:3, fall:5, winter:3, best_months:[4,5,9,10,11],   terrain_tags:['해안길','숲길','어촌마을'],             note_spring:'4~5월 해안 벚꽃+유채. 동해 파도 잔잔하여 해안 구간 쾌적', note_summer:'해수욕 연계 가능. 그러나 태양 노출 심함. 자외선 차단 필수', note_fall:'단풍+동해 쪽빛 바다 조합. 전 구간 최적 시즌', note_winter:'동해 설경 아름답지만 해풍 거셈. 방풍 장비 필수' },
  { trail_id:'jiri-jong', spring:4, summer:3, fall:5, winter:2, best_months:[5,6,9,10],      terrain_tags:['능선','고산'],                          note_spring:'철쭉 군락(5월 중순). 대피소 예약 극히 어려움. 3개월 전 경쟁', note_summer:'고산 대피소 수용 인원 초과. 야간 낙뢰 주의',         note_fall:'피아골 단풍+능선 조망. 10월 첫째 주 최절정', note_winter:'동계 등반 경험자만. 아이젠·스패츠 필수' },
  { trail_id:'olle-all',  spring:5, summer:3, fall:5, winter:4, best_months:[3,4,5,10,11,12],terrain_tags:['해안길','오름','마을길'],               note_spring:'유채꽃+벚꽃. 3~4월 제주 최고 성수기. 숙소 사전 예약 필수', note_summer:'무덥고 습함. 동쪽 해안 구간 해풍 덕분에 비교적 양호', note_fall:'억새+단풍+비자림. 10~11월 완주 최적 시즌', note_winter:'겨울에도 온화. 비·바람 많으나 한산. 완주 도전자 선호' },
  { trail_id:'bdt-full',  spring:3, summer:4, fall:5, winter:1, best_months:[5,6,9,10],      terrain_tags:['고산능선','암릉','원시숲'],             note_spring:'5~6월 신록+철쭉. 4월까지 잔설 구간 다수. 아이젠 지참', note_summer:'고산 고원 구간 시원. 여름 전반기 최적. 오후 낙뢰 필수 주의', note_fall:'9~10월 전국 최장 단풍 릴레이. 종주자 최선호 시즌', note_winter:'고산 폭설·결빙 극심. 동계 전문 장비+경험 없이 절대 불가' },
  { trail_id:'suncheon',  spring:3, summer:2, fall:5, winter:5, best_months:[10,11,12,1],    terrain_tags:['갈대밭','습지','해안'],                 note_spring:'봄 갈대밭 연한 초록. 비교적 한산', note_summer:'고온다습 갈대밭. 모기 극성. 비추천 시즌', note_fall:'황금 갈대+흑두루미 도래. 10~11월 전국 최고 명소', note_winter:'흑두루미 월동(11~3월). 갈대 설경 장관. 국내 최고 겨울 트래킹' },
  { trail_id:'odae-s',    spring:4, summer:5, fall:5, winter:4, best_months:[5,6,7,8,9,10,11],terrain_tags:['전나무숲','계곡길','사찰'],            note_spring:'전나무 신록+월정사 봄꽃', note_summer:'전나무 숲 그늘 최고. 여름 피서형 힐링 코스 1위', note_fall:'단풍+전나무 조화 환상적. 9월 말~10월 초 절정', note_winter:'눈 쌓인 전나무 숲 설국. 사계절 탐방 가능한 최고 코스' },
];

// ── 시드 실행 ────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding trails...');
  const { error: e1 } = await supabase.from('trails').upsert(trails, { onConflict: 'id' });
  if (e1) { console.error('trails error:', e1.message); return; }
  console.log(`✅ ${trails.length}개 트레일 삽입 완료`);

  console.log('🌱 Seeding GPX...');
  const { error: e2 } = await supabase.from('trail_gpx').upsert(gpxData, { onConflict: 'trail_id' });
  if (e2) { console.error('gpx error:', e2.message); return; }
  console.log(`✅ ${gpxData.length}개 GPX 좌표 삽입 완료`);

  console.log('🌱 Seeding seasons...');
  const { error: e3 } = await supabase.from('trail_seasons').upsert(seasonData, { onConflict: 'trail_id' });
  if (e3) { console.error('season error:', e3.message); return; }
  console.log(`✅ ${seasonData.length}개 시즌 데이터 삽입 완료`);

  console.log('🎉 시드 완료!');
}

seed();
