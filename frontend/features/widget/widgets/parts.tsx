import React from 'react';
import { FlexWidget, ImageWidget, TextWidget, type ImageWidgetSource } from 'react-native-android-widget';
import { Colors } from '../../../constants';

// 위젯은 헤드리스 렌더라 useColors() 를 못 쓰고, light/dark 두 벌을 미리 만들어 라이브러리에 넘긴다
// (시스템 다크모드가 자동 선택). 모든 색은 constants/colors 에서만 (하드코딩 금지 규칙 준수).
// 라이브러리 색 prop(ColorProp) 은 `#${string}` | rgba 템플릿 타입. 우리 토큰은 전부 hex 라 좁힌다.
type WColor = `#${string}`;
export type Wid = {
  card: WColor;
  border: WColor;
  borderStrong: WColor;
  ink: WColor;
  sub: WColor;
  faint: WColor;
  white: WColor;
  primary: WColor;
  primaryLight: WColor;
  primaryDark: WColor;
  track: WColor;
  done: WColor;
};

export const lightWid: Wid = {
  card: Colors.surfaceElevated,
  border: Colors.border,
  borderStrong: Colors.borderStrong,
  ink: Colors.text.primary,
  sub: Colors.text.secondary,
  faint: Colors.text.tertiary,
  white: Colors.white,
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  track: Colors.borderStrong,
  done: Colors.status.success,
};

export const darkWid: Wid = {
  card: Colors.dark.surfaceElevated,
  border: Colors.dark.border,
  borderStrong: Colors.dark.borderStrong,
  ink: Colors.dark.text.primary,
  sub: Colors.dark.text.secondary,
  faint: Colors.dark.text.tertiary,
  white: Colors.white,
  primary: Colors.dark.primary,
  primaryLight: Colors.dark.primaryLight,
  primaryDark: Colors.dark.primaryDark,
  track: Colors.dark.borderStrong,
  done: Colors.status.success,
};

const ZERO = <FlexWidget style={{ width: 0, height: 0 }} />;

/** 위젯 바깥 카드 — 배경 + 둥근 모서리 + 패딩. 전체를 탭하면 link 로 이동. */
export function Card({
  children,
  link,
  c,
  padding = 14,
}: {
  children: React.ReactNode;
  link: string;
  c: Wid;
  padding?: number;
}) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: link }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: c.card,
        borderRadius: 24,
        padding,
      }}
    >
      {children}
    </FlexWidget>
  );
}

/** 원형 아바타 — 펫 프로필 사진. 사진 없으면 핑크 원 + 이모지 폴백. */
export function Avatar({
  image,
  c,
  emoji = '🐾',
  size = 26,
}: {
  image?: string | null;
  c: Wid;
  emoji?: string;
  size?: number;
}) {
  if (image) {
    // 백엔드 프로필 이미지는 https S3 URL. ImageWidget 은 http/https/data/require 소스만 받는다.
    return (
      <ImageWidget
        image={image as ImageWidgetSource}
        imageWidth={size}
        imageHeight={size}
        radius={size / 2}
      />
    );
  }
  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextWidget text={emoji} style={{ fontSize: size * 0.5 }} />
    </FlexWidget>
  );
}

/** 진행 도트 — 채워진 도트 = 완료. total 이 크면 5칸으로 비율 축소. */
export function Dots({ done, total, c }: { done: number; total: number; c: Wid }) {
  if (total <= 0) return ZERO;
  const slots = Math.min(total, 5);
  const filled = total <= 5 ? done : Math.round((done / total) * 5);
  const dots = [];
  for (let i = 0; i < slots; i++) {
    dots.push(
      <FlexWidget
        key={i}
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          marginLeft: i === 0 ? 0 : 3,
          backgroundColor: i < filled ? c.primary : c.track,
        }}
      >
        {ZERO}
      </FlexWidget>,
    );
  }
  return <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>{dots}</FlexWidget>;
}

/**
 * 헤더 한 줄 — 왼쪽 아바타+타이틀, 오른쪽 보조 텍스트(+도트).
 * image 가 있으면 펫 프로필 사진을, 없으면 emoji 폴백을 아바타로 쓴다.
 */
export function Header({
  c,
  image,
  emoji,
  title,
  rightText,
  dots,
}: {
  c: Wid;
  image?: string | null;
  emoji?: string;
  title: string;
  rightText?: string;
  dots?: { done: number; total: number };
}) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
        <Avatar image={image} emoji={emoji} c={c} />
        <TextWidget
          text={title}
          truncate="END"
          maxLines={1}
          style={{ fontSize: 14, fontWeight: '700', color: c.ink, marginLeft: 8 }}
        />
      </FlexWidget>
      {rightText || dots ? (
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          {rightText ? (
            <TextWidget text={rightText} style={{ fontSize: 11, fontWeight: '600', color: c.faint }} />
          ) : null}
          {dots ? <Dots done={dots.done} total={dots.total} c={c} /> : null}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

/**
 * 체크박스 한 줄 — 완료는 핑크 박스 + ✓, 미완료는 빈 박스.
 * 멀티펫일 땐 petImage(작은 아바타) + meta(펫 이름)로 어느 아이 할 일인지 표시.
 */
export function CheckRow({
  c,
  name,
  done,
  meta,
  petImage,
}: {
  c: Wid;
  name: string;
  done: boolean;
  meta?: string | null;
  petImage?: string | null;
}) {
  return (
    <FlexWidget
      style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
    >
      <FlexWidget
        style={{
          width: 18,
          height: 18,
          borderRadius: 6,
          marginRight: 9,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? c.primary : c.card,
          borderWidth: done ? 0 : 1.5,
          borderColor: c.borderStrong,
        }}
      >
        {done ? (
          <TextWidget text="✓" style={{ fontSize: 11, fontWeight: '700', color: c.white }} />
        ) : (
          ZERO
        )}
      </FlexWidget>
      {petImage !== undefined ? (
        <FlexWidget style={{ marginRight: 7 }}>
          <Avatar image={petImage} size={18} c={c} />
        </FlexWidget>
      ) : null}
      <TextWidget
        text={name}
        truncate="END"
        maxLines={1}
        style={{ fontSize: 14, fontWeight: '500', color: done ? c.faint : c.ink }}
      />
      {meta ? (
        <TextWidget text={meta} style={{ fontSize: 12, fontWeight: '400', color: c.faint, marginLeft: 6 }} />
      ) : null}
    </FlexWidget>
  );
}

/** D-day 배지 텍스트. */
export function dDayLabel(dDay: number): string {
  return dDay === 0 ? '오늘' : `D-${dDay}`;
}

/** 다가오는 일정 한 줄. */
export function EventRow({
  c,
  petName,
  title,
  when,
  dDay,
  compact = false,
  icon,
}: {
  c: Wid;
  petName: string;
  title: string;
  when: string;
  dDay: number;
  compact?: boolean;
  icon?: string;
}) {
  const today = dDay === 0;
  const label = icon ? `${icon} ${petName} · ${title}` : `${petName} · ${title}`;
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
      }}
    >
      <FlexWidget style={{ flex: 1, flexDirection: 'column', marginRight: 8 }}>
        <TextWidget
          text={label}
          truncate="END"
          maxLines={1}
          style={{ fontSize: 14, fontWeight: '600', color: c.ink }}
        />
        {!compact ? (
          <TextWidget
            text={when}
            truncate="END"
            maxLines={1}
            style={{ fontSize: 12, fontWeight: '400', color: c.faint, marginTop: 1 }}
          />
        ) : null}
      </FlexWidget>
      <FlexWidget
        style={{
          backgroundColor: today ? c.primary : c.primaryLight,
          borderRadius: 9999,
          paddingHorizontal: 9,
          paddingVertical: 3,
        }}
      >
        <TextWidget
          text={dDayLabel(dDay)}
          style={{ fontSize: 11, fontWeight: '700', color: today ? c.ink : c.primaryDark }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/** 우측 정렬 더보기 링크 (카드 하단). */
export function MoreLink({ count, c }: { count: number; c: Wid }) {
  return (
    <FlexWidget
      style={{ flex: 1, width: 'match_parent', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' }}
    >
      <TextWidget
        text={`+${count}개 더보기 ›`}
        style={{ fontSize: 11, fontWeight: '600', color: c.primaryDark }}
      />
    </FlexWidget>
  );
}

/** 큰 진행/숫자 히어로 — 2×2 전체 모드(요약), B 위젯의 D-day 히어로 등. */
export function Hero({
  c,
  big,
  sub,
  caption,
  dots,
}: {
  c: Wid;
  big: string;
  sub?: string;
  caption?: string;
  dots?: { done: number; total: number };
}) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <TextWidget text={big} style={{ fontSize: 33, fontWeight: '800', color: c.primaryDark }} />
      {sub ? (
        <TextWidget
          text={sub}
          truncate="END"
          maxLines={1}
          style={{ fontSize: 13, fontWeight: '600', color: c.ink, marginTop: 2 }}
        />
      ) : null}
      {caption ? (
        <TextWidget
          text={caption}
          truncate="END"
          maxLines={1}
          style={{ fontSize: 11, fontWeight: '400', color: c.faint, marginTop: 1 }}
        />
      ) : null}
      {dots ? (
        <FlexWidget style={{ marginTop: 6 }}>
          <Dots done={dots.done} total={dots.total} c={c} />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

/** 본문 빈 상태 / 안내. */
export function HintBody({ c, title, sub }: { c: Wid; title: string; sub?: string }) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <TextWidget
        text={title}
        truncate="END"
        maxLines={2}
        style={{ fontSize: 14, fontWeight: '700', color: c.ink }}
      />
      {sub ? (
        <TextWidget
          text={sub}
          truncate="END"
          maxLines={2}
          style={{ fontSize: 12, fontWeight: '400', color: c.sub, marginTop: 4 }}
        />
      ) : null}
    </FlexWidget>
  );
}
