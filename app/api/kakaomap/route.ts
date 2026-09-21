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
    /* 일반 / 위성 / 지형 전환 (카카오 기본 컨트롤 대신 지도 UI 톤에 맞춘 세그먼트) */
    #map-type {
      position:absolute; top:12px; right:12px; z-index:10;
      display:flex; gap:4px; padding:4px;
      background:rgba(15,23,42,0.88); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px;
    }
    #map-type button {
      padding:6px 12px; font-size:11px; font-weight:700; font-family:sans-serif;
      background:transparent; border:none; border-radius:7px;
      color:#94a3b8; cursor:pointer; white-space:nowrap;
    }
    #map-type button.on { background:rgba(16,185,129,0.18); color:#10b981; }
    /* 자전거도로는 베이스맵과 무관한 오버레이라 독립 토글 */
    #toggle-bike {
      position:absolute; top:58px; right:12px; z-index:10;
      padding:7px 12px; font-size:11px; font-weight:700; font-family:sans-serif;
      background:rgba(15,23,42,0.88); border:1px solid rgba(255,255,255,0.1);
      border-radius:10px; color:#94a3b8; cursor:pointer; white-space:nowrap;
    }
    #toggle-bike.on { border-color:rgba(59,130,246,0.6); color:#60a5fa; }
    #legend p.tit { font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:.1em; margin-bottom:6px; font-family:sans-serif; }
    #legend .sep { height:1px; background:rgba(255,255,255,0.08); margin:8px 0 6px; }
    .leg-item { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
    .leg-dot { width:10px; height:10px; border-radius:50%; }
    .leg-sq  { width:10px; height:10px; border-radius:3px; }
    .leg-text { font-size:10px; color:#cbd5e1; font-family:sans-serif; }
    /* 하단 버튼은 한 줄에 담고, 좁은 화면에서는 위로 접히게 */
    #map-actions {
      position:absolute; bottom:16px; right:16px; z-index:10;
      display:flex; flex-wrap:wrap-reverse; justify-content:flex-end; gap:8px;
      max-width:calc(100% - 32px);
    }
    #map-actions button {
      padding:8px 14px; font-size:12px; font-weight:700; white-space:nowrap;
      background:rgba(15,23,42,0.9); border-radius:8px; cursor:pointer; font-family:sans-serif;
    }
    #btn-all { border:1px solid rgba(16,185,129,0.5); color:#10b981; }
    .layer-toggle.off { opacity:0.45; }
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
  <div id="map-type">
    <button data-type="ROADMAP" class="on" onclick="setMapType('ROADMAP')">일반</button>
    <button data-type="SKYVIEW" onclick="setMapType('SKYVIEW')">위성</button>
    <button data-type="TERRAIN" onclick="setMapType('TERRAIN')">지형</button>
  </div>
  <button id="toggle-bike" onclick="toggleBike()">🚲 자전거도로</button>
  <!-- 범례와 레이어 토글은 부모가 보낸 레이어 정의로 만들어진다 -->
  <div id="legend"></div>
  <div id="map-actions">
    <button id="btn-all" onclick="resetMap()">🗺 전체 보기</button>
  </div>

  <script>${sdk}</script>
  <script>
    // ── 레이어 레지스트리 ─────────────────────────────
    // layers[id] = { def, items, markers, visible, filter }
    // 부모가 INIT_LAYER로 등록해 주며, 이 스크립트는 레이어 종류를 미리 알지 못한다.
    var map, activeOverlay = null;
    var layers = {};
    var layerOrder = [];

    var mapType = 'ROADMAP';   // 일반 / 위성(하이브리드) / 지형(일반지도 + 지형 오버레이)
    var bikeOn = false;        // 자전거도로 오버레이 — 어느 베이스맵 위에서도 켜고 끌 수 있음

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── 마커 SVG ─────────────────────────────────────
    // 레이어끼리 한눈에 구분되도록 모양을 달리한다.
    function markerImage(shape, color, emoji) {
      var w, h, body;
      if (shape === 'house') {
        w = 30; h = 38;
        body = '<path d="M15 0L30 13v12a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V13z" fill="' + color + '" opacity="0.95"/>'
             + '<text x="15" y="22" text-anchor="middle" font-size="12">' + emoji + '</text>';
      } else if (shape === 'circle') {
        w = 28; h = 34;
        body = '<circle cx="14" cy="14" r="13" fill="' + color + '" opacity="0.95"/>'
             + '<path d="M14 34l-5-8h10z" fill="' + color + '" opacity="0.95"/>'
             + '<text x="14" y="19" text-anchor="middle" font-size="12">' + emoji + '</text>';
      } else {
        w = 36; h = 44;
        body = '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="' + color + '"/>'
             + '<text x="18" y="23" text-anchor="middle" font-size="13">' + emoji + '</text>';
      }
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h
              + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>';
      return new kakao.maps.MarkerImage(
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
        new kakao.maps.Size(w, h), { offset: new kakao.maps.Point(w / 2, h) }
      );
    }

    function colorOf(L, item) { return L.def.style.colors[item.category] || L.def.style.defaultColor; }
    function emojiOf(L, item) { return L.def.style.emojis[item.category] || L.def.style.defaultEmoji; }

    // ── 팝업 ─────────────────────────────────────────
    // 레이어마다 보여줄 내용이 달라 이 부분만 레이어별로 둔다.
    // 새 레이어를 붙일 때 손대야 하는 곳은 여기 하나다.
    var POPUPS = {
      trails: function(t, color) {
        return '<p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#f1f5f9">' + esc(t.name) + '</p>'
          + '<p style="margin:0 0 8px;font-size:11px;color:#64748b">📍 ' + esc(t.region) + '</p>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">'
          + '<div style="background:rgba(255,255,255,0.06);border-radius:6px;padding:4px 8px">'
          + '<p style="margin:0;font-size:11px;color:#10b981">📏 ' + esc(t.distance_km) + 'km</p></div>'
          + '<div style="background:rgba(255,255,255,0.06);border-radius:6px;padding:4px 8px">'
          + '<p style="margin:0;font-size:11px;color:#f59e0b">⛰ ' + esc(t.difficulty) + '</p></div></div>';
      },
      forests: function(f, color, emoji) {
        var lottery = (f.lottery_targets && f.lottery_targets.length)
          ? f.lottery_targets.join(', ') : '없음';
        var resv = f.reservation_url
          ? '<a href="' + esc(f.reservation_url) + '" target="_blank" style="color:#22d3ee;text-decoration:none">예약 바로가기 →</a>'
          : esc(f.reservation_org || '개별 문의');
        // 예약 방식 + 선착순 오픈 시점 (공립 익월말은 '다음 달 신청'으로 강조)
        var fcfs = f.fcfs_type || '';
        var openTime = f.open_time || '';
        var resvType = fcfs
          ? ('선착순 · ' + esc(fcfs) + (fcfs === '익월말' ? ' 예약' : ''))
          : '예약처 문의';
        var openLabel = (fcfs === '익월말') ? '다음 달 신청' : '신청';
        var openLine = openTime
          ? '<p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#fbbf24">🔔 ' + openLabel + ': ' + esc(openTime) + '</p>'
          : '';
        return '<p style="margin:0 0 2px;font-size:13px;font-weight:800;color:#f1f5f9">' + emoji + ' ' + esc(f.name) + '</p>'
          + '<p style="margin:0 0 8px;font-size:11px;color:#64748b">' + esc(f.category) + ' · ' + esc(f.sigungu) + '</p>'
          + '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">'
          +   (f.has_room ? '<span style="font-size:10px;background:rgba(34,197,94,0.15);color:#4ade80;border-radius:5px;padding:2px 6px">🛏 객실</span>' : '')
          +   (f.has_camp ? '<span style="font-size:10px;background:rgba(8,145,178,0.18);color:#22d3ee;border-radius:5px;padding:2px 6px">⛺ 야영장</span>' : '')
          +   (f.has_waitlist ? '<span style="font-size:10px;background:rgba(255,255,255,0.06);color:#cbd5e1;border-radius:5px;padding:2px 6px">⏳ 대기예약</span>' : '')
          + '</div>'
          + '<div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;margin-bottom:6px">'
          +   '<p style="margin:0;font-size:10px;color:#94a3b8">예약 방식</p>'
          +   '<p style="margin:2px 0 0;font-size:11px;color:#e2e8f0">' + resvType + '</p>'
          +   openLine
          + '</div>'
          + '<p style="margin:0 0 4px;font-size:10px;color:#94a3b8">추첨제 대상: <span style="color:#cbd5e1">' + esc(lottery) + '</span></p>'
          + '<p style="margin:6px 0 0;font-size:11px">' + resv + '</p>';
      },
      camps: function(c, color, emoji) {
        // 예약 정보가 이 팝업의 핵심 — 기간을 못 찾았어도 메모만 적어둔 경우가 있다
        var resvBody = '';
        if (c.reservation_open) {
          resvBody += '<p style="margin:2px 0 0;font-size:11px;font-weight:700;color:#fbbf24">🔔 오픈: ' + esc(c.reservation_open) + '</p>';
        }
        if (c.use_season) {
          resvBody += '<p style="margin:2px 0 0;font-size:11px;color:#e2e8f0">🗓 이용: ' + esc(c.use_season) + '</p>';
        }
        if (c.reservation_note) {
          resvBody += '<p style="margin:2px 0 0;font-size:11px;color:#94a3b8">📝 ' + esc(c.reservation_note) + '</p>';
        }
        if (!resvBody) {
          resvBody = '<p style="margin:2px 0 0;font-size:11px;color:#64748b">미확인 — 아래 패널에서 ✏️ 직접 입력</p>';
        }
        var link = c.reservation_url
          ? '<a href="' + esc(c.reservation_url) + '" target="_blank" style="color:#f472b6;text-decoration:none">예약·안내 바로가기 →</a>'
          : esc(c.reservation_org || '개별 문의');
        return '<p style="margin:0 0 2px;font-size:13px;font-weight:800;color:#f1f5f9">' + emoji + ' ' + esc(c.name) + '</p>'
          + '<p style="margin:0 0 8px;font-size:11px;color:#64748b">' + esc(c.category) + ' · ' + esc(c.sigungu) + '</p>'
          + '<div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;margin-bottom:6px">'
          +   '<p style="margin:0;font-size:10px;color:#94a3b8">예약 정보</p>'
          +   resvBody
          + '</div>'
          + '<p style="margin:0 0 4px;font-size:10px;color:#94a3b8">운영: <span style="color:#cbd5e1">' + esc(c.operator || '미상') + '</span></p>'
          + (c.tel ? '<p style="margin:0 0 4px;font-size:10px;color:#94a3b8">☎ <span style="color:#cbd5e1">' + esc(c.tel) + '</span></p>' : '')
          + '<p style="margin:6px 0 0;font-size:11px">' + link + '</p>';
      }
    };

    function popupWidth(layerId) { return layerId === 'trails' ? '200px' : '230px'; }

    function openPopup(L, item, pos) {
      closeOverlay();
      var color = colorOf(L, item);
      var body = (POPUPS[L.def.id] || function(){ return esc(item.name); })(item, color, emojiOf(L, item));
      var div = document.createElement('div');
      div.style.cssText = 'background:#0f172a;border:2px solid ' + color
        + ';border-radius:12px;padding:12px 14px;min-width:' + popupWidth(L.def.id) + ';max-width:280px;'
        + 'font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.6);position:relative;bottom:12px;';
      div.innerHTML = '<button onclick="closeOverlay()" style="position:absolute;top:6px;right:10px;'
        + 'background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer">✕</button>' + body;
      activeOverlay = new kakao.maps.CustomOverlay({ position: pos, content: div, yAnchor: 1.3 });
      activeOverlay.setMap(map);
      map.panTo(pos);
    }

    // ── 레이어 동작 ───────────────────────────────────
    function registerLayer(def, items) {
      if (!layers[def.id]) {
        layers[def.id] = { def: def, items: [], markers: [], visible: true, filter: '전체' };
        layerOrder.push(def.id);
      }
      layers[def.id].def = def;
      layers[def.id].items = items || [];
      buildLegend();
      buildToggles();
      renderLayer(def.id);
    }

    function visibleItems(L) {
      return L.items.filter(function(it) {
        if (it.lat == null || it.lng == null) return false;
        return L.filter === '전체' || it.category === L.filter;
      });
    }

    function renderLayer(id) {
      var L = layers[id];
      if (!L || !map) return;
      L.markers.forEach(function(m) { m.setMap(null); });
      L.markers = [];
      visibleItems(L).forEach(function(item) {
        var pos = new kakao.maps.LatLng(item.lat, item.lng);
        var marker = new kakao.maps.Marker({
          position: pos,
          image: markerImage(L.def.style.shape, colorOf(L, item), emojiOf(L, item)),
          map: L.visible ? map : null
        });
        kakao.maps.event.addListener(marker, 'click', function() {
          // 부모가 값을 고쳤을 수 있으니 클릭 시점에 배열에서 다시 읽는다
          var latest = L.items.find(function(x) { return x.id === item.id; }) || item;
          openPopup(L, latest, pos);
          window.parent.postMessage({ type: 'LAYER_CLICK', layer: L.def.id, id: item.id }, '*');
        });
        L.markers.push(marker);
      });
    }

    function setLayerVisible(id, v) {
      var L = layers[id];
      if (!L) return;
      L.visible = v;
      L.markers.forEach(function(m) { m.setMap(v ? map : null); });
      var btn = document.getElementById('toggle-' + id);
      if (btn) {
        btn.classList.toggle('off', !v);
        btn.textContent = L.def.emoji + ' ' + L.def.label + (v ? ' 표시' : ' 숨김');
      }
    }

    // 지도 안 버튼은 상태를 직접 바꾸지 않고 부모에게 요청만 한다.
    // (부모의 필터바 토글과 어긋나지 않도록 상태는 한쪽에서만 관리)
    function requestToggle(id) {
      var L = layers[id];
      if (!L) return;
      window.parent.postMessage({ type: 'TOGGLE_REQUEST', layer: id, visible: !L.visible }, '*');
    }

    function selectInLayer(id, itemId) {
      var L = layers[id];
      if (!L) return;
      var item = L.items.find(function(x) { return x.id === itemId; });
      if (!item || item.lat == null) return;
      map.panTo(new kakao.maps.LatLng(item.lat, item.lng));
      map.setLevel(L.def.style.zoomLevel);
    }

    // ── 범례 · 토글 버튼 (레이어 정의에서 자동 생성) ──
    function buildLegend() {
      var el = document.getElementById('legend');
      var html = '';
      layerOrder.forEach(function(id, i) {
        var L = layers[id];
        var cats = L.def.categories.filter(function(c) { return c !== '전체'; });
        if (!cats.length) return;
        if (i > 0) html += '<div class="sep"></div>';
        html += '<p class="tit">' + esc(L.def.label) + '</p>';
        var cls = L.def.style.shape === 'pin' ? 'leg-dot' : 'leg-sq';
        cats.forEach(function(c) {
          var col = L.def.style.colors[c] || L.def.style.defaultColor;
          html += '<div class="leg-item"><div class="' + cls + '" style="background:' + col + '"></div>'
                + '<span class="leg-text">' + esc(c) + '</span></div>';
        });
      });
      el.innerHTML = html;
    }

    function buildToggles() {
      var actions = document.getElementById('map-actions');
      layerOrder.forEach(function(id) {
        if (document.getElementById('toggle-' + id)) return;
        var L = layers[id];
        var btn = document.createElement('button');
        btn.id = 'toggle-' + id;
        btn.className = 'layer-toggle';
        btn.style.border = '1px solid ' + L.def.accent;
        btn.style.color = L.def.accent;
        btn.textContent = L.def.emoji + ' ' + L.def.label + ' 표시';
        btn.onclick = function() { requestToggle(id); };
        actions.insertBefore(btn, actions.firstChild);
      });
    }

    // ── 지도 초기화 ───────────────────────────────────
    function initMap() {
      if (typeof kakao === 'undefined' || !kakao.maps) { setTimeout(initMap, 100); return; }
      kakao.maps.load(function() {
        document.getElementById('loading').style.display = 'none';
        map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(36.5, 127.8),
          level: 12
        });

        window.addEventListener('message', function(e) {
          if (!e.data || !e.data.type) return;
          var d = e.data;
          var L = d.layer ? layers[d.layer] : null;

          if (d.type === 'INIT_LAYER') { registerLayer(d.def, d.items); return; }
          if (!L) return;

          if (d.type === 'SET_ITEMS')  { L.items = d.items || []; renderLayer(d.layer); }
          if (d.type === 'FILTER')     { L.filter = d.category; renderLayer(d.layer); }
          if (d.type === 'TOGGLE')     { setLayerVisible(d.layer, d.visible); }
          if (d.type === 'SELECT')     { selectInLayer(d.layer, d.id); }
          if (d.type === 'UPDATE_ITEM') {
            for (var i = 0; i < L.items.length; i++) {
              if (L.items[i].id === d.item.id) { L.items[i] = d.item; break; }
            }
          }
        });

        window.parent.postMessage({ type: 'MAP_READY' }, '*');
      });
    }

    // ── 베이스맵 / 오버레이 ───────────────────────────
    // 카카오맵의 지형도·자전거도로는 별도 베이스맵이 아니라 일반지도 위에 얹는 오버레이 타입.
    // 얹혀 있던 오버레이를 모두 걷어낸 뒤 현재 상태대로 다시 올려, 중복·잔존을 신경 쓰지 않는다.
    function applyMapType() {
      if (!map) return;
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN);
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.BICYCLE);
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.BICYCLE_HYBRID);
      map.setMapTypeId(mapType === 'SKYVIEW' ? kakao.maps.MapTypeId.HYBRID : kakao.maps.MapTypeId.ROADMAP);
      if (mapType === 'TERRAIN') map.addOverlayMapTypeId(kakao.maps.MapTypeId.TERRAIN);
      // 위성 위에서는 밝은 기본 자전거 레이어가 묻혀서 강조용을 쓴다
      if (bikeOn) map.addOverlayMapTypeId(mapType === 'SKYVIEW'
        ? kakao.maps.MapTypeId.BICYCLE_HYBRID : kakao.maps.MapTypeId.BICYCLE);
    }

    function setMapType(type) {
      mapType = type;
      applyMapType();
      var btns = document.querySelectorAll('#map-type button');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('on', btns[i].getAttribute('data-type') === type);
      }
    }

    function toggleBike() {
      bikeOn = !bikeOn;
      applyMapType();
      document.getElementById('toggle-bike').classList.toggle('on', bikeOn);
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
