import { Modal, Platform, StyleSheet, View, Text, ScrollView, TouchableOpacity, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import { useBottomSheetSafePadding } from '../../../shared/hooks/useBottomSheetSafePadding';
import GlassOverlay from '../../../shared/components/GlassOverlay';

export interface MonthlyTip {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
}

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const MONTHLY_TIPS: Record<Month, MonthlyTip[]> = {
  1: [
    { icon: 'cloud-snow', title: '한파 노출 주의',
      body: '장시간 야외 노출은 저체온 위험이 있어 산책 시간을 짧게 조절해주세요.' },
    { icon: 'alert-circle', title: '저체온 증상 확인',
      body: '떨림, 무기력, 반응 저하, 몸이 차가운 증상이 있으면 즉시 따뜻한 곳으로 옮겨주세요.' },
    { icon: 'alert-circle', title: '동상 위험 부위 확인',
      body: '귀 끝, 꼬리, 발끝이 차갑거나 창백하지 않은지 산책 후 확인해주세요.' },
    { icon: 'droplet', title: '제설제 제거',
      body: '산책 후 발바닥과 발가락 사이, 배 쪽에 묻은 염화칼슘과 제설제를 닦아주세요.' },
    { icon: 'droplet', title: '발바닥 갈라짐 관리',
      body: '겨울철 건조와 제설제로 발바닥이 갈라질 수 있어 보습 상태를 확인해주세요.' },
    { icon: 'alert-triangle', title: '난방기 화상 주의',
      body: '히터, 전기장판, 온열매트에 오래 닿지 않도록 거리와 사용 시간을 조절해주세요.' },
    { icon: 'zap', title: '전선 씹힘 예방',
      body: '전기장판, 난방기, 멀티탭 전선은 씹지 못하게 정리해주세요.' },
    { icon: 'wind', title: '실내 습도 관리',
      body: '난방으로 공기가 건조해지면 피부 가려움이 생길 수 있어 습도를 관리해주세요.' },
    { icon: 'wind', title: '목욕 후 완전 건조',
      body: '겨울에는 젖은 털이 체온을 떨어뜨릴 수 있어 목욕 후 충분히 말려주세요.' },
    { icon: 'activity', title: '활동량 감소 관리',
      body: '산책 시간이 줄어 체중이 늘기 쉬우므로 사료와 간식량을 점검해주세요.' },
    { icon: 'activity', title: '노령동물 관절 관찰',
      body: '추위에 관절이 뻣뻣해질 수 있어 절뚝거림과 계단 회피를 확인해주세요.' },
    { icon: 'alert-octagon', title: '부동액 접근 금지',
      body: '자동차 냉각수와 부동액은 소량 섭취도 위험할 수 있어 밀폐 보관해주세요.' },
    { icon: 'alert-triangle', title: '차량 주변 고양이 확인',
      body: '추운 날 고양이가 차 밑이나 엔진룸에 숨을 수 있어 시동 전 확인해주세요.' },
    { icon: 'package', title: '정전 대비 물품 준비',
      body: '사료, 물, 약, 담요, 이동장, 진료기록을 비상용으로 챙겨두세요.' },
    { icon: 'search', title: '겨울철 피부 상태 확인',
      body: '각질, 비듬, 과도한 긁기, 털 빠짐이 늘면 피부 상태를 확인해주세요.' },
  ],
  2: [
    { icon: 'cloud-snow', title: '늦겨울 한파 대비',
      body: '날이 풀린 것 같아도 급격한 추위가 올 수 있어 보온 관리를 유지해주세요.' },
    { icon: 'clock', title: '짧고 자주 하는 산책',
      body: '소형견, 단모종, 노령동물은 긴 산책보다 짧은 산책을 여러 번 하는 편이 안전해요.' },
    { icon: 'droplet', title: '제설제 잔여물 제거',
      body: '눈이 녹은 뒤에도 길가에 제설제가 남을 수 있어 발을 닦아주세요.' },
    { icon: 'search', title: '발가락 사이 눈 뭉침 확인',
      body: '눈길 산책 후 발가락 사이에 얼음이나 눈덩이가 끼지 않았는지 확인해주세요.' },
    { icon: 'droplet', title: '피부 건조 관리',
      body: '난방이 계속되는 시기라 가습, 빗질, 목욕 간격 조절이 필요해요.' },
    { icon: 'alert-triangle', title: '난방기 직접 접촉 제한',
      body: '뜨겁지 않아 보여도 오래 닿으면 저온화상이 생길 수 있어요.' },
    { icon: 'activity', title: '노령견·노령묘 통증 확인',
      body: '기상 직후 뻣뻣함, 점프 회피, 산책 거부가 있는지 살펴주세요.' },
    { icon: 'bar-chart', title: '체중 증가 점검',
      body: '겨울 동안 활동량이 줄었다면 체중과 허리 라인을 확인해주세요.' },
    { icon: 'calendar', title: '봄 예방관리 계획',
      body: '기온이 오르기 전 진드기·벼룩·심장사상충 예방 일정을 점검해주세요.' },
    { icon: 'shield', title: '예방약 보유량 확인',
      body: '봄철 외부 활동 증가 전에 예방약이 충분히 남아 있는지 확인해주세요.' },
    { icon: 'square', title: '방충망 사전 점검',
      body: '봄에 창문을 열기 전 방충망과 창틀의 흔들림을 미리 확인해주세요.' },
    { icon: 'alert-circle', title: '봄맞이 청소용품 보관',
      body: '세제, 소독제, 방향제는 반려동물이 닿지 않는 곳에 보관해주세요.' },
    { icon: 'eye', title: '알레르기 병력 확인',
      body: '작년 봄에 피부염이나 눈물 증가가 있었다면 올해도 미리 관찰 준비를 해주세요.' },
    { icon: 'link', title: '외출 장비 점검',
      body: '하네스, 목줄, 리드줄, 이동장 잠금 상태를 봄나들이 전 확인해주세요.' },
    { icon: 'clipboard', title: '건강검진 일정 검토',
      body: '봄 활동이 늘기 전 치아, 체중, 피부, 심장사상충 검사 일정을 확인해주세요.' },
  ],
  3: [
    { icon: 'shield', title: '진드기·벼룩 예방 점검',
      body: '기온이 오르고 산책이 늘면서 외부 기생충 노출이 증가할 수 있어요.' },
    { icon: 'search', title: '산책 후 몸 확인',
      body: '귀, 목, 겨드랑이, 발가락 사이, 꼬리 주변에 진드기가 붙었는지 확인해주세요.' },
    { icon: 'heart', title: '심장사상충 예방 유지',
      body: '모기 활동 전후부터 예방이 중요하므로 예방 일정을 끊지 말아주세요.' },
    { icon: 'eye', title: '꽃가루 알레르기 관찰',
      body: '발 핥기, 피부 붉어짐, 눈물, 귀 가려움이 늘면 알레르기 가능성을 확인해주세요.' },
    { icon: 'droplet', title: '외출 후 발 닦기',
      body: '꽃가루, 먼지, 흙 자극을 줄이기 위해 산책 후 발과 배 쪽을 닦아주세요.' },
    { icon: 'alert-octagon', title: '봄꽃 독성 확인',
      body: '꽃다발이나 화분을 들일 때 반려동물에게 독성이 있는 식물인지 확인해주세요.' },
    { icon: 'alert-octagon', title: '고양이 백합 노출 금지',
      body: '백합류는 고양이에게 매우 위험할 수 있어 집 안에 두지 않는 편이 안전해요.' },
    { icon: 'alert-octagon', title: '구근 식물 섭취 주의',
      body: '튤립, 수선화 등 구근 식물은 씹거나 삼키지 못하게 해주세요.' },
    { icon: 'square', title: '방충망·창문 점검',
      body: '창문을 여는 일이 늘어나는 시기라 추락 위험을 미리 확인해주세요.' },
    { icon: 'alert-triangle', title: '마당 비료 주의',
      body: '비료, 제초제, 살충제 사용 후에는 완전히 마른 뒤 접근하게 해주세요.' },
    { icon: 'alert-octagon', title: '야생 버섯 섭취 금지',
      body: '비 온 뒤 생긴 버섯은 독성 구분이 어려우므로 먹지 못하게 막아주세요.' },
    { icon: 'feather', title: '털갈이 관리 시작',
      body: '봄철 털갈이 시기에는 빗질로 엉킴과 피부 자극을 줄여주세요.' },
    { icon: 'disc', title: '귀 냄새 확인',
      body: '알레르기나 습도 변화로 귀 염증이 생길 수 있어 냄새와 긁기를 확인해주세요.' },
    { icon: 'tag', title: '인식표 확인',
      body: '외출이 늘기 전 인식표, 마이크로칩, 연락처 정보를 점검해주세요.' },
    { icon: 'calendar', title: '예방접종 일정 확인',
      body: '외부 활동 전 광견병, 종합백신, 구충 일정을 확인해주세요.' },
  ],
  4: [
    { icon: 'shield', title: '진드기 집중 확인',
      body: '공원, 잔디밭, 등산로 산책 후에는 몸 전체를 꼼꼼히 확인해주세요.' },
    { icon: 'shield', title: '벼룩 예방 유지',
      body: '따뜻한 날씨에는 벼룩 활동도 늘 수 있어 예방 관리를 이어가주세요.' },
    { icon: 'heart', title: '심장사상충 예방 지속',
      body: '모기가 보이기 시작하면 감염 위험이 커질 수 있어 예방을 유지해주세요.' },
    { icon: 'droplet', title: '꽃가루 접촉 줄이기',
      body: '산책 후 털과 발을 닦아 꽃가루가 피부에 오래 남지 않게 해주세요.' },
    { icon: 'eye', title: '눈물·재채기 관찰',
      body: '계절성 자극으로 눈물, 재채기, 코 주변 불편감이 생기는지 확인해주세요.' },
    { icon: 'search', title: '피부 핥기 확인',
      body: '발을 과하게 핥거나 배를 긁으면 알레르기성 피부 문제일 수 있어요.' },
    { icon: 'alert-triangle', title: '비료·제초제 노출 제한',
      body: '화단, 잔디밭, 텃밭 약품 처리 구역은 안전 시간이 지난 뒤 접근하게 해주세요.' },
    { icon: 'alert-octagon', title: '독성 식물 정리',
      body: '백합, 튤립, 수선화 등 위험 식물은 반려동물 접근 범위 밖에 두세요.' },
    { icon: 'package', title: '봄나들이 이동장 적응',
      body: '여행 전 이동장에 익숙해지도록 짧은 시간부터 적응시켜주세요.' },
    { icon: 'link', title: '하네스 사이즈 확인',
      body: '겨울 동안 체중이 변했을 수 있어 하네스가 너무 조이거나 헐겁지 않은지 확인해주세요.' },
    { icon: 'alert-triangle', title: '차량 이동 안전',
      body: '드라이브나 여행 시 이동장 또는 안전벨트형 장비를 사용해주세요.' },
    { icon: 'search', title: '산책로 이물질 주의',
      body: '풀씨, 가시, 작은 돌이 발가락 사이에 끼지 않았는지 확인해주세요.' },
    { icon: 'alert-circle', title: '야생동물 접촉 주의',
      body: '야외활동 중 야생동물 배설물이나 사체에 접근하지 못하게 해주세요.' },
    { icon: 'alert-octagon', title: '실내 해충약 관리',
      body: '바퀴벌레약, 개미약, 살충제는 반려동물이 닿지 않는 곳에 두세요.' },
    { icon: 'clipboard', title: '봄철 건강검진 고려',
      body: '활동량이 늘기 전 체중, 치아, 피부, 기생충 예방 상태를 점검해주세요.' },
  ],
  5: [
    { icon: 'thermometer', title: '초여름 더위 적응',
      body: '갑자기 기온이 오르면 열 스트레스가 생길 수 있어 산책 강도를 서서히 조절해주세요.' },
    { icon: 'clock', title: '한낮 산책 줄이기',
      body: '더운 시간대 산책은 피하고 아침이나 저녁 산책을 늘려주세요.' },
    { icon: 'alert-circle', title: '발바닥 화상 주의',
      body: '아스팔트와 모래가 뜨거워질 수 있어 산책 전 바닥 온도를 확인해주세요.' },
    { icon: 'droplet', title: '물과 그늘 준비',
      body: '야외활동 시 신선한 물과 쉴 수 있는 그늘을 반드시 준비해주세요.' },
    { icon: 'alert-triangle', title: '차 안 방치 금지',
      body: '잠깐이라도 차량 내부 온도는 빠르게 올라가므로 혼자 두지 마세요.' },
    { icon: 'heart', title: '심장사상충 예방 확인',
      body: '모기 활동이 늘어나는 시기라 예방약 복용 여부를 확인해주세요.' },
    { icon: 'search', title: '진드기·벼룩 확인 지속',
      body: '풀숲 산책 후에는 귀, 목, 겨드랑이, 발가락 사이를 확인해주세요.' },
    { icon: 'disc', title: '외이염 초기 증상 관찰',
      body: '귀 냄새, 머리 흔들기, 귀 긁기가 늘면 귀 상태를 확인해주세요.' },
    { icon: 'wind', title: '목욕 후 건조 철저',
      body: '습한 상태가 오래가면 피부염이 생길 수 있어 털과 발을 잘 말려주세요.' },
    { icon: 'scissors', title: '무리한 미용 주의',
      body: '털을 너무 짧게 밀면 피부가 자외선과 열에 노출될 수 있어요.' },
    { icon: 'calendar', title: '여행 전 백신 점검',
      body: '호텔링, 펜션, 유치원 이용 전 예방접종과 구충 상태를 확인해주세요.' },
    { icon: 'package', title: '이동 스트레스 관리',
      body: '장거리 이동 전 이동장, 물, 배변패드, 평소 먹던 사료를 준비해주세요.' },
    { icon: 'alert-octagon', title: '봄철 독성 식물 마무리 점검',
      body: '꽃다발, 화분, 정원 식물이 안전한지 다시 확인해주세요.' },
    { icon: 'slash', title: '사료 보관 상태 확인',
      body: '기온이 오르면 사료 산패가 빨라질 수 있어 밀폐 보관해주세요.' },
    { icon: 'search', title: '피부 붉어짐 관찰',
      body: '더위와 알레르기가 겹치면 피부 트러블이 늘 수 있어 배와 발을 확인해주세요.' },
  ],
  6: [
    { icon: 'thermometer', title: '열사병 예방 시작',
      body: '더운 날 과도한 운동을 피하고 실내 휴식 시간을 늘려주세요.' },
    { icon: 'clock', title: '한낮 외출 제한',
      body: '기온과 습도가 높은 시간에는 산책과 야외놀이를 줄여주세요.' },
    { icon: 'alert-triangle', title: '차량 방치 절대 금지',
      body: '창문을 조금 열어도 차량 내부는 위험하게 더워질 수 있어요.' },
    { icon: 'droplet', title: '탈수 예방',
      body: '물그릇을 자주 확인하고 외출 시 휴대용 물을 챙겨주세요.' },
    { icon: 'umbrella', title: '그늘 확보',
      body: '야외에 머무를 때는 햇빛을 피할 수 있는 그늘을 반드시 마련해주세요.' },
    { icon: 'alert-circle', title: '발바닥 화상 확인',
      body: '도로, 데크, 모래사장은 쉽게 뜨거워지므로 걷기 전 확인해주세요.' },
    { icon: 'wind', title: '단두종 더위 주의',
      body: '퍼그, 불도그, 시추 등 코가 짧은 견종은 더위 노출을 최소화해주세요.' },
    { icon: 'activity', title: '노령·비만 동물 관리',
      body: '노령, 비만, 심장·호흡기 질환이 있는 동물은 더위에 더 취약할 수 있어요.' },
    { icon: 'search', title: '장마철 피부염 주의',
      body: '젖은 털과 발은 잘 말리고 피부가 붉어지지 않는지 확인해주세요.' },
    { icon: 'disc', title: '외이염 관리',
      body: '습도가 높으면 귀 염증이 늘 수 있어 귀 냄새와 분비물을 확인해주세요.' },
    { icon: 'heart', title: '심장사상충 예방 유지',
      body: '모기 활동이 활발해지는 시기라 예방을 꾸준히 이어가주세요.' },
    { icon: 'shield', title: '벼룩·진드기 예방 유지',
      body: '여름에도 외부 기생충 예방과 산책 후 확인을 계속해주세요.' },
    { icon: 'slash', title: '사료·간식 변질 주의',
      body: '고온다습한 곳에 사료와 간식을 방치하지 말고 밀폐 보관해주세요.' },
    { icon: 'life-buoy', title: '물놀이 전 안전 확인',
      body: '수영을 잘해도 구명조끼와 보호자 감시가 필요해요.' },
    { icon: 'package', title: '폭우 대비 준비',
      body: '정전이나 침수 상황에 대비해 사료, 약, 물, 이동장을 준비해주세요.' },
  ],
  7: [
    { icon: 'thermometer', title: '폭염기 열사병 최고 주의',
      body: '과도한 헐떡임, 침 흘림, 비틀거림, 구토는 응급 신호로 봐야 해요.' },
    { icon: 'clock', title: '산책 시간 엄격 조정',
      body: '이른 아침이나 해가 진 뒤로 산책 시간을 옮겨주세요.' },
    { icon: 'alert-triangle', title: '차 안 방치 금지',
      body: '여름철 차량 내부는 매우 빠르게 뜨거워지므로 절대 혼자 두지 마세요.' },
    { icon: 'thermometer', title: '실내 온도 관리',
      body: '실내도 너무 덥거나 통풍이 안 되면 열 스트레스가 생길 수 있어요.' },
    { icon: 'droplet', title: '신선한 물 상시 제공',
      body: '물그릇을 여러 곳에 두고 자주 갈아주세요.' },
    { icon: 'alert-circle', title: '발바닥 화상 주의',
      body: '해가 진 뒤에도 도로 열기가 남을 수 있어 바닥 온도를 확인해주세요.' },
    { icon: 'life-buoy', title: '물놀이 익수 사고 주의',
      body: '수영장, 계곡, 바다에서는 보호자 감시와 구명조끼를 준비해주세요.' },
    { icon: 'alert-octagon', title: '녹조 물 접촉 금지',
      body: '색이 이상하거나 냄새나는 물은 마시거나 들어가지 못하게 해주세요.' },
    { icon: 'alert-circle', title: '장마 후 곰팡이 주의',
      body: '습한 침구와 장난감은 세척·건조해 곰팡이 노출을 줄여주세요.' },
    { icon: 'wind', title: '귀와 발가락 사이 건조',
      body: '물놀이와 목욕 후에는 귀와 발가락 사이를 잘 말려주세요.' },
    { icon: 'search', title: '여름철 피부 트러블 확인',
      body: '배, 겨드랑이, 사타구니가 붉거나 습하지 않은지 확인해주세요.' },
    { icon: 'heart', title: '심장사상충 예방 유지',
      body: '모기 노출이 많은 시기라 예방을 빠뜨리지 않도록 해주세요.' },
    { icon: 'alert-circle', title: '벌레 물림 확인',
      body: '산책 후 얼굴, 발, 배 부위에 붓기나 가려움이 있는지 확인해주세요.' },
    { icon: 'package', title: '휴가철 이동 스트레스 관리',
      body: '장거리 이동 뒤 식욕, 설사, 구토, 무기력을 확인해주세요.' },
    { icon: 'trash-2', title: '여름철 음식물 쓰레기 관리',
      body: '상한 음식, 뼈, 포장지 섭취 사고가 생기지 않게 쓰레기통을 닫아주세요.' },
  ],
  8: [
    { icon: 'thermometer', title: '지속 폭염 관리',
      body: '더위가 누적되면 체력이 떨어질 수 있어 외출과 운동량을 줄여주세요.' },
    { icon: 'droplet', title: '탈수 증상 관찰',
      body: '잇몸이 끈적하거나 무기력하고 소변량이 줄면 탈수를 의심해야 해요.' },
    { icon: 'alert-circle', title: '산책 전 바닥 확인',
      body: '도로, 모래, 데크가 뜨거우면 발바닥 화상 위험이 있어요.' },
    { icon: 'alert-triangle', title: '차량 이동 전 냉방',
      body: '차를 태우기 전 실내 온도를 낮추고 이동 중 통풍을 유지해주세요.' },
    { icon: 'wind', title: '냉방 직접 바람 주의',
      body: '에어컨 바람이 몸에 계속 닿지 않도록 자리를 조절해주세요.' },
    { icon: 'thermometer', title: '실내외 온도차 관리',
      body: '급격한 온도 변화로 컨디션이 떨어지지 않게 해주세요.' },
    { icon: 'search', title: '물놀이 후 피부 확인',
      body: '수영 뒤 피부 붉어짐, 귀 냄새, 발가락 사이 습기를 확인해주세요.' },
    { icon: 'alert-octagon', title: '녹조·오염수 주의',
      body: '여름철 호수나 하천 물은 상태를 확인하고 이상하면 접근을 막아주세요.' },
    { icon: 'heart', title: '심장사상충 예방 지속',
      body: '모기 노출이 계속되는 시기라 예방 일정을 유지해주세요.' },
    { icon: 'shield', title: '진드기·벼룩 확인 지속',
      body: '풀숲과 휴가지 산책 후 몸 전체를 확인해주세요.' },
    { icon: 'slash', title: '사료 산패 주의',
      body: '사료 봉투를 오래 열어두지 말고 서늘하고 건조한 곳에 보관해주세요.' },
    { icon: 'search', title: '습진·핫스팟 관찰',
      body: '특정 부위를 계속 핥거나 털이 젖어 있으면 피부염을 확인해주세요.' },
    { icon: 'alert-circle', title: '벌·곤충 쏘임 주의',
      body: '얼굴이나 입 주변이 갑자기 붓거나 호흡이 불편하면 즉시 진료가 필요해요.' },
    { icon: 'check-square', title: '휴가 후 회복 관찰',
      body: '여행 뒤 설사, 구토, 식욕 저하, 과도한 피로가 있는지 확인해주세요.' },
    { icon: 'package', title: '태풍 대비 물품 준비',
      body: '정전과 외출 제한에 대비해 사료, 물, 약, 배변용품을 준비해주세요.' },
  ],
  9: [
    { icon: 'thermometer', title: '늦여름 더위 주의',
      body: '9월에도 낮 기온이 높을 수 있어 한낮 산책은 피해주세요.' },
    { icon: 'shield', title: '진드기 예방 계속',
      body: '날이 선선해져도 진드기 활동은 이어질 수 있어 예방을 유지해주세요.' },
    { icon: 'search', title: '산책 후 몸 확인',
      body: '풀숲과 낙엽 주변을 다녀온 뒤 귀, 겨드랑이, 발가락 사이를 확인해주세요.' },
    { icon: 'heart', title: '심장사상충 예방 유지',
      body: '모기가 완전히 사라지기 전까지 예방 일정을 이어가주세요.' },
    { icon: 'wind', title: '일교차 컨디션 관찰',
      body: '아침저녁 기온 차로 기침, 무기력, 식욕 변화가 생기는지 확인해주세요.' },
    { icon: 'feather', title: '가을 털갈이 시작',
      body: '빗질로 엉킨 털과 피부 자극, 고양이 헤어볼 위험을 줄여주세요.' },
    { icon: 'droplet', title: '피부 건조 전환 관찰',
      body: '여름 습진이 지나도 가을 건조로 가려움이 생길 수 있어요.' },
    { icon: 'link', title: '산책 장비 점검',
      body: '나들이가 늘기 전 하네스, 리드줄, 목줄 마모 상태를 확인해주세요.' },
    { icon: 'search', title: '풀씨·이물질 확인',
      body: '발가락 사이, 귀 주변, 배 쪽에 풀씨나 가시가 붙지 않았는지 봐주세요.' },
    { icon: 'alert-octagon', title: '야생 버섯 주의 시작',
      body: '비 온 뒤 산책로에 생긴 버섯은 먹지 못하게 막아주세요.' },
    { icon: 'alert-octagon', title: '쥐약 접근 주의',
      body: '실내외 방제용 약품을 반려동물이 닿지 않는 곳에 두세요.' },
    { icon: 'tag', title: '가을 나들이 인식표 확인',
      body: '외출이 늘어나는 시기라 인식표와 연락처를 점검해주세요.' },
    { icon: 'eye', title: '알레르기 재발 관찰',
      body: '가을 꽃가루나 곰팡이로 피부와 귀 문제가 재발할 수 있어요.' },
    { icon: 'activity', title: '활동량 증가 조절',
      body: '선선해졌다고 갑자기 운동량을 늘리면 관절에 부담이 될 수 있어요.' },
    { icon: 'clipboard', title: '가을 건강검진 고려',
      body: '여름을 지나며 변한 체중, 피부, 치아, 심장사상충 상태를 확인해주세요.' },
  ],
  10: [
    { icon: 'shield', title: '진드기 막바지 관리',
      body: '가을 산책이 많아지는 시기라 예방과 몸 확인을 계속해주세요.' },
    { icon: 'search', title: '낙엽 속 이물질 주의',
      body: '낙엽 아래 벌레, 유리 조각, 음식물 쓰레기가 있을 수 있어요.' },
    { icon: 'alert-octagon', title: '야생 버섯 섭취 금지',
      body: '가을에는 버섯이 많이 자라므로 산책 중 먹지 못하게 해주세요.' },
    { icon: 'alert-octagon', title: '쥐약·살서제 접근 금지',
      body: '방제용 약품은 반려동물 접근이 불가능한 곳에 보관해주세요.' },
    { icon: 'slash', title: '초콜릿 주의',
      body: '할로윈이나 간식 시즌에는 초콜릿 노출이 늘어날 수 있어요.' },
    { icon: 'slash', title: '자일리톨 주의',
      body: '무설탕 껌, 캔디, 일부 디저트는 반려동물에게 위험할 수 있어요.' },
    { icon: 'tag', title: '의상 착용 스트레스 확인',
      body: '의상이 호흡, 보행, 시야를 방해하면 바로 벗겨주세요.' },
    { icon: 'gift', title: '장식품 씹힘 주의',
      body: '작은 장식, 끈, 리본, 플라스틱 조각을 삼키지 못하게 해주세요.' },
    { icon: 'volume-2', title: '방문객 스트레스 관리',
      body: '초인종, 낯선 사람, 소음이 많은 날은 조용한 공간을 마련해주세요.' },
    { icon: 'alert-triangle', title: '문 열림 탈출 사고 예방',
      body: '방문객이 오가는 날에는 현관 접근을 제한해주세요.' },
    { icon: 'activity', title: '노령동물 관절 관찰',
      body: '서늘한 날씨에 움직임이 둔해지거나 계단을 피하는지 확인해주세요.' },
    { icon: 'feather', title: '털갈이 관리 지속',
      body: '빗질로 털 엉킴과 피부 자극을 줄여주세요.' },
    { icon: 'droplet', title: '실내 건조 대비 시작',
      body: '난방 전환 전 물 섭취량과 피부 상태를 확인해주세요.' },
    { icon: 'activity', title: '운동량 변화 조절',
      body: '선선한 날씨에 갑자기 오래 뛰게 하면 근육과 관절에 부담이 될 수 있어요.' },
    { icon: 'bar-chart', title: '가을 식욕 증가 관리',
      body: '식욕이 늘어도 간식과 사료량을 일정하게 관리해주세요.' },
  ],
  11: [
    { icon: 'clipboard', title: '겨울 전 건강검진 고려',
      body: '추위가 오기 전 치아, 체중, 관절, 심장, 신장 상태를 확인해주세요.' },
    { icon: 'alert-triangle', title: '난방기 사용 전 점검',
      body: '히터, 전기장판, 온열매트의 전선과 과열 위험을 확인해주세요.' },
    { icon: 'alert-circle', title: '저온화상 예방',
      body: '온열기구에 오래 기대어 자지 않도록 사용 시간을 조절해주세요.' },
    { icon: 'droplet', title: '실내 습도 관리 시작',
      body: '난방을 켜기 시작하면 피부와 호흡기가 건조해질 수 있어요.' },
    { icon: 'wind', title: '목욕 후 건조 강화',
      body: '기온이 낮아지는 시기라 목욕 뒤 털을 충분히 말려주세요.' },
    { icon: 'wind', title: '산책 보온 준비',
      body: '소형견, 단모종, 노령동물은 보온복 사용을 고려해주세요.' },
    { icon: 'droplet', title: '발바닥 보호 준비',
      body: '겨울 제설제와 찬 바닥에 대비해 발 상태를 미리 확인해주세요.' },
    { icon: 'activity', title: '활동량 감소 대비',
      body: '추위로 산책이 줄기 전 실내 놀이와 체중 관리 계획을 세워주세요.' },
    { icon: 'slash', title: '명절·모임 음식 주의',
      body: '양파, 마늘, 뼈, 기름진 음식, 생반죽은 먹이지 마세요.' },
    { icon: 'trash-2', title: '음식물 쓰레기통 관리',
      body: '모임 뒤 뼈, 포장지, 상한 음식 섭취 사고를 막기 위해 뚜껑을 닫아주세요.' },
    { icon: 'slash', title: '초콜릿·디저트 관리',
      body: '연말 선물과 간식이 늘기 전 위험 식품을 따로 보관해주세요.' },
    { icon: 'package', title: '겨울 비상가방 준비',
      body: '사료, 물, 약, 담요, 이동장, 진료기록을 챙겨두세요.' },
    { icon: 'alert-octagon', title: '차량 부동액 관리',
      body: '겨울 차량 정비 후 냉각수와 부동액이 새지 않는지 확인해주세요.' },
    { icon: 'activity', title: '노령동물 통증 관찰',
      body: '추워지며 관절 통증이 심해질 수 있어 보행 변화를 봐주세요.' },
    { icon: 'clock', title: '겨울 산책 루틴 조정',
      body: '기온이 급격히 떨어지는 날은 산책 시간과 강도를 줄여주세요.' },
  ],
  12: [
    { icon: 'cloud-snow', title: '본격 한파 주의',
      body: '추운 날에는 야외 노출 시간을 줄이고 실내 휴식을 우선해주세요.' },
    { icon: 'alert-circle', title: '저체온 증상 확인',
      body: '떨림, 무기력, 반응 저하, 몸이 차가운 증상이 있으면 즉시 보온해주세요.' },
    { icon: 'alert-circle', title: '동상 부위 확인',
      body: '귀 끝, 꼬리, 발끝이 차갑거나 창백하지 않은지 산책 후 확인해주세요.' },
    { icon: 'droplet', title: '제설제·염화칼슘 제거',
      body: '산책 후 발과 배를 닦아 피부 자극과 섭취 위험을 줄여주세요.' },
    { icon: 'alert-triangle', title: '눈길 미끄러짐 주의',
      body: '빙판길에서는 관절과 인대에 부담이 갈 수 있어 천천히 걸어주세요.' },
    { icon: 'alert-triangle', title: '난방기 화상 예방',
      body: '히터, 전기장판, 핫팩에 오래 닿지 않게 해주세요.' },
    { icon: 'zap', title: '전선 씹힘 방지',
      body: '트리 조명, 난방기, 전기장판 전선은 씹지 못하게 정리해주세요.' },
    { icon: 'gift', title: '크리스마스 장식 섭취 주의',
      body: '리본, 반짝이 줄, 유리 장식은 삼키면 위험할 수 있어요.' },
    { icon: 'alert-triangle', title: '양초·화재 위험 관리',
      body: '촛불과 향초는 넘어뜨리거나 털에 닿지 않도록 사용을 제한해주세요.' },
    { icon: 'slash', title: '연말 음식 공유 금지',
      body: '초콜릿, 술, 기름진 고기, 뼈, 자일리톨 음식은 먹이지 마세요.' },
    { icon: 'volume-2', title: '방문객 스트레스 관리',
      body: '손님이 많은 날은 조용히 쉴 수 있는 공간을 따로 마련해주세요.' },
    { icon: 'alert-triangle', title: '문 열림 탈출 예방',
      body: '연말 모임 때 현관문이 자주 열리므로 인식표와 분리 공간을 확인해주세요.' },
    { icon: 'alert-octagon', title: '부동액 접근 금지',
      body: '자동차 냉각수와 부동액은 반려동물이 닿지 않는 곳에 보관해주세요.' },
    { icon: 'package', title: '정전·한파 대비',
      body: '사료, 물, 약, 담요, 이동장, 진료기록을 비상용으로 준비해주세요.' },
    { icon: 'bar-chart', title: '겨울철 체중 관리',
      body: '활동량이 줄어 살이 찌기 쉬우므로 사료량과 간식량을 점검해주세요.' },
  ],
};

export function getCurrentMonth(): Month {
  return (new Date().getMonth() + 1) as Month;
}

export function getMonthlyTip(month: Month = getCurrentMonth()): MonthlyTip {
  const tips = MONTHLY_TIPS[month];
  return tips[Math.floor(Math.random() * tips.length)];
}

export default function MonthlyCareGuideModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const padBottom = useBottomSheetSafePadding();
  const month = getCurrentMonth();
  const tips = MONTHLY_TIPS[month];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <GlassOverlay onPress={onClose} style={{ justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderTopLeftRadius: Spacing.borderRadius.xxl,
            borderTopRightRadius: Spacing.borderRadius.xxl,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: Colors.glass.border,
            maxHeight: '85%',
          }}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              backgroundColor: Colors.glass.surfaceStrong,
              padding: Spacing.lg,
              paddingBottom: padBottom,
            }}
          >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              marginBottom: Spacing.md,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary, fontWeight: Typography.weight.bold }}>
              {month}월 케어 안내
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={Spacing.hitSlop}>
              <Text style={{ ...Typography.preset.body, color: Colors.text.secondary }}>닫기</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.lg }} nestedScrollEnabled>
            {tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  padding: Spacing.md,
                  backgroundColor: Colors.primaryLight,
                  borderRadius: Spacing.borderRadius.lg,
                  flexDirection: 'row',
                  gap: Spacing.md,
                  alignItems: 'flex-start',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={{ width: 24, height: 24, borderRadius: 5 }}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary, fontWeight: Typography.weight.semibold }}>
                    {tip.title}
                  </Text>
                  <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginTop: Spacing.xs }}>
                    {tip.body}
                  </Text>
                </View>
              </View>
            ))}
            <Text
              style={{
                ...Typography.preset.caption,
                color: Colors.text.tertiary,
                marginTop: Spacing.md,
                paddingHorizontal: Spacing.xs,
                lineHeight: Typography.size.xs * Typography.lineHeight.relaxed,
              }}
            >
              지역, 기온, 생활환경에 따라 주의 시기는 달라질 수 있습니다. 예방약, 백신, 질병 관리는 반려동물의 종·나이·건강 상태에 따라 담당 수의사와 상담해 조정해주세요.
            </Text>
          </ScrollView>
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}
