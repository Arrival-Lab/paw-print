import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Config } from '../../../constants/config';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

interface Props {
  /** 초기 지도 중심. 마운트 이후엔 moveNonce 가 바뀔 때 이 좌표로 panTo. */
  center: MapCenter;
  /** 증가시키면 center 좌표가 직전과 같아도 강제로 다시 panTo. (현재위치 복귀 등) */
  moveNonce?: number;
  markers: MapMarker[];
  /** 현재 선택된 병원 id — 해당 마커로 panTo + 이름 버블 표시. */
  selectedId?: string | null;
  /** 지도 로드 완료. */
  onReady?: () => void;
  /** 사용자가 지도를 드래그/줌해서 멈췄을 때 새 중심 좌표. (프로그램적 이동은 제외) */
  onRegionChange?: (center: MapCenter) => void;
  /** 마커 탭. */
  onMarkerTap?: (id: string) => void;
}

// 다크 모드와 무관하게 Kakao 지도 타일은 항상 라이트. 마커 핀 색만 브랜드 핑크로.
const PIN_COLOR = '#C47E8A'; // primaryDark
const PIN_SELECTED = '#F4A8B8'; // primary

/**
 * Kakao Map JS SDK 를 WebView 로 띄운다.
 * 규칙 5 예외 — 도메인 제한된 지도 JS 키만 클라이언트에 노출 (Config.kakaoJsKey).
 * baseUrl 을 등록된 Web 플랫폼 도메인으로 지정해 Kakao 의 도메인 검증을 통과시킨다.
 */
function buildHtml(jsKey: string, center: MapCenter): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    .label { white-space: nowrap; background: #fff; color: #2A2A2E; font-size: 12px;
      font-weight: 700; padding: 4px 8px; border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25); transform: translateY(-6px);
      font-family: -apple-system, system-ui, sans-serif; }
  </style>
  <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&libraries=clusterer&autoload=false"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map, clusterer, selectedLabel, selectedId = null;
    var markerById = {};   // id -> kakao.maps.Marker
    var coordById = {};    // id -> {lat, lng, name}
    var suppressIdle = false; // 프로그램적 이동 시 onRegionChange 피드백 루프 방지

    function post(obj) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
    }

    // 데이터 URI SVG 핀 — 색을 브랜드 토큰으로 제어. 클릭 영역 == 보이는 핀 (anchor=하단 꼭지점).
    function pinImage(color) {
      var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='34' viewBox='0 0 28 34'>"
        + "<path d='M14 0C6.3 0 0 6.3 0 14c0 9.5 14 20 14 20s14-10.5 14-20C28 6.3 21.7 0 14 0z' fill='" + color + "'/>"
        + "<circle cx='14' cy='14' r='5' fill='#ffffff'/></svg>";
      var src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      return new kakao.maps.MarkerImage(src, new kakao.maps.Size(28, 34), {
        offset: new kakao.maps.Point(14, 34)
      });
    }

    kakao.maps.load(function () {
      var c = new kakao.maps.LatLng(${center.lat}, ${center.lng});
      map = new kakao.maps.Map(document.getElementById('map'), { center: c, level: 5 });
      clusterer = new kakao.maps.MarkerClusterer({
        map: map, averageCenter: true, minLevel: 6, gridSize: 60, disableClickZoom: false
      });

      kakao.maps.event.addListener(map, 'idle', function () {
        if (suppressIdle) { suppressIdle = false; return; }
        var ctr = map.getCenter();
        post({ type: 'region', lat: ctr.getLat(), lng: ctr.getLng() });
      });

      post({ type: 'ready' });
    });

    function clearLabel() {
      if (selectedLabel) { selectedLabel.setMap(null); selectedLabel = null; }
    }

    window.__setMarkers = function (json) {
      var list = JSON.parse(json);
      clusterer.clear();
      for (var key in markerById) { markerById[key].setMap(null); }
      markerById = {}; coordById = {};
      clearLabel();

      var defaultImg = pinImage('${PIN_COLOR}');
      var objs = [];
      list.forEach(function (h) {
        var pos = new kakao.maps.LatLng(h.lat, h.lng);
        var marker = new kakao.maps.Marker({ position: pos, image: defaultImg, title: h.name });
        (function (id) {
          kakao.maps.event.addListener(marker, 'click', function () {
            post({ type: 'marker', id: id });
          });
        })(h.id);
        markerById[h.id] = marker;
        coordById[h.id] = { lat: h.lat, lng: h.lng, name: h.name };
        objs.push(marker);
      });
      clusterer.addMarkers(objs);
      // 마커 재생성 후 기존 선택 복원
      if (selectedId && markerById[selectedId]) { window.__selectMarker(selectedId); }
      return true;
    };

    window.__setCenter = function (lat, lng) {
      if (!map) return true;
      suppressIdle = true;
      map.panTo(new kakao.maps.LatLng(lat, lng));
      return true;
    };

    window.__selectMarker = function (id) {
      if (!map) return true;
      // 이전 선택 핀 색 복원
      if (selectedId && markerById[selectedId]) {
        markerById[selectedId].setImage(pinImage('${PIN_COLOR}'));
      }
      clearLabel();
      selectedId = id;
      var c = coordById[id];
      var marker = markerById[id];
      if (!c || !marker) return true;
      marker.setImage(pinImage('${PIN_SELECTED}'));
      marker.setZIndex(10);
      var pos = new kakao.maps.LatLng(c.lat, c.lng);
      selectedLabel = new kakao.maps.CustomOverlay({
        position: pos, content: '<div class="label">' + c.name + '</div>', yAnchor: 2.2, zIndex: 20
      });
      selectedLabel.setMap(map);
      suppressIdle = true;
      map.panTo(pos);
      return true;
    };
  </script>
</body>
</html>`;
}

export default function HospitalMapView({
  center,
  moveNonce = 0,
  markers,
  selectedId,
  onReady,
  onRegionChange,
  onMarkerTap,
}: Props) {
  const Colors = useColors();
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  // 마운트 시점 center 로 HTML 을 한 번만 생성 (이후 변경은 inject 로 반영).
  const initialCenterRef = useRef(center);

  const inject = useCallback((code: string) => {
    webRef.current?.injectJavaScript(code);
  }, []);

  const pushMarkers = useCallback(() => {
    const json = JSON.stringify(markers);
    inject(`window.__setMarkers && window.__setMarkers(${JSON.stringify(json)}); true;`);
  }, [markers, inject]);

  // ready 이후 props 동기화
  useEffect(() => {
    if (readyRef.current) pushMarkers();
  }, [pushMarkers]);

  // moveNonce 가 바뀔 때만 panTo — 좌표가 직전과 같아도(뷰포트만 드래그된 뒤 복귀) 강제 이동.
  // center 는 nonce 와 같은 렌더에서 함께 갱신되므로 최신 좌표를 읽는다.
  useEffect(() => {
    if (readyRef.current) inject(`window.__setCenter && window.__setCenter(${center.lat}, ${center.lng}); true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveNonce]);

  useEffect(() => {
    if (readyRef.current && selectedId) {
      inject(`window.__selectMarker && window.__selectMarker(${JSON.stringify(selectedId)}); true;`);
    }
  }, [selectedId, inject]);

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        readyRef.current = true;
        pushMarkers();
        if (selectedId) {
          inject(`window.__selectMarker && window.__selectMarker(${JSON.stringify(selectedId)}); true;`);
        }
        onReady?.();
      } else if (msg.type === 'region' && typeof msg.lat === 'number') {
        onRegionChange?.({ lat: msg.lat, lng: msg.lng });
      } else if (msg.type === 'marker' && msg.id) {
        onMarkerTap?.(msg.id);
      }
    },
    [pushMarkers, selectedId, inject, onReady, onRegionChange, onMarkerTap],
  );

  if (!Config.kakaoJsKey) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.surface }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, textAlign: 'center' }}>
          지도를 불러올 수 없어요.{'\n'}(Kakao 지도 키 미설정)
        </Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html: buildHtml(Config.kakaoJsKey, initialCenterRef.current), baseUrl: Config.kakaoMapDomain }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      // 페이지 자체 스크롤은 막고 지도 제스처만 통과 (Kakao 가 내부에서 처리).
      scrollEnabled={false}
      overScrollMode="never"
      androidLayerType="hardware"
      style={{ flex: 1, backgroundColor: Colors.surface }}
    />
  );
}
