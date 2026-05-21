import React from 'react';
import { Modal, Pressable, TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Spacing, Typography } from '../../../constants';
import { useColors, useTheme } from '../../../shared/hooks/useTheme';
import GlassOverlay from '../../../shared/components/GlassOverlay';

interface AppointmentLike {
  id: number;
  petId: number;
  petName?: string;
  appointmentAt: string;
  hospitalName: string | null;
  reason: string | null;
  notes?: string | null;
  linkedRecordId?: number | null;
}

interface Props {
  appointment: AppointmentLike | null;
  onClose: () => void;
  onDelete: () => void;
}

/**
 * 진료 일정 상세 bottom sheet — 진료 탭·홈·일정 list 화면 공통 재사용.
 * - 3단계 진행 타임라인 (예약 → 방문 → 기록 작성)
 * - "이 일정으로 진료기록 작성" CTA (linkedRecordId 있으면 보기로 전환)
 * - 삭제·닫기 액션
 */
export default function AppointmentDetailSheet({ appointment, onClose, onDelete }: Props) {
  const Colors = useColors();
  const { isDark } = useTheme();
  if (!appointment) return null;

  const d = new Date(appointment.appointmentAt);
  const dateStr = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const now = new Date();
  const dDayMs = d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dDay = Math.round(dDayMs / 86400000);
  const dDayLabel = dDay === 0 ? '오늘' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
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
              paddingTop: Spacing.md,
              paddingBottom: Spacing.xxxxl,
              paddingHorizontal: Spacing.xl,
              gap: Spacing.md,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.border,
                marginBottom: Spacing.sm,
              }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="calendar" size={18} color={Colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...Typography.preset.title,
                    color: Colors.text.primary,
                    fontWeight: Typography.weight.bold,
                  }}
                  numberOfLines={1}
                >
                  {appointment.hospitalName || appointment.reason || '병원 예약'}
                </Text>
                {appointment.petName ? (
                  <Text
                    style={{
                      ...Typography.preset.caption,
                      color: Colors.text.secondary,
                      marginTop: 2,
                    }}
                  >
                    {appointment.petName}
                  </Text>
                ) : null}
              </View>
              <Text
                style={{
                  ...Typography.preset.caption,
                  fontWeight: Typography.weight.bold,
                  color: dDay <= 3 ? Colors.status.warning : Colors.primaryDark,
                }}
              >
                {dDayLabel}
              </Text>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <DetailRow icon="calendar" label="일시" value={`${dateStr} ${time}`} />
              {appointment.hospitalName ? (
                <DetailRow icon="map-pin" label="병원" value={appointment.hospitalName} />
              ) : null}
              {appointment.reason ? (
                <DetailRow icon="activity" label="사유" value={appointment.reason} />
              ) : null}
              {appointment.notes ? (
                <DetailRow icon="file-text" label="메모" value={appointment.notes} />
              ) : null}
            </View>

            <AppointmentEventTimeline
              isVisitDone={dDay <= 0}
              linkedRecordId={appointment.linkedRecordId ?? null}
            />

            <TouchableOpacity
              onPress={() => {
                onClose();
                if (appointment.linkedRecordId) {
                  router.push({
                    pathname: '/records/[id]',
                    params: { id: appointment.linkedRecordId, petId: appointment.petId },
                  });
                } else {
                  router.push({
                    pathname: '/records/create',
                    params: {
                      petId: String(appointment.petId),
                      appointmentId: String(appointment.id),
                      prefillVisitedAt: String(appointment.appointmentAt).slice(0, 10),
                      prefillHospital: appointment.hospitalName ?? '',
                      prefillSymptoms: appointment.reason ?? '',
                    },
                  });
                }
              }}
              activeOpacity={0.85}
              style={{
                paddingVertical: Spacing.md,
                borderRadius: Spacing.borderRadius.lg,
                backgroundColor: Colors.primaryDark,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Feather
                name={appointment.linkedRecordId ? 'file-text' : 'edit-3'}
                size={14}
                color={Colors.white}
              />
              <Text
                style={{
                  ...Typography.preset.bodyMedium,
                  color: Colors.white,
                  fontWeight: Typography.weight.semibold,
                }}
              >
                {appointment.linkedRecordId ? '진료기록 보기' : '이 일정으로 진료기록 작성'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={onDelete}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: Spacing.borderRadius.lg,
                  backgroundColor: Colors.status.errorBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <Feather name="trash-2" size={14} color={Colors.status.error} />
                <Text
                  style={{
                    ...Typography.preset.bodyMedium,
                    color: Colors.status.error,
                    fontWeight: Typography.weight.semibold,
                  }}
                >
                  삭제
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: Spacing.borderRadius.lg,
                  backgroundColor: Colors.surface,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    ...Typography.preset.bodyMedium,
                    color: Colors.text.secondary,
                    fontWeight: Typography.weight.semibold,
                  }}
                >
                  닫기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </GlassOverlay>
    </Modal>
  );
}

function AppointmentEventTimeline({
  isVisitDone,
  linkedRecordId,
}: {
  isVisitDone: boolean;
  linkedRecordId: number | null;
}) {
  const Colors = useColors();
  const stages = [
    { label: '예약 등록됨', icon: 'check' as const, done: true },
    {
      label: isVisitDone ? '진료 방문 완료' : '진료 방문 예정',
      icon: 'activity' as const,
      done: isVisitDone,
    },
    {
      label: linkedRecordId ? '진료기록 작성됨' : '진료기록 미작성',
      icon: 'file-text' as const,
      done: !!linkedRecordId,
    },
  ];

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: Spacing.borderRadius.md,
        padding: Spacing.md,
        gap: Spacing.xs,
      }}
    >
      <Text
        style={{
          ...Typography.preset.caption,
          color: Colors.text.tertiary,
          fontWeight: Typography.weight.semibold,
          letterSpacing: 0.4,
          marginBottom: 2,
        }}
      >
        진행 상태
      </Text>
      {stages.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: s.done ? Colors.primary : Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={s.icon} size={11} color={s.done ? Colors.white : Colors.text.tertiary} />
          </View>
          <Text
            style={{
              ...Typography.preset.caption,
              color: s.done ? Colors.text.primary : Colors.text.tertiary,
              fontWeight: s.done ? Typography.weight.semibold : Typography.weight.regular,
              flex: 1,
            }}
          >
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
      <Feather name={icon} size={14} color={Colors.text.tertiary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>{label}</Text>
        <Text style={{ ...Typography.preset.body, color: Colors.text.primary, marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
