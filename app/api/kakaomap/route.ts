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
      border-radius:12px; padding:10px 12px; max-height:80vh; overflow-y:auto;
    }
    #legend p.tit { font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:.1em; margin-bottom:6px; font-family:sans-serif; }
    #legend .sep { height:1px; background:rgba(255,255,255,0.08); margin:8px 0 6px; }
    .leg-item { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
    .leg-dot { width:10px; height:10px; border-radius:50%; }
    .leg-sq  { width:10px; height:10px; border-radius:3px; }
    .leg-text { font-size:10px; color:#cbd5e1; font-family:sans-serif; }
    #btn-all {
      position:absolute; bottom:16px; right:16px; z-index:10;
      padding:8px 14px; font-size:12px; font-weight:700;
      background:rgba(15,23,42,0.9); border:1px solid rgba(16,185,129,0.5);
      color:#10b981; border-radius:8px; cursor:pointer; font-family:sans-serif;
    }
    #toggle-forests {
      position:absolute; bottom:16px; right:120px; z-index:10;
      padding:8px 14px; font-size:12px; font-weight:700;
      background:rgba(15,23,42,0.9); border:1px solid rgba(8,145,178,0.6);
      color:#22d3ee; border-radius:8px; cursor:pointer; font-family:sans-serif;
    }
    #toggle-forests.off { opacity:0.45; }
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
    <p class="tit">트레일</p>
    <div class="leg-item"><div class="leg-dot" style="background:#f97316"></div><span class="leg-text">동서트레일</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#22c55e"></div><span class="leg-text">국가숲길</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#0ea5e9"></div><span class="leg-text">코리아둘레길</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#a78bfa"></div><span class="leg-text">국립공원</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#f59e0b"></div><span class="leg-text">제주 올레</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#ef4444"></div><span class="leg-text">지자체 트레일</span></div>
    <div class="leg-item"><div class="leg-dot" style="background:#94a3b8"></div><span class="leg-text">백두대간</span></div>
    <div class="sep"></div>
    <p class="tit">자연휴양림</p>
    <div class="leg-item"><div class="leg-sq" style="background:#16a34a"></div><span class="leg-text">국립</span></div>
    <div class="leg-item"><div class="leg-sq" style="background:#0891b2"></div><span class="leg-text">공립</span></div>
    <div class="leg-item"><div class="leg-sq" style="background:#d97706"></div><span class="leg-text">사립</span></div>
  </div>
  <button id="toggle-forests" onclick="toggleForests()">🏕 휴양림 표시</button>
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
    const FOREST_COLORS = { '국립':'#16a34a','공립':'#0891b2','사립':'#d97706' };
    const FOREST_EMOJI  = { '국립':'🌲','공립':'🏕','사립':'🏡' };

    let map, trails = [], forests = [], activeOverlay = null;
    let forestMarkers = [], forestsVisible = true;

    function initMap() {
      if (typeof kakao === 'undefined' || !kakao.maps) { setTimeout(initMap, 100); return; }
      kakao.maps.load(function() {
        document.getElementById('loading').style.display = 'none';
        map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(36.5, 127.8),
          level: 12
        });
        window.addEventListener('message', function(e) {
          if (!e.data) return;
          if (e.data.type === 'INIT_TRAILS') { trails = e.data.trails; renderMarkers(trails); }
          if (e.data.type === 'INIT_FORESTS') { forests = e.data.forests; renderForests(forests); }
          if (e.data.type === 'FILTER') {
            renderMarkers(e.data.category === '전체' ? trails : trails.filter(function(t){ return t.category === e.data.category; }));
          }
          if (e.data.type === 'FILTER_FORESTS') {
            var cat = e.data.category;
            renderForests(cat === '전체' ? forests : forests.filter(function(f){ return f.category === cat; }));
          }
          if (e.data.type === 'TOGGLE_FORESTS') { setForestsVisible(e.data.visible); }
          if (e.data.type === 'SELECT') {
            var t = trails.find(function(t){ return t.id === e.data.id; });
            if (t && t.gpx) { map.panTo(new kakao.maps.LatLng(t.gpx.lat, t.gpx.lng)); map.setLevel(7); }
          }
          if (e.data.type === 'SELECT_FOREST') {
            var f = forests.find(function(f){ return f.id === e.data.id; });
            if (f && f.lat) { map.panTo(new kakao.maps.LatLng(f.lat, f.lng)); map.setLevel(6); }
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

    function renderForests(list) {
      forestMarkers.forEach(function(m){ m.setMap(null); });
      forestMarkers = [];
      list.filter(function(f){ return f.lat && f.lng; }).forEach(function(forest) {
        var color = FOREST_COLORS[forest.category] || '#0891b2';
        var emoji = FOREST_EMOJI[forest.category] || '🏕';
        var pos = new kakao.maps.LatLng(forest.lat, forest.lng);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">'
          + '<path d="M15 0L30 13v12a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V13z" fill="' + color + '" opacity="0.95"/>'
          + '<text x="15" y="22" text-anchor="middle" font-size="12">' + emoji + '</text></svg>';
        var img = new kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          new kakao.maps.Size(30, 38), { offset: new kakao.maps.Point(15, 38) }
        );
        var marker = new kakao.maps.Marker({ position: pos, image: img, map: forestsVisible ? map : null });
        kakao.maps.event.addListener(marker, 'click', function() {
          if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }
          var lottery = (forest.lottery_targets && forest.lottery_targets.length)
            ? forest.lottery_targets.join(', ') : '없음';
          var resv = forest.reservation_url
            ? '<a href="' + forest.reservation_url + '" target="_blank" style="color:#22d3ee;text-decoration:none">예약 바로가기 →</a>'
            : (forest.reservation_org || '개별 문의');
          var div = document.createElement('div');
          div.style.cssText = 'background:#0f172a;border:2px solid ' + color
            + ';border-radius:12px;padding:12px 14px;min-width:230px;max-width:280px;'
            + 'font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.6);position:relative;bottom:12px;';
          div.innerHTML = '<button onclick="closeOverlay()" style="position:absolute;top:6px;right:10px;'
            + 'background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer">✕</button>'
            + '<p style="margin:0 0 2px;font-size:13px;font-weight:800;color:#f1f5f9">' + emoji + ' ' + forest.name + '</p>'
            + '<p style="margin:0 0 8px;font-size:11px;color:#64748b">' + forest.category + ' · ' + forest.sigungu + '</p>'
            + '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">'
            +   (forest.has_room ? '<span style="font-size:10px;background:rgba(34,197,94,0.15);color:#4ade80;border-radius:5px;padding:2px 6px">🛏 객실</span>' : '')
            +   (forest.has_camp ? '<span style="font-size:10px;background:rgba(8,145,178,0.18);color:#22d3ee;border-radius:5px;padding:2px 6px">⛺ 야영장</span>' : '')
            +   (forest.has_waitlist ? '<span style="font-size:10px;background:rgba(255,255,255,0.06);color:#cbd5e1;border-radius:5px;padding:2px 6px">⏳ 대기예약</span>' : '')
            + '</div>'
            + '<div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;margin-bottom:6px">'
            +   '<p style="margin:0;font-size:10px;color:#94a3b8">예약 방식</p>'
            +   '<p style="margin:2px 0 0;font-size:11px;color:#e2e8f0">' + (forest.fcfs_type || '문의') + (forest.open_time ? ' · ' + forest.open_time : '') + '</p>'
            + '</div>'
            + '<p style="margin:0 0 4px;font-size:10px;color:#94a3b8">추첨제 대상: <span style="color:#cbd5e1">' + lottery + '</span></p>'
            + '<p style="margin:6px 0 0;font-size:11px">' + resv + '</p>';
          activeOverlay = new kakao.maps.CustomOverlay({ position: pos, content: div, yAnchor: 1.3 });
          activeOverlay.setMap(map);
          map.panTo(pos);
          window.parent.postMessage({ type: 'FOREST_CLICK', id: forest.id }, '*');
        });
        forestMarkers.push(marker);
      });
    }

    function setForestsVisible(v) {
      forestsVisible = v;
      forestMarkers.forEach(function(m){ m.setMap(v ? map : null); });
      var btn = document.getElementById('toggle-forests');
      btn.classList.toggle('off', !v);
      btn.textContent = v ? '🏕 휴양림 표시' : '🏕 휴양림 숨김';
    }
    function toggleForests() {
      setForestsVisible(!forestsVisible);
      window.parent.postMessage({ type: 'FORESTS_TOGGLED', visible: forestsVisible }, '*');
    }

    function closeOverlay() { if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; } }
    function resetMap() { map.setCenter(new kakao.maps.LatLng(36.5, 127.8)); map.setLevel(12); closeOverlay(); }

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
