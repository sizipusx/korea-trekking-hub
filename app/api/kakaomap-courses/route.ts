import { NextResponse } from 'next/server';

async function fetchKakaoSDK(appkey: string): Promise<string> {
  try {
    // clusterer 라이브러리 함께 로드
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
    #legend {
      position:absolute; top:12px; right:120px; z-index:10;
      background:rgba(15,23,42,0.92); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; padding:8px 10px;
      font-family:sans-serif; font-size:10px; color:#94a3b8;
      display:flex; flex-wrap:wrap; gap:6px; max-width:320px;
    }
    .legend-item { display:flex; align-items:center; gap:3px; }
    .legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
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
  <div id="legend"></div>
  <button id="btn-all" onclick="resetMap()">🗺 전체 보기</button>

  <script>${sdk}</script>
  <script>
    // ── 카테고리 메타 ──
    var CAT_META = {
      '등산로':   { color:'#ef4444', initial:'등' },
      '둘레길':   { color:'#22c55e', initial:'둘' },
      '숲길':     { color:'#16a34a', initial:'숲' },
      '트레킹길': { color:'#3b82f6', initial:'트' },
      '테마길':   { color:'#a855f7', initial:'테' },
      '오름':     { color:'#f97316', initial:'오' },
      '섬트레킹': { color:'#06b6d4', initial:'섬' },
      '문화길':   { color:'#f59e0b', initial:'문' },
      '국가숲길': { color:'#10b981', initial:'국' },
      '정맥종주': { color:'#dc2626', initial:'정' },
      '종주':     { color:'#7c3aed', initial:'종' },
      '기타':     { color:'#64748b', initial:'기' }
    };

    // 범례 생성
    (function buildLegend() {
      var el = document.getElementById('legend');
      Object.keys(CAT_META).forEach(function(k) {
        var m = CAT_META[k];
        el.innerHTML += '<div class="legend-item">'
          + '<div class="legend-dot" style="background:' + m.color + '"></div>'
          + '<span>' + k + '</span></div>';
      });
    })();

    var map, courses = [], activeOverlay = null, currentMarkers = [], clusterer = null;

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
              filtered = filtered.filter(function(c){ return (c.category||'').trim() === e.data.category; });
            }
            if (e.data.source && e.data.source !== '전체') {
              filtered = filtered.filter(function(c){ return c.source === e.data.source; });
            }
            renderMarkers(filtered);
          }
          if (e.data.type === 'SELECT_COURSE') {
            var c = courses.find(function(c){ return c.id === e.data.id; });
            if (c && c.start_lat) {
              map.setLevel(7);
              map.panTo(new kakao.maps.LatLng(c.start_lat, c.start_lng));
            }
          }
        });

        window.parent.postMessage({ type: 'COURSES_MAP_READY' }, '*');
      });
    }

    // ── SVG 마커 (이모지 없이 한글 이니셜 사용) ──
    function makeMarkerSvg(color, initial) {
      var enc = initial || '기';
      return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">'
        // 핀 몸체
        + '<path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="' + color + '"/>'
        // 내부 원 (밝게)
        + '<circle cx="14" cy="13" r="8.5" fill="rgba(255,255,255,0.25)"/>'
        // 이니셜 텍스트
        + '<text x="14" y="17.5" text-anchor="middle" dominant-baseline="middle"'
        + ' font-size="9" font-weight="900" fill="white"'
        + ' font-family=\'Apple SD Gothic Neo,Malgun Gothic,sans-serif\'>' + enc + '</text>'
        + '</svg>';
    }

    // ── 마커 렌더링 (클러스터링 포함) ──
    function renderMarkers(list) {
      if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }

      // 기존 클러스터러 제거
      if (clusterer) {
        clusterer.clear();
        clusterer.setMap(null);
        clusterer = null;
      }
      currentMarkers.forEach(function(m){ m.setMap(null); });
      currentMarkers = [];

      var withCoords = list.filter(function(c){ return c.start_lat && c.start_lng; });
      document.getElementById('cnt').textContent = withCoords.length.toLocaleString();

      withCoords.forEach(function(course) {
        var cat   = (course.category || '').trim();
        var meta  = CAT_META[cat] || { color:'#10b981', initial:'기' };
        var pos   = new kakao.maps.LatLng(course.start_lat, course.start_lng);
        var svg   = makeMarkerSvg(meta.color, meta.initial);
        var img   = new kakao.maps.MarkerImage(
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          new kakao.maps.Size(28, 36),
          { offset: new kakao.maps.Point(14, 36) }
        );
        var marker = new kakao.maps.Marker({ position: pos, image: img });

        kakao.maps.event.addListener(marker, 'click', function() {
          if (activeOverlay) { activeOverlay.setMap(null); activeOverlay = null; }

          var distHtml = course.distance_km
            ? '<span style="color:#3b82f6">↔ ' + Number(course.distance_km).toFixed(1) + 'km</span>' : '';
          var elevHtml = course.elev_gain_m
            ? '<span style="color:#f97316">↑ ' + Math.round(course.elev_gain_m) + 'm</span>' : '';
          var timeHtml = course.est_time
            ? '<span style="color:#10b981">⏱ ' + course.est_time + '</span>' : '';

          var div = document.createElement('div');
          div.style.cssText = 'background:#0f172a;border:2px solid ' + meta.color
            + ';border-radius:12px;padding:12px 14px;min-width:220px;max-width:260px;'
            + 'font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.7);position:relative;bottom:12px;';
          div.innerHTML =
            '<button onclick="closeOverlay()" style="position:absolute;top:6px;right:10px;'
            + 'background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;line-height:1">✕</button>'
            + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
            + '<div style="width:10px;height:10px;border-radius:50%;background:' + meta.color + ';flex-shrink:0"></div>'
            + '<span style="font-size:12px;font-weight:800;color:#f1f5f9;word-break:keep-all">' + course.course_name + '</span></div>'
            + '<p style="margin:0 0 6px;font-size:10px;color:#64748b">📁 ' + (course.dataset_name || '') + '</p>'
            + '<div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px">'
            + distHtml + elevHtml + timeHtml + '</div>'
            + (course.difficulty ? '<p style="margin:4px 0 0;font-size:10px;color:#94a3b8">💪 난이도: ' + course.difficulty + '</p>' : '')
            + '<div style="margin-top:8px;display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;'
            + 'background:' + meta.color + '33;color:' + meta.color + ';border:1px solid ' + meta.color + '55">'
            + cat + '</div>';

          activeOverlay = new kakao.maps.CustomOverlay({ position: pos, content: div, yAnchor: 1.3 });
          activeOverlay.setMap(map);
          map.panTo(pos);
          window.parent.postMessage({ type: 'COURSE_MARKER_CLICK', id: course.id }, '*');
        });

        currentMarkers.push(marker);
      });

      // 클러스터러 생성 (마커 수가 많을 때 성능 향상)
      if (kakao.maps.MarkerClusterer && currentMarkers.length > 0) {
        clusterer = new kakao.maps.MarkerClusterer({
          map: map,
          markers: currentMarkers,
          gridSize: 60,
          averageCenter: true,
          minLevel: 8,          // 줌 레벨 8 이하에서만 클러스터링
          minClusterSize: 3,    // 3개 이상일 때 클러스터
          disableClickZoom: false,
          styles: [{
            width: '44px', height: '44px',
            background: 'rgba(16,185,129,0.85)',
            borderRadius: '22px',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '44px',
            fontWeight: '700',
            fontSize: '13px',
            border: '2px solid rgba(255,255,255,0.4)',
          }],
        });
      } else {
        // 클러스터러 없으면 직접 지도에 추가
        currentMarkers.forEach(function(m){ m.setMap(map); });
      }

      // 전체 범위 맞추기
      if (withCoords.length > 0 && withCoords.length <= 500) {
        var bounds = new kakao.maps.LatLngBounds();
        withCoords.forEach(function(c){ bounds.extend(new kakao.maps.LatLng(c.start_lat, c.start_lng)); });
        map.setBounds(bounds, 50);
      }
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
