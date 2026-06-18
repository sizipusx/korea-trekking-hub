// app/api/kakaomap-route/route.ts
// course id를 받아 GPX 경로를 카카오맵 폴리라인으로 그려주는 HTML 반환
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '';

  // Kakao SDK를 서버에서 인라인으로 내려받아 CSP 문제 없이 사용
  let sdk = '';
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`,
      { cache: 'no-store' }
    );
    sdk = await res.text();
  } catch {
    sdk = '';
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:100vw; height:100vh; overflow:hidden; background:#0f172a; font-family:sans-serif; }
    #map { width:100%; height:100%; }
    #overlay {
      position:absolute; inset:0; background:#0f172a;
      display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:20;
    }
    .spinner {
      width:36px; height:36px; border:2px solid rgba(16,185,129,0.3);
      border-top-color:#10b981; border-radius:50%;
      animation:spin .8s linear infinite; margin-bottom:10px;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    #overlay p { color:#94a3b8; font-size:13px; }
    #info-bar {
      position:absolute; bottom:0; left:0; right:0; z-index:10;
      background:rgba(15,23,42,0.88); border-top:1px solid rgba(16,185,129,0.25);
      padding:8px 14px; display:flex; gap:18px; align-items:center; flex-wrap:wrap;
    }
    .stat { display:flex; flex-direction:column; }
    .stat-label { font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; }
    .stat-value { font-size:13px; font-weight:700; color:#e2e8f0; margin-top:1px; }
    #error-box {
      position:absolute; inset:0; background:#0f172a;
      display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:20;
      display:none;
    }
    #error-box p { color:#f87171; font-size:13px; margin-top:8px; }
    #error-box span { font-size:32px; }
  </style>
</head>
<body>
  <div id="overlay">
    <div class="spinner"></div>
    <p>경로 불러오는 중…</p>
  </div>
  <div id="error-box">
    <span>🗺️</span>
    <p id="error-msg">GPX 경로 정보가 없습니다</p>
  </div>
  <div id="map"></div>
  <div id="info-bar" style="display:none">
    <div class="stat"><span class="stat-label">코스명</span><span class="stat-value" id="s-name">—</span></div>
    <div class="stat"><span class="stat-label">카테고리</span><span class="stat-value" id="s-cat">—</span></div>
    <div class="stat"><span class="stat-label">거리</span><span class="stat-value" id="s-dist">—</span></div>
    <div class="stat"><span class="stat-label">누적 고도</span><span class="stat-value" id="s-elev">—</span></div>
    <div class="stat"><span class="stat-label">트랙 포인트</span><span class="stat-value" id="s-pts">—</span></div>
  </div>

  <script>
    ${sdk}

    const COURSE_ID = ${JSON.stringify(id)};

    function showError(msg) {
      document.getElementById('overlay').style.display = 'none';
      document.getElementById('error-msg').textContent = msg;
      document.getElementById('error-box').style.display = 'flex';
    }

    async function init() {
      // 1. GPX 좌표 fetch
      let routeData;
      try {
        const res = await fetch('/api/gpx-route?id=' + encodeURIComponent(COURSE_ID));
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          showError(body.error ?? 'GPX 경로를 불러올 수 없습니다');
          return;
        }
        routeData = await res.json();
      } catch (e) {
        showError('네트워크 오류: ' + e.message);
        return;
      }

      // 2. 정보 바 채우기
      document.getElementById('s-name').textContent  = routeData.course_name  ?? '—';
      document.getElementById('s-cat').textContent   = routeData.category     ?? '—';
      document.getElementById('s-dist').textContent  = routeData.distance_km != null ? routeData.distance_km.toFixed(1) + ' km' : '—';
      document.getElementById('s-elev').textContent  = routeData.elev_gain_m != null ? Math.round(routeData.elev_gain_m) + ' m' : '—';
      document.getElementById('s-pts').textContent   = (routeData.coords?.length ?? 0) + ' pts';
      document.getElementById('info-bar').style.display = 'flex';

      // 3. 카카오맵 초기화
      kakao.maps.load(() => {
        const coords = routeData.coords; // [[lat, lng], ...]
        if (!coords || coords.length === 0) {
          showError('트랙 포인트가 없습니다');
          return;
        }

        // 중심점: 첫 좌표
        const center = new kakao.maps.LatLng(coords[0][0], coords[0][1]);
        const map = new kakao.maps.Map(document.getElementById('map'), {
          center,
          level: 6,
        });

        // 폴리라인 그리기
        const path = coords.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng));
        const polyline = new kakao.maps.Polyline({
          path,
          strokeWeight: 4,
          strokeColor: '#10b981',
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
        });
        polyline.setMap(map);

        // 시작 마커
        new kakao.maps.Marker({
          map,
          position: path[0],
          title: '출발',
        });

        // 도착 마커 (다른 색상 - 커스텀 이미지)
        const endMarker = new kakao.maps.Marker({
          map,
          position: path[path.length - 1],
          title: '도착',
        });

        // 경계 맞추기
        const bounds = new kakao.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        map.setBounds(bounds);

        // 로딩 숨기기
        document.getElementById('overlay').style.display = 'none';
      });
    }

    init();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
