// types/kakao.d.ts
// 카카오맵 JS SDK v3 타입 선언 (공식 @types 미제공 구간 보완)

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}

declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    getLevel(): number;
    getCenter(): LatLng;
    getBounds(): LatLngBounds;
    panTo(latlng: LatLng): void;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(latlng: LatLng): void;
    getPosition(): LatLng;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(latlng: LatLng): void;
    setContent(content: string | HTMLElement): void;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker: Marker): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  namespace event {
    function addListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
    function removeListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
  }

  namespace clusterer {
    class MarkerClusterer {
      constructor(options: ClustererOptions);
      addMarker(marker: Marker): void;
      addMarkers(markers: Marker[]): void;
      removeMarker(marker: Marker): void;
      clear(): void;
    }
  }

  function load(callback: () => void): void;

  // ── 옵션 인터페이스 ──────────────────────────────
  interface MapOptions {
    center: LatLng;
    level?: number;
    mapTypeId?: number;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    image?: MarkerImage;
    title?: string;
    clickable?: boolean;
  }

  interface MarkerImageOptions {
    offset?: Point;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: string | HTMLElement;
    map?: Map;
    yAnchor?: number;
    xAnchor?: number;
    zIndex?: number;
  }

  interface InfoWindowOptions {
    content: string | HTMLElement;
    removable?: boolean;
    zIndex?: number;
  }

  interface ClustererOptions {
    map: Map;
    averageCenter?: boolean;
    minLevel?: number;
    minClusterSize?: number;
    gridSize?: number;
    disableClickZoom?: boolean;
    styles?: object[];
  }
}

export {};
