import { NextResponse } from 'next/server';

async function fetchKakaoSDK(appkey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false`,
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
    #count-badge {
      position:absolute; top:12px; left:12px; z-index:10;
      background:rgba(15,23,42,0.9); border:1px solid rgba(16,185,129,0.4);
      border-radius:10px; padding:8px 12px;
      font-family:sans-serif; font-size:11px; color:#94a3b8;
    }
    #count-badge strong { color:#10b981; font-size:14px; }
    #btn-all {
      position:absolute; bottom:16px; right:16px; z-index:10;
      padding:8px 14px; font-size:12px; font-weight:700;
      background:rgba(15,23,42,0.9); border:1px solid rgba(16,185,129,0.5);
      color:#10b981; border-radius:8px; cursor:pointer; font-family:sans-serif;
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <p style="color:#10b981;font-size:14px;font-family:sans-serif">코스 지도 로딩 중...</p>
  </div>
  <div id="map"></div>
  <div id="count-badge">마커: <strong id="cnt">0</strong>개</div>
  <button id="btn-all" onclick="resetMap()">🗺 전체 보기</button>

  <script>${sdk}</script>
  <script>
    const CAT_COLORS = {
      '등산로':'#ef4444','둘레길':'#22c55e','숲길':'#16a34a','트레킹길':'#3b82f6',
      '테마길':'#a855f7','오름':'#f97316','섬트레킹':'#06b6d4','문화길':'#f59e0b',
      '국가숲길':'#10b981','정맥종주':'#dc2626','종주':'#7c3aed','기타':'#64748b'
    };
    const CAT_EMOJI = {
      '등산로':'🏔','둘레길':'🔄','숲길':'🌲','트레킹길':'🥾',
      '테마길':'🎭','오름':'🌋','섬트레킹':'🏝','문화길':'🏛',
      '국가숲길':'🌿','정맥종주':'⛰','종주':'🗻','기타':'📍'
    };

    let map, courses = [], activeOverlay = null, currentMarkers = [];

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
          if (e.data.type === 'INIT_COURSES') {
            courses = e.data.courses;
            renderMarkers(courses);
          }
          if (e.data.type === 'FILTER_COURSES') {
            var filtered = courses;
            if (e.data.category && e.data.category !== '전체') {
              filtered = filtered.filter(function(c){ return c.category === e.data.category; });
            }
            if (e.data.source && e.data.source !== '전체') {
              filtered = filtered.filter(function(c){ return c.source === e.data.source; });
            }
            renderMarkers(filtered);
          }
          if (e.data.type === 'SELECT_COURSE') {
            var c = courses.find(function(c){ return c.id === e.data.id; });
            if (c && c.start_lat) {
              map.panTo(new kakao.maps.LatLng(c.start_lat, c.start_lng));
              map.setLevel(7);
            }
          }
        });

        window.parent.postMessage({ type: 'COURSES_MAP_READY' }, '*');
      });
    }

    function makeMarkerSvg(color, emoji) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="36" viewBox="0 0 30 36">'
        + '<path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 21 15 21S30 26.25 30 15C30 6.72 23.28 0 15 0z" fill="'
        + color + '" opacity="0.92"/>'
        + '<text x="15" y="19" text-anchor="middle" font-size="11">' + emoji + '</text></svg>';
    }

    function renderMarkers(list) {
      if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }
      // 기존 마커 제거
      currentMarkers.forEach(function(m){ m.setMap(null); });
      currentMarkers = [];

      var withCoords = list.filter(function(c){ return c.start_lat && c.start_lng; });
      document.getElementById('cnt').textContent = withCoords.length.toLocaleString();

      // 좌표가 있는 첫 번째 코스로 지도 이동
      if (withCoords.length > 0) {
        var bounds = new kakao.maps.LatLngBounds();
        withCoords.forEach(function(c){ bounds.extend(new kakao.maps.LatLng(c.start_lat, c.start_lng)); });
        map.setBounds(bounds, 50);
      }

      withCoords.forEach(function(course) {
        var color = CAT_COLORS[course.category] || '#10b981';
        var emoji = CAT_EMOJI[course.category] || '📍';
        var pos = new kakao.maps.LatLng(course.start_lat, course.start_lng);
        var svg = makeMarkerSvg(color, emoji);
        var img = new kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          new kakao.maps.Size(30, 36), { offset: new kakao.maps.Point(15, 36) }
        );
        var marker = new kakao.maps.Marker({ position: pos, image: img });

        kakao.maps.event.addListener(marker, 'click', function() {
          if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }
          var div = document.createElement('div');
          div.style.cssText = 'background:#0f172a;border:2px solid ' + color
            + ';border-radius:12px;padding:12px 14px;min-width:220px;max-width:260px;'
            + 'font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.7);position:relative;bottom:12px;';

          var distHtml = course.distance_km
            ? '<span style="color:#3b82f6">↔️ ' + Number(course.distance_km).toFixed(1) + 'km</span>' : '';
          var elevHtml = course.elev_gain_m
            ? '<span style="color:#f97316">↑ ' + Math.round(course.elev_gain_m) + 'm</span>' : '';
          var timeHtml = course.est_time
            ? '<span style="color:#10b981">⏱ ' + course.est_time + '</span>' : '';

          div.innerHTML = '<button onclick="closeOverlay()" style="position:absolute;top:6px;right:10px;'
            + 'background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;line-height:1">✕</button>'
            + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
            + '<span style="font-size:14px">' + emoji + '</span>'
            + '<span style="font-size:12px;font-weight:800;color:#f1f5f9;word-break:keep-all">' + course.course_name + '</span></div>'
            + '<p style="margin:0 0 6px;font-size:10px;color:#64748b">📁 ' + (course.dataset_name || '') + '</p>'
            + '<div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px">'
            + distHtml + elevHtml + timeHtml + '</div>'
            + (course.difficulty ? '<p style="margin:4px 0 0;font-size:10px;color:#94a3b8">💪 난이도: ' + course.difficulty + '</p>' : '')
            + '<div style="margin-top:8px;display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;'
            + 'background:' + color + '33;color:' + color + ';border:1px solid ' + color + '55">' + course.category + '</div>';

          activeOverlay = new kakao.maps.CustomOverlay({ position: pos, content: div, yAnchor: 1.3 });
          activeOverlay.setMap(map);
          map.panTo(pos);
          window.parent.postMessage({ type: 'COURSE_MARKER_CLICK', id: course.id }, '*');
        });

        marker.setMap(map);
        currentMarkers.push(marker);
      });
    }

    function closeOverlay() {
      if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }
    }

    function resetMap() {
      closeOverlay();
      map.setCenter(new kakao.maps.LatLng(36.5, 127.8));
      map.setLevel(12);
    }

    initMap();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
