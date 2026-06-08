import { NextResponse } from 'next/server';

async function fetchKakaoSDK(appkey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false&libraries=clusterer`,
      { cache: 'force-cache' }
    );
    return await res.text();
  } catch {
    return '';
  }
}

export async function GET() {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '';
  const sdk = await fetchKakaoSDK(kakaoKey);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { width:100vw; height:100vh; overflow:hidden; background:#0f172a; }
    #map { width:100%; height:100%; }
    #legend {
      position:absolute; top:12px; left:12px; z-index:10;
      background:rgba(15,23,42,0.88); border:1px solid rgba(255,255,255,0.1);
      border-radius:12px; padding:10px 12px;
    }
    #legend p { font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:.1em; margin-bottom:6px; font-family:sans-serif; }
    .leg-item { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
    .leg-dot { width:10px; height:10px; border-radius:50%; }
    .leg-text { font-size:10px; color:#cbd5e1; font-family:sans-serif; }
    #btn-all {
      position:absolute; bottom:16px; right:16px; z-index:10;
      padding:8px 14px; font-size:12px; font-weight:700;
      background:rgba(15,23,42,0.9); border:1px solid rgba(16,185,129,0.5);
      color:#10b981; border-radius:8px; cursor:pointer; font-family:sans-serif;
    }
    #loading {
      position:absolute; inset:0; background:#0f172a;
      display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:20;
    }
    .spinner {
      width:40px; height:40px; border:2px solid rgba(16,185,129,0.3);
      border-top-color:#10b981; border-radius:50%;
      animation:spin .8s linear infinite; margin-bottom:12px;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <p style="color:#10b981;font-size:14px;font-family:sans-serif">카카오맵 로딩 중...</p>
  </div>
  <div id="map"></div>
  <div id="legend">
    <p>범례</p>
    <div class="leg-item"><div class="leg-dot" style="background:#f97316"></div><span class="leg-text">동서트레일</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#22c55e"></div><span class="leg-text">국가숲길</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#0ea5e9"></div><span class="leg-text">코리아둘레길</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#a78bfa"></div><span class="leg-text">국립공원</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#f59e0b"></div><span class="leg-text">제주 올레</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#ef4444"></div><span class="leg-text">지자체 트레일</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#94a3b8"></div><span class="leg-text">백두대간</span></div>
  </div>
  <button id="btn-all" onclick="resetMap()">🗺 전체 보기</button>

  <script>${sdk}</script>
  <script>
    const CAT_COLORS = {
      '동서트레일':'#f97316','국가숲길':'#22c55e','코리아둘레길':'#0ea5e9',
      '국립공원':'#a78bfa','제주 올레':'#f59e0b','지자체 트레일':'#ef4444','백두대간':'#94a3b8'
    };
    const CAT_EMOJI = {
      '동서트레일':'🟠','국가숲길':'🟢','코리아둘레길':'🔵',
      '국립공원':'🟣','제주 올레':'🌊','지자체 트레일':'🔴','백두대간':'⚫'
    };
    let map, trails = [], activeOverlay = null;

    function initMap() {
      if (typeof kakao === 'undefined' || !kakao.maps) {
        setTimeout(initMap, 100);
        return;
      }
      kakao.maps.load(function() {
        document.getElementById('loading').style.display = 'none';
        map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(36.5, 127.8),
          level: 8
        });
        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'INIT_TRAILS') { trails = e.data.trails; renderMarkers(trails); }
          if (e.data && e.data.type === 'FILTER') {
            renderMarkers(e.data.category === '전체' ? trails : trails.filter(function(t){ return t.category === e.data.category; }));
          }
          if (e.data && e.data.type === 'SELECT') {
            var t = trails.find(function(t){ return t.id === e.data.id; });
            if (t && t.gpx) { map.panTo(new kakao.maps.LatLng(t.gpx.lat, t.gpx.lng)); map.setLevel(5); }
          }
        });
        window.parent.postMessage({ type: 'MAP_READY' }, '*');
      });
    }

    function renderMarkers(list) {
      if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }
      list.filter(function(t){ return t.gpx; }).forEach(function(trail) {
        var color = CAT_COLORS[trail.category] || '#10b981';
        var emoji = CAT_EMOJI[trail.category] || '🗺';
        var pos = new kakao.maps.LatLng(trail.gpx.lat, trail.gpx.lng);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">'
          + '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="' + color + '"/>'
          + '<text x="18" y="23" text-anchor="middle" font-size="13">' + emoji + '</text></svg>';
        var img = new kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          new kakao.maps.Size(36, 44), { offset: new kakao.maps.Point(18, 44) }
        );
        var marker = new kakao.maps.Marker({ position: pos, image: img, map: map });
        kakao.maps.event.addListener(marker, 'click', function() {
          if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }
          var div = document.createElement('div');
          div.style.cssText = 'background:#0f172a;border:2px solid ' + color
            + ';border-radius:12px;padding:12px 14px;min-width:200px;'
            + 'font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.6);position:relative;bottom:12px;';
          div.innerHTML = '<button onclick="closeOverlay()" style="position:absolute;top:6px;right:10px;'
            + 'background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer">✕</button>'
            + '<p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#f1f5f9">' + trail.name + '</p>'
            + '<p style="margin:0 0 8px;font-size:11px;color:#64748b">📍 ' + trail.region + '</p>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">'
            + '<div style="background:rgba(255,255,255,0.06);border-radius:6px;padding:4px 8px">'
            + '<p style="margin:0;font-size:11px;color:#10b981">📏 ' + trail.distance_km + 'km</p></div>'
            + '<div style="background:rgba(255,255,255,0.06);border-radius:6px;padding:4px 8px">'
            + '<p style="margin:0;font-size:11px;color:#f59e0b">⛰ ' + trail.difficulty + '</p></div></div>';
          activeOverlay = new kakao.maps.CustomOverlay({ position: pos, content: div, yAnchor: 1.3 });
          activeOverlay.setMap(map);
          map.panTo(pos);
          window.parent.postMessage({ type: 'MARKER_CLICK', id: trail.id }, '*');
        });
      });
    }

    function closeOverlay() { if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; } }
    function resetMap() { map.setCenter(new kakao.maps.LatLng(36.5, 127.8)); map.setLevel(8); closeOverlay(); }

    initMap();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}