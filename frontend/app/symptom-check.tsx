import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../constants';
import { useColors } from '../shared/hooks/useTheme';
import ScreenHeader from '../shared/components/ScreenHeader';
import { useLeaveConfirm } from '../shared/hooks/useLeaveConfirm';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import Chip from '../shared/components/Chip';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import EmptyState from '../shared/components/EmptyState';
import { useUiStore } from '../shared/store/uiStore';
import { useAuthStore } from '../features/auth/store/authStore';
import { usePets } from '../features/pet/hooks/usePets';
import { usePetFilterStore } from '../shared/store/petFilterStore';
import { symptomApi, SymptomCheckResponse, Urgency, ChatTurn, SymptomFollowupResponse } from '../features/symptom/api/symptomApi';
import { useDisclaimerStore } from '../features/symptom/store/disclaimerStore';
import type { Pet } from '../features/pet/api/petApi';

const DURATION_OPTIONS: { label: string; hours: number }[] = [
  { label: '방금', hours: 0 },
  { label: '1시간', hours: 1 },
  { label: '오늘', hours: 12 },
  { label: '하루', hours: 24 },
  { label: '2-3일', hours: 60 },
  { label: '일주일+', hours: 168 },
];

export default function SymptomCheckScreen() {
  const Colors = useColors();
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);
  const user = useAuthStore((s) => s.user);
  const accepted = useDisclaimerStore((s) => s.accepted);
  const accept = useDisclaimerStore((s) => s.accept);

  const { data: pets = [] as Pet[] } = usePets();
  const petList = (pets as unknown as Pet[]) ?? [];
  const selectedPetId = usePetFilterStore((s) => s.selectedPetId);
  const [petId, setPetId] = useState<number | null>(selectedPetId ?? petList[0]?.id ?? null);

  const [symptoms, setSymptoms] = useState('');
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [result, setResult] = useState<SymptomCheckResponse | null>(null);

  // 결과 전, 증상/추가정보를 입력한 상태면 이탈 확인. (결과가 나오면 더 잃을 입력이 없음)
  useLeaveConfirm(!result && !!(symptoms.trim() || additionalInfo.trim()));

  const { mutate, isPending } = useMutation({
    mutationFn: symptomApi.check,
    onSuccess: (res) => {
      // axios client unwraps; cast for safety with the project's existing typing pattern
      setResult(res as unknown as SymptomCheckResponse);
    },
    onError: (e: any) => {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 402) {
        showPremiumModal(msg ?? '무료 플랜은 월 5회까지 AI 증상 체크를 사용할 수 있어요.');
        return;
      }
      Alert.alert('요청 실패', msg ?? '잠시 후 다시 시도해주세요.');
    },
  });

  const canSubmit = symptoms.trim().length >= 5 && !isPending;

  const handleSubmit = () => {
    if (!accepted) return;
    mutate({
      petId: petId ?? undefined,
      symptoms: symptoms.trim(),
      durationHours: durationHours ?? undefined,
      additionalInfo: additionalInfo.trim() || undefined,
      acknowledgedDisclaimer: true,
    });
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms('');
    setDurationHours(null);
    setAdditionalInfo('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader title="AI 증상 빠른 체크" back />
      {!accepted ? (
        <DisclaimerScreen onAccept={accept} />
      ) : result ? (
        <ResultView
          result={result}
          onReset={handleReset}
          petId={petId}
          originalSymptoms={symptoms.trim()}
          originalDurationHours={durationHours ?? undefined}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }}
          keyboardShouldPersistTaps="handled"
        >
          {petList.length > 0 ? (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
                반려동물
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {petList.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.name}
                    selected={petId === p.id}
                    onPress={() => setPetId(p.id)}
                  />
                ))}
                <Chip label="선택 안 함" selected={petId === null} onPress={() => setPetId(null)} />
              </View>
            </View>
          ) : null}

          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
              어떤 증상이 보이나요?
            </Text>
            <TextInput
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              placeholder="예: 어제 저녁부터 밥을 잘 안 먹고 평소보다 조용해요. 가끔 구토도 했어요."
              placeholderTextColor={Colors.text.tertiary}
              style={{
                ...Typography.preset.body,
                color: Colors.text.primary,
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.lg,
                padding: Spacing.md,
                minHeight: 140,
                textAlignVertical: 'top',
              }}
              maxLength={1000}
            />
            <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 4, textAlign: 'right' }}>
              {symptoms.length}/1000
            </Text>
          </View>

          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
              언제부터인가요?
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {DURATION_OPTIONS.map((d) => (
                <Chip
                  key={d.label}
                  label={d.label}
                  selected={durationHours === d.hours}
                  onPress={() => setDurationHours(d.hours)}
                />
              ))}
            </View>
          </View>

          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
              추가 정보 (선택)
            </Text>
            <TextInput
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline
              placeholder="평소와 다른 환경 변화, 사료 변경, 산책 중 일이 있었다면 함께 적어주세요"
              placeholderTextColor={Colors.text.tertiary}
              style={{
                ...Typography.preset.body,
                color: Colors.text.primary,
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.lg,
                padding: Spacing.md,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              maxLength={500}
            />
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            {isPending ? 'AI 분석 중...' : '증상 체크 시작'}
          </Button>

          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.md, textAlign: 'center' }}>
            AI 분석은 일반 참고용이에요. 수의사 진단을 대체할 수 없어요.
          </Text>
        </ScrollView>
      )}
      {isPending ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner label="AI가 분석 중이에요" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function DisclaimerScreen({ onAccept }: { onAccept: () => void }) {
  const Colors = useColors();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg }}>
      <View style={{ alignItems: 'center', marginVertical: Spacing.lg }}>
        <View
          style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
          }}
        >
          <Feather name="alert-circle" size={28} color={Colors.text.accent} />
        </View>
        <Text style={{ ...Typography.preset.h2, color: Colors.text.primary }}>AI 증상 체크 사용 전 확인</Text>
      </View>

      <Card variant="tinted" padding="lg" style={{ marginBottom: Spacing.md }}>
        <DisclaimerRow
          icon="info"
          title="진단이 아닌 참고용"
          body="이 기능은 보호자가 다음 행동을 결정할 때 도움이 되도록 만든 일반 가이드예요. 의학적 진단·처방을 하지 않아요."
        />
        <DisclaimerRow
          icon="user-check"
          title="결정은 보호자와 수의사"
          body="AI의 의견과 다르게 보호자가 봤을 때 이상하다면 즉시 병원에 가주세요. 결과가 가볍게 나와도 호전이 없으면 진료를 권합니다."
        />
        <DisclaimerRow
          icon="zap"
          title="응급 상황은 즉시 병원"
          body="피·경련·호흡곤란·의식 저하·중독 의심·교통사고 — 이런 경우엔 입력하지 말고 바로 24시 동물병원으로 가주세요."
        />
        <DisclaimerRow
          icon="book-open"
          title="참고 출처 안내"
          body="이 가이드는 MSD 수의 매뉴얼, AVMA, 대한수의사회 같은 공인 수의 정보원을 바탕으로 안내해요. 결과 화면 하단에서 출처 링크를 직접 확인하실 수 있어요."
          last
        />
      </Card>

      <Button variant="primary" size="lg" fullWidth onPress={onAccept}>
        확인했어요, 시작하기
      </Button>
    </ScrollView>
  );
}

function DisclaimerRow({ icon, title, body, last }: { icon: any; title: string; body: string; last?: boolean }) {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.md, paddingBottom: last ? 0 : Spacing.md, marginBottom: last ? 0 : Spacing.md, borderBottomWidth: last ? 0 : 1, borderBottomColor: Colors.border }}>
      <Feather name={icon} size={18} color={Colors.text.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{title}</Text>
        <Text style={{ marginTop: 4, ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{body}</Text>
      </View>
    </View>
  );
}

/** 세션당 follow-up 질문 최대 개수 (사용자 메시지 기준). 백엔드 history cap 10턴(=USER+ASSISTANT 합산)과 짝. */
const FOLLOWUP_CAP = 5;

type ChatMessage = {
  role: 'USER' | 'ASSISTANT';
  content: string;
  emergencyKeyword?: string | null;
};

function ResultView({
  result,
  onReset,
  petId,
  originalSymptoms,
  originalDurationHours,
}: {
  result: SymptomCheckResponse;
  onReset: () => void;
  petId: number | null;
  originalSymptoms: string;
  originalDurationHours?: number;
}) {
  const Colors = useColors();

  const tone = useMemo(() => urgencyTone(result.urgency, Colors), [result.urgency, Colors]);

  // 챗 상태 — 세션 내에서만 유지. 다른 증상 다시 체크 시 초기화됨.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const userMessageCount = messages.filter((m) => m.role === 'USER').length;
  const remainingFollowups = Math.max(0, FOLLOWUP_CAP - userMessageCount);
  const capReached = remainingFollowups === 0;

  const { mutate: askFollowup, isPending: isFollowupPending } = useMutation({
    mutationFn: symptomApi.followup,
    onSuccess: (res) => {
      const r = res as unknown as SymptomFollowupResponse;
      setMessages((prev) => [
        ...prev,
        { role: 'ASSISTANT', content: r.answer, emergencyKeyword: r.emergencyKeywordDetected },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      Alert.alert('답변을 받지 못했어요', msg ?? '잠시 후 다시 시도해주세요.');
      // user 버블은 이미 추가됐으니 롤백 — 마지막 USER turn 제거
      setMessages((prev) => {
        const lastUserIdx = [...prev].reverse().findIndex((m) => m.role === 'USER');
        if (lastUserIdx === -1) return prev;
        const realIdx = prev.length - 1 - lastUserIdx;
        return prev.slice(0, realIdx);
      });
    },
  });

  const handleSendFollowup = () => {
    const trimmed = question.trim();
    if (!trimmed || capReached || isFollowupPending) return;
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'USER', content: trimmed }]);
    setQuestion('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    askFollowup({
      petId: petId ?? undefined,
      originalSymptoms,
      originalDurationHours,
      history,
      question: trimmed,
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl }}
      keyboardShouldPersistTaps="handled"
    >
      {/* 응급 키워드 감지된 경우 화면 최상단에 큰 경고 */}
      {result.emergencyKeywordDetected ? (
        <View
          style={{
            backgroundColor: Colors.status.errorBg,
            borderRadius: Spacing.borderRadius.lg,
            padding: Spacing.lg,
            marginBottom: Spacing.lg,
            borderWidth: 1,
            borderColor: Colors.status.error,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <Feather name="alert-triangle" size={20} color={Colors.status.error} />
            <Text style={{ ...Typography.preset.title, color: Colors.status.error }}>지금 바로 병원으로</Text>
          </View>
          <Text style={{ ...Typography.preset.body, color: Colors.text.primary, marginBottom: Spacing.md }}>
            "{result.emergencyKeywordDetected}" 가 입력에 포함되어 있어요. AI 분석을 기다리지 말고 바로 24시 동물병원으로 가주세요.
          </Text>
          <Button variant="primary" fullWidth onPress={() => router.push('/hospital?mode=emergency' as any)}>
            응급 24시 병원 찾기
          </Button>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: tone.bg,
          borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.lg,
          marginBottom: Spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          <Feather name={tone.icon} size={18} color={tone.fg} />
          <Text style={{ ...Typography.preset.bodyMedium, color: tone.fg }}>{tone.label}</Text>
        </View>
        <Text style={{ ...Typography.preset.body, color: Colors.text.primary }}>{result.urgencyReason}</Text>
      </View>

      {result.possibleCauses.length > 0 ? (
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            가능 원인 (추정)
          </Text>
          {result.possibleCauses.map((c, i) => (
            <View
              key={i}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.md,
                padding: Spacing.md,
                marginBottom: Spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{c.name}</Text>
                <Text style={{ ...Typography.preset.caption, color: Colors.text.accent }}>{c.probability}%</Text>
              </View>
              <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>{c.description}</Text>
              {c.referenceUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(c.referenceUrl)}
                  hitSlop={Spacing.hitSlop}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: Spacing.sm,
                    paddingTop: Spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                  }}
                >
                  <Feather name="book-open" size={12} color={Colors.text.accent} />
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.accent }}>
                    MSD 수의 매뉴얼에서 "{c.name}" 찾아보기
                  </Text>
                  <Feather name="external-link" size={12} color={Colors.text.accent} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {result.recommendedActions.length > 0 ? (
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.sm }}>
            지금 할 수 있는 것
          </Text>
          {result.recommendedActions.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 8 }} />
              <Text style={{ flex: 1, ...Typography.preset.body, color: Colors.text.primary }}>{a}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Apple Guideline 1.4.1 — 의학 정보 citation. 항상 노출. */}
      {result.references && result.references.length > 0 ? (
        <View style={{ marginBottom: Spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <Feather name="book-open" size={16} color={Colors.text.accent} />
            <Text style={{ ...Typography.preset.title, color: Colors.text.primary }}>참고한 출처</Text>
          </View>
          <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
            이 가이드는 다음 공인 수의 정보원을 바탕으로 만들어졌어요. 자세한 의학 정보는 직접 확인해 주세요.
          </Text>
          {result.references.map((ref, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(ref.url)}
              hitSlop={Spacing.hitSlop}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.md,
                paddingVertical: Spacing.sm + 2,
                paddingHorizontal: Spacing.md,
                marginBottom: Spacing.sm,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Feather name="external-link" size={14} color={Colors.text.accent} />
                <Text style={{ flex: 1, ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{ref.name}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* 챗봇 후속 질문 섹션 */}
      <View style={{ marginBottom: Spacing.xl }}>
        <Text style={{ ...Typography.preset.title, color: Colors.text.primary, marginBottom: Spacing.xs }}>
          더 궁금한 점이 있다면
        </Text>
        <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, marginBottom: Spacing.md }}>
          이번 증상 흐름을 이어서 추가로 물어볼 수 있어요. (이번 세션 {remainingFollowups}/{FOLLOWUP_CAP}회 남음)
        </Text>

        {messages.map((m, i) => (
          <ChatBubble key={i} message={m} colors={Colors} />
        ))}

        {isFollowupPending ? (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              backgroundColor: Colors.surface,
              borderRadius: Spacing.borderRadius.lg,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
              marginBottom: Spacing.sm,
            }}
          >
            <ActivityIndicator size="small" color={Colors.text.accent} />
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary }}>답변 작성 중</Text>
          </View>
        ) : null}

        {capReached ? (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: Spacing.borderRadius.md,
              padding: Spacing.md,
              marginTop: Spacing.sm,
            }}
          >
            <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.secondary, textAlign: 'center' }}>
              이번 대화에서 더 물어볼 수 있는 횟수를 다 사용했어요. 새 증상으로 다시 체크해보세요.
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: Spacing.sm,
              marginTop: Spacing.sm,
            }}
          >
            <TextInput
              value={question}
              onChangeText={setQuestion}
              multiline
              placeholder="예: 약을 먹여도 될까요?"
              placeholderTextColor={Colors.text.tertiary}
              editable={!isFollowupPending}
              style={{
                flex: 1,
                ...Typography.preset.body,
                color: Colors.text.primary,
                backgroundColor: Colors.surface,
                borderRadius: Spacing.borderRadius.lg,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                maxHeight: 120,
                minHeight: 44,
                textAlignVertical: 'center',
              }}
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendFollowup}
              disabled={!question.trim() || isFollowupPending}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: question.trim() && !isFollowupPending ? Colors.primaryDark : Colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="send" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Button variant="primary" fullWidth onPress={() => router.push('/hospital?mode=emergency' as any)}>
        가까운 동물병원 찾기
      </Button>
      <View style={{ height: Spacing.sm }} />
      <Button variant="ghost" fullWidth onPress={onReset}>
        다른 증상 다시 체크
      </Button>

      <View style={{ marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.md }}>
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, lineHeight: Typography.size.xs * Typography.lineHeight.relaxed }}>
          {result.disclaimer}
        </Text>
      </View>
      {result.remainingFreeChecks !== null ? (
        <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.sm, textAlign: 'center' }}>
          이번 달 남은 무료 체크: {result.remainingFreeChecks}회
        </Text>
      ) : null}
    </ScrollView>
  );
}

function ChatBubble({ message, colors }: { message: ChatMessage; colors: ReturnType<typeof useColors> }) {
  const isUser = message.role === 'USER';
  return (
    <View style={{ marginBottom: Spacing.sm, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '88%',
          backgroundColor: isUser ? colors.primaryDark : colors.surface,
          borderRadius: Spacing.borderRadius.lg,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
        }}
      >
        <Text
          style={{
            ...Typography.preset.body,
            color: isUser ? colors.white : colors.text.primary,
          }}
        >
          {message.content}
        </Text>
      </View>
      {!isUser && message.emergencyKeyword ? (
        <View
          style={{
            marginTop: Spacing.xs,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.status.errorBg,
            borderRadius: Spacing.borderRadius.sm,
            paddingHorizontal: Spacing.sm,
            paddingVertical: 4,
          }}
        >
          <Feather name="alert-triangle" size={12} color={colors.status.error} />
          <Text style={{ ...Typography.preset.caption, color: colors.status.error }}>
            응급 가능성 감지 — 24시 병원 권유
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function urgencyTone(urgency: Urgency, Colors: ReturnType<typeof useColors>) {
  switch (urgency) {
    case 'IMMEDIATE':
      return { label: '즉시 병원 권유', bg: Colors.status.errorBg, fg: Colors.status.error, icon: 'alert-triangle' as const };
    case 'WITHIN_24H':
      return { label: '24시간 내 진료 권유', bg: Colors.status.warningBg, fg: Colors.status.warning, icon: 'clock' as const };
    case 'OBSERVE':
      return { label: '집에서 관찰 가능', bg: Colors.status.successBg, fg: Colors.status.success, icon: 'eye' as const };
    case 'UNCLEAR':
    default:
      return { label: '판단이 어려워요', bg: Colors.surface, fg: Colors.text.secondary, icon: 'help-circle' as const };
  }
}
