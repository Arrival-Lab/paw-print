import type { Feather } from '@expo/vector-icons';
import type { WeatherTrigger } from './types';

export interface WeatherTip {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  caution: string; // "단두종, 노령 주의" — 카드 하단 캡션
}

type ActiveTrigger = Exclude<WeatherTrigger, 'NONE'>;

export const WEATHER_TIPS: Record<ActiveTrigger, WeatherTip[]> = {
  HEATWAVE: [
    {
      icon: 'alert-circle',
      title: '열사병 신호 확인',
      body: '과도한 헐떡임, 침 흘림, 비틀거림, 구토, 무기력은 열사병 위험 신호일 수 있어 즉시 시원한 곳으로 옮겨주세요.',
      caution: '단두종, 노령, 비만, 심장·호흡기 질환 동물 주의',
    },
    {
      icon: 'clock',
      title: '한낮 산책 중단',
      body: '기온이 높은 시간대에는 산책과 격한 놀이를 피하고, 이른 아침이나 해가 진 뒤 짧게 움직여주세요.',
      caution: '대형견, 두꺼운 털, 활동량 많은 견종 주의',
    },
    {
      icon: 'alert-triangle',
      title: '발바닥 화상 확인',
      body: '아스팔트, 데크, 모래가 뜨거우면 발바닥 화상이 생길 수 있어 산책 전 바닥 온도를 확인해주세요.',
      caution: '소형견, 다리가 짧은 견종, 발바닥이 약한 동물 주의',
    },
    {
      icon: 'alert-octagon',
      title: '차량 방치 금지',
      body: '잠깐이라도 차 안 온도는 빠르게 올라가므로 반려동물을 혼자 두지 마세요.',
      caution: '모든 동물 공통, 특히 고양이·소형견 이동 시 주의',
    },
    {
      icon: 'umbrella',
      title: '물과 그늘 확보',
      body: '외출 시 신선한 물을 챙기고, 야외에서는 그늘에서 자주 쉬게 해 체온 상승을 막아주세요.',
      caution: '어린 동물, 노령동물, 탈수 이력 있는 동물 주의',
    },
  ],

  COLDWAVE: [
    {
      icon: 'clock',
      title: '산책 시간 단축',
      body: '체감온도가 낮은 날에는 장시간 산책보다 짧고 안전한 배변 산책 위주로 조절해주세요.',
      caution: '소형견, 단모종, 노령, 어린 동물 주의',
    },
    {
      icon: 'alert-circle',
      title: '저체온 증상 확인',
      body: '떨림, 무기력, 반응 저하, 몸이 차가운 증상이 보이면 즉시 실내로 옮기고 보온해주세요.',
      caution: '노령동물, 질환 보유 동물, 마른 체형 주의',
    },
    {
      icon: 'search',
      title: '발과 귀 끝 확인',
      body: '산책 후 귀 끝, 꼬리, 발끝이 차갑거나 창백하지 않은지 확인해주세요.',
      caution: '귀가 얇은 견종, 단모종, 실외 생활 동물 주의',
    },
    {
      icon: 'droplet',
      title: '제설제 닦기',
      body: '산책 후 발바닥과 발가락 사이에 묻은 염화칼슘, 제설제, 눈덩이를 깨끗이 닦아주세요.',
      caution: '발 핥는 습관이 있는 동물 주의',
    },
    {
      icon: 'wind',
      title: '젖은 털 바로 말리기',
      body: '눈이나 비에 젖은 털은 체온을 떨어뜨릴 수 있어 귀, 배, 발까지 충분히 말려주세요.',
      caution: '장모종, 이중모, 피부질환 이력 동물 주의',
    },
  ],

  RAIN_HEAVY: [
    {
      icon: 'cloud-rain',
      title: '외출 자제',
      body: '비가 강하게 오는 날에는 산책과 야외활동을 피하고, 가능하면 실내 배변이나 실내 놀이로 대체해주세요.',
      caution: '소형견, 노령견, 겁이 많은 동물 주의',
    },
    {
      icon: 'alert-octagon',
      title: '침수 구역 접근 금지',
      body: '물이 고인 도로, 하천변, 지하 통로는 미끄러짐과 오염수 위험이 있어 접근하지 않게 해주세요.',
      caution: '소형견, 노령견, 시야가 낮은 동물 주의',
    },
    {
      icon: 'slash',
      title: '고인 물 섭취 금지',
      body: '웅덩이, 빗물, 하천 물은 오염 가능성이 있어 마시거나 핥지 못하게 해주세요.',
      caution: '산책 중 물을 잘 마시는 강아지 주의',
    },
    {
      icon: 'alert-triangle',
      title: '배수구·맨홀 주의',
      body: '불가피하게 외출할 때는 빗물이 빠르게 흐르는 배수구, 맨홀, 경사진 길을 피하고 짧은 리드줄로 이동해주세요.',
      caution: '겁이 많거나 갑자기 뛰는 동물 주의',
    },
    {
      icon: 'package',
      title: '비상 이동 준비',
      body: '침수 가능성이 있으면 이동장, 리드줄, 약, 사료, 물, 진료기록을 바로 챙길 수 있게 준비해주세요.',
      caution: '만성질환, 약 복용 중인 동물 주의',
    },
  ],

  DUST_PM: [
    {
      icon: 'wind',
      title: '실외 활동 줄이기',
      body: '미세먼지가 나쁜 날에는 긴 산책과 뛰는 활동을 줄이고 실내 놀이로 대체해주세요.',
      caution: '호흡기·심장 질환 동물 주의',
    },
    {
      icon: 'clock',
      title: '산책은 짧게',
      body: '배변이 필요하면 짧게 다녀오고, 대로변이나 공사장 주변은 피해주세요.',
      caution: '단두종, 노령견, 기관지 약한 동물 주의',
    },
    {
      icon: 'droplet',
      title: '외출 후 털 닦기',
      body: '산책 후 발, 얼굴, 털 표면을 닦아 먼지가 피부와 눈 주변에 오래 남지 않게 해주세요.',
      caution: '피부 알레르기, 눈물 많은 동물 주의',
    },
    {
      icon: 'activity',
      title: '호흡 변화 관찰',
      body: '기침, 쌕쌕거림, 숨 가쁨, 눈·코 자극이 보이면 실내 휴식 후 상태를 확인해주세요.',
      caution: '천식, 심장병, 기관허탈 이력 동물 주의',
    },
    {
      icon: 'square',
      title: '실내 공기 관리',
      body: '창문을 오래 열어두지 말고 공기청정기나 환기 시간을 조절해 실내 먼지 유입을 줄여주세요.',
      caution: '어린 동물, 노령동물, 임신 동물 주의',
    },
  ],

  YELLOW_DUST: [
    {
      icon: 'wind',
      title: '황사 노출 최소화',
      body: '황사특보가 있으면 산책과 야외 놀이를 줄이고 실내 활동으로 대체해주세요.',
      caution: '호흡기 질환, 노령, 어린 동물 주의',
    },
    {
      icon: 'eye',
      title: '눈·코 자극 확인',
      body: '눈곱, 눈물, 재채기, 코 비빔이 늘면 황사 자극 가능성이 있어 상태를 관찰해주세요.',
      caution: '단두종, 눈이 돌출된 견종, 결막염 이력 동물 주의',
    },
    {
      icon: 'droplet',
      title: '산책 후 전신 닦기',
      body: '외출 후 발, 배, 얼굴, 털 표면을 닦아 황사 먼지가 남지 않게 해주세요.',
      caution: '장모종, 털을 자주 핥는 고양이 주의',
    },
    {
      icon: 'disc',
      title: '물그릇 청결 유지',
      body: '실내로 먼지가 들어올 수 있으니 물그릇과 식기를 자주 헹구고 깨끗한 물을 주세요.',
      caution: '음수량이 적은 고양이 주의',
    },
    {
      icon: 'square',
      title: '창문 개방 제한',
      body: '황사가 심한 시간에는 창문을 닫고, 환기는 농도가 낮아진 시간에 짧게 해주세요.',
      caution: '천식, 기관지염, 심장질환 동물 주의',
    },
  ],

  THUNDER: [
    {
      icon: 'shield',
      title: '실내 안전공간 마련',
      body: '천둥 소리가 들리기 전부터 창문에서 먼 조용한 방이나 이동장 근처에 쉴 공간을 마련해주세요.',
      caution: '분리불안, 소음공포 이력 동물 주의',
    },
    {
      icon: 'heart',
      title: '억지로 꺼내지 않기',
      body: '숨으려는 행동을 억지로 막지 말고, 안전한 장소라면 스스로 진정할 시간을 주세요.',
      caution: '겁이 많은 고양이, 구조견·구조묘 주의',
    },
    {
      icon: 'alert-triangle',
      title: '탈출 방지',
      body: '천둥 소리에 놀라 문밖으로 뛰쳐나갈 수 있으니 현관, 창문, 방충망을 닫아주세요.',
      caution: '산책 중 도망 이력 있는 동물 주의',
    },
    {
      icon: 'volume-2',
      title: '소음 완충',
      body: '커튼을 치고 TV, 라디오, 백색소음으로 외부 소리를 완화해주세요.',
      caution: '청각 예민한 동물, 노령견 주의',
    },
    {
      icon: 'alert-octagon',
      title: '산책 즉시 중단',
      body: '낙뢰 예보나 천둥번개가 있으면 야외 산책, 공원, 하천변 활동을 중단하고 실내로 이동해주세요.',
      caution: '야외 배변만 하는 동물은 짧고 안전한 장소 이용',
    },
  ],

  RAIN_LIGHT: [
    {
      icon: 'clock',
      title: '배변 외출은 짧게',
      body: '약한 비가 오는 날에는 꼭 필요한 배변 외출만 짧게 하고, 젖은 털은 바로 말려주세요.',
      caution: '소형견, 단모종, 노령동물 주의',
    },
    {
      icon: 'droplet',
      title: '젖은 발 바로 닦기',
      body: '외출 후 발바닥과 발가락 사이를 닦고 말려 습기와 피부 자극을 줄여주세요.',
      caution: '발 핥기, 지간염 이력 동물 주의',
    },
    {
      icon: 'slash',
      title: '빗물 섭취 방지',
      body: '길가 웅덩이나 빗물은 오염 가능성이 있어 마시거나 핥지 못하게 해주세요.',
      caution: '장이 예민한 동물 주의',
    },
    {
      icon: 'alert-circle',
      title: '우비·신발 불편 확인',
      body: '우비나 신발이 보행, 배변, 호흡을 방해하면 착용 시간을 줄이거나 사용을 피해주세요.',
      caution: '의류 착용을 싫어하는 동물 주의',
    },
    {
      icon: 'wind',
      title: '귀와 배 쪽 건조',
      body: '비에 젖은 뒤에는 귀 주변, 배, 다리 안쪽까지 잘 말려 피부와 귀 문제를 예방해주세요.',
      caution: '처진 귀 견종, 장모종, 외이염 이력 동물 주의',
    },
  ],

  TEMP_DIFF: [
    {
      icon: 'clock',
      title: '외출 시간 조정',
      body: '아침저녁 기온이 낮으면 산책 시간을 낮 쪽으로 옮기거나 보온을 챙겨주세요.',
      caution: '노령, 단모종, 소형견 주의',
    },
    {
      icon: 'activity',
      title: '기침·콧물 관찰',
      body: '일교차가 큰 날에는 기침, 콧물, 재채기, 식욕 저하가 생기는지 확인해주세요.',
      caution: '호흡기 약한 동물, 단두종 주의',
    },
    {
      icon: 'activity',
      title: '관절 뻣뻣함 확인',
      body: '기온 변화 뒤 절뚝거림, 계단 회피, 점프 회피가 있으면 활동 강도를 낮춰주세요.',
      caution: '노령견, 관절염, 슬개골 이력 동물 주의',
    },
    {
      icon: 'thermometer',
      title: '실내 온도 급변 줄이기',
      body: '난방·냉방을 갑자기 강하게 틀기보다 실내외 온도 차를 완만하게 조절해주세요.',
      caution: '심장질환, 기관지 질환 동물 주의',
    },
    {
      icon: 'activity',
      title: '산책 강도 천천히 증가',
      body: '선선해졌다고 갑자기 오래 뛰게 하지 말고 산책 시간과 운동량을 서서히 늘려주세요.',
      caution: '비만, 노령, 운동 부족 동물 주의',
    },
  ],

  HUMIDITY_HIGH: [
    {
      icon: 'thermometer',
      title: '열 배출 어려움 주의',
      body: '습도가 높으면 헐떡임으로 체온을 낮추기 어려울 수 있어 운동량을 줄여주세요.',
      caution: '단두종, 비만, 노령동물 주의',
    },
    {
      icon: 'search',
      title: '피부 습진 확인',
      body: '배, 겨드랑이, 사타구니, 발가락 사이가 붉거나 축축하지 않은지 확인해주세요.',
      caution: '장모종, 피부염 이력 동물 주의',
    },
    {
      icon: 'disc',
      title: '귀 건조 관리',
      body: '목욕, 비, 물놀이 뒤 귀 안쪽과 주변을 잘 말려 외이염 위험을 줄여주세요.',
      caution: '처진 귀 견종, 수영 자주 하는 동물 주의',
    },
    {
      icon: 'wind',
      title: '침구·장난감 건조',
      body: '습한 침구와 장난감은 세탁 후 완전히 말려 곰팡이와 냄새를 줄여주세요.',
      caution: '알레르기, 피부 가려움 이력 동물 주의',
    },
    {
      icon: 'slash',
      title: '사료 변질 주의',
      body: '고온다습한 날에는 사료와 간식을 밀폐 보관하고 냄새나 색이 변하면 급여하지 마세요.',
      caution: '위장 예민한 동물, 어린 동물 주의',
    },
  ],

  HUMIDITY_LOW: [
    {
      icon: 'search',
      title: '피부 각질 확인',
      body: '비듬, 각질, 털 푸석함, 과도한 긁기가 늘면 피부 건조를 확인해주세요.',
      caution: '피부질환 이력, 단모종, 노령동물 주의',
    },
    {
      icon: 'droplet',
      title: '실내 습도 보완',
      body: '공기가 건조하면 가습과 물그릇 관리로 실내 환경을 편안하게 유지해주세요.',
      caution: '호흡기 약한 동물, 고양이 주의',
    },
    {
      icon: 'alert-circle',
      title: '과한 목욕 피하기',
      body: '잦은 목욕은 피부 유분을 줄일 수 있어 목욕 간격과 샴푸 자극을 점검해주세요.',
      caution: '건성 피부, 알레르기 피부 동물 주의',
    },
    {
      icon: 'search',
      title: '발바닥 갈라짐 확인',
      body: '발바닥이 거칠거나 갈라지면 산책 후 상태를 확인하고 필요한 보습 관리를 해주세요.',
      caution: '겨울 산책 많은 강아지 주의',
    },
    {
      icon: 'zap',
      title: '정전기 스트레스 줄이기',
      body: '건조한 날에는 담요와 털에 정전기가 생길 수 있어 빗질과 습도 관리를 함께 해주세요.',
      caution: '장모종, 겁이 많은 동물 주의',
    },
  ],

  UV_HIGH: [
    {
      icon: 'sun',
      title: '한낮 햇빛 피하기',
      body: '자외선이 강한 날에는 오전 10시~오후 3시 산책을 피하고 그늘 위주로 이동해주세요.',
      caution: '흰털, 짧은털, 피부가 얇은 동물 주의',
    },
    {
      icon: 'shield',
      title: '귀·코·배 보호',
      body: '털이 적은 귀 끝, 코 주변, 배 부위는 햇빛에 민감할 수 있어 노출 시간을 줄여주세요.',
      caution: '흰 고양이, 단모종, 미용 직후 동물 주의',
    },
    {
      icon: 'scissors',
      title: '과도한 미용 주의',
      body: '털을 너무 짧게 밀면 피부가 자외선과 열에 직접 노출될 수 있어 주의해주세요.',
      caution: '이중모, 피부 약한 동물 주의',
    },
    {
      icon: 'umbrella',
      title: '그늘 산책 선택',
      body: '산책이 필요하면 그늘진 길, 흙길, 잔디길을 선택하고 햇빛 아래 대기는 줄여주세요.',
      caution: '발바닥 약한 동물, 노령견 주의',
    },
    {
      icon: 'clipboard',
      title: '반려동물용 차단제 상담',
      body: '햇빛에 약한 부위가 있다면 사람용 제품을 임의로 쓰지 말고 반려동물용 제품을 수의사와 상의해주세요.',
      caution: '피부질환, 알레르기, 핥는 습관 있는 동물 주의',
    },
  ],

  WIND_STRONG: [
    {
      icon: 'wind',
      title: '실외 산책 제한',
      body: '강풍이 불면 날아오는 물체, 소음, 갑작스러운 방향 전환 위험이 있어 산책을 줄여주세요.',
      caution: '소형견, 겁 많은 동물, 노령동물 주의',
    },
    {
      icon: 'link',
      title: '짧은 리드줄 사용',
      body: '외출이 꼭 필요하면 짧은 리드줄과 잘 맞는 하네스를 사용해 갑작스러운 돌발 행동을 막아주세요.',
      caution: '탈출 이력, 하네스 벗겨짐 이력 동물 주의',
    },
    {
      icon: 'square',
      title: '창문·방충망 확인',
      body: '강풍 때 창문과 방충망이 흔들리면 추락이나 탈출 위험이 있어 닫아주세요.',
      caution: '고양이, 창가에 자주 올라가는 동물 주의',
    },
    {
      icon: 'alert-triangle',
      title: '낙하물 접근 금지',
      body: '간판, 나뭇가지, 공사장 주변은 낙하물 위험이 있어 가까이 가지 않게 해주세요.',
      caution: '산책 경로가 도심·공사장 주변인 경우 주의',
    },
    {
      icon: 'volume-2',
      title: '소음 스트레스 완화',
      body: '바람 소리에 불안해하면 조용한 방, 담요, 백색소음으로 안정감을 주세요.',
      caution: '소음공포, 분리불안, 노령견 주의',
    },
  ],
};

/** 트리거에 해당하는 팁 1개 랜덤 선택. 카탈로그 비었거나 NONE 이면 null. */
export function selectWeatherTip(trigger: WeatherTrigger): WeatherTip | null {
  if (trigger === 'NONE') return null;
  const tips = WEATHER_TIPS[trigger];
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}
