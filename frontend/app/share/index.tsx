import React, { useState } from 'react';
import { View, Text, Alert, FlatList, Share, Image, Pressable, TextInput, Modal, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import PetSelector from '../../features/pet/components/PetSelector';
import { useShareMembers, useInvite, useRemoveMember, useAcceptByCode } from '../../features/share/hooks/useShare';
import { usePets } from '../../features/pet/hooks/usePets';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useUiStore } from '../../shared/store/uiStore';
import { Spacing, Typography, Config } from '../../constants';
import { useColors } from '../../shared/hooks/useTheme';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import type { ShareMember, InviteResponse } from '../../features/share/api/shareApi';

export default function ShareScreen() {
  const Colors = useColors();
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: pets } = usePets();
  const petList = (pets as unknown as { id: number; isShared?: boolean; ownerName?: string | null }[] | undefined) ?? [];
  const selectedPet = selectedPetId ? petList.find((p) => p.id === selectedPetId) : null;
  const isSharedPet = !!selectedPet?.isShared;

  const { data: members = [], isLoading } = useShareMembers(selectedPetId ?? 0);
  const { mutate: invite, isPending: inviting } = useInvite(selectedPetId ?? 0);
  const { mutate: remove } = useRemoveMember(selectedPetId ?? 0);
  const { mutate: acceptByCode, isPending: accepting } = useAcceptByCode();

  const isFree = user?.subscriptionType === 'FREE';

  // 초대 결과 표시 모달용
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  // 코드 입력 다이얼로그
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  const handleInvite = () => {
    if (!selectedPetId) return;
    if (isFree && members.length >= Config.freeMaxShareMembers) {
      showPremiumModal(`무료 플랜은 케어 공유를 ${Config.freeMaxShareMembers}명까지만 할 수 있어요.`);
      return;
    }
    invite(undefined, {
      onSuccess: (res: any) => {
        setInviteResult(res as InviteResponse);
      },
      onError: () => Alert.alert('오류', '초대 링크 생성에 실패했어요.'),
    });
  };

  const handleSubmitCode = () => {
    const code = codeInput.trim();
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('확인', '6자리 숫자 코드를 입력해주세요.');
      return;
    }
    acceptByCode(code, {
      onSuccess: (res: any) => {
        setCodeDialogOpen(false);
        setCodeInput('');
        Alert.alert('수락 완료', `${res?.petName ?? '반려동물'} 공유를 수락했어요.`);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message;
        Alert.alert('수락 실패', msg ?? '코드가 만료되었거나 잘못된 코드일 수 있어요.');
      },
    });
  };

  const handleRemove = (member: ShareMember) => {
    Alert.alert('멤버 제거', `${member.memberName}님을 공유에서 제거하시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '제거', style: 'destructive', onPress: () => remove(member.memberId) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScreenHeader
        title="케어 공유 설정"
        back
        actions={[{ icon: 'key', label: '코드로 수락', onPress: () => setCodeDialogOpen(true) }]}
      />

      <View style={{ paddingVertical: Spacing.sm }}>
        <PetSelector onPetChange={setSelectedPetId} />
      </View>

      {!selectedPetId ? (
        <EmptyState icon="heart" title="반려동물을 선택해주세요" tone="muted" />
      ) : isLoading ? (
        <LoadingSpinner label="불러오는 중" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            isSharedPet ? (
              <Card
                variant="elevated"
                padding="lg"
                style={{ marginBottom: Spacing.lg, backgroundColor: Colors.primaryLight }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: Colors.white,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Feather name="users" size={20} color={Colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.bodyMedium, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
                      {selectedPet?.ownerName ? `${selectedPet.ownerName}님이 공유해준 펫이에요` : '공유받은 펫이에요'}
                    </Text>
                    <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                      함께 보는 멤버 목록만 볼 수 있어요. 초대 추가·제거는 원래 소유자만 가능해요.
                    </Text>
                  </View>
                </View>
              </Card>
            ) : (
              <Card
                variant="elevated"
                padding="lg"
                style={{ marginBottom: Spacing.lg, backgroundColor: Colors.primary }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Feather name="users" size={20} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.preset.title, color: Colors.white }}>
                      가족·친구와 함께 돌보세요
                    </Text>
                    <Text
                      style={{ ...Typography.preset.bodySmall, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}
                    >
                      {isFree
                        ? `무료 플랜: ${members.length}/${Config.freeMaxShareMembers}명`
                        : '프리미엄: 무제한 공유'}
                    </Text>
                  </View>
                </View>
                <Button variant="secondary" fullWidth onPress={handleInvite} loading={inviting} icon="link">
                  초대 링크 생성
                </Button>
              </Card>
            )
          }
          ListEmptyComponent={
            isSharedPet ? (
              <EmptyState
                icon="user-plus"
                title="아직 다른 공유 멤버가 없어요"
                description="이 펫은 소유자와 나만 함께 보고 있어요"
                tone="muted"
              />
            ) : (
              <EmptyState
                icon="user-plus"
                title="공유 중인 멤버가 없어요"
                description="초대 링크를 만들어 가족·친구와 공유해보세요"
                tone="muted"
              />
            )
          }
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.memberProfileImage ? (
                  <Image
                    source={{ uri: item.memberProfileImage }}
                    style={{ width: 44, height: 44, borderRadius: 22, marginRight: Spacing.md }}
                  />
                ) : (
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 22, marginRight: Spacing.md,
                      backgroundColor: Colors.primaryLight,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ ...Typography.preset.title, color: Colors.primary }}>
                      {item.memberName.charAt(0)}
                    </Text>
                  </View>
                )}
                <Text style={{ flex: 1, ...Typography.preset.bodyMedium, color: Colors.text.primary }}>
                  {item.memberName}
                </Text>
                {!isSharedPet ? (
                  <Pressable onPress={() => handleRemove(item)} hitSlop={Spacing.hitSlop}>
                    <Feather name="user-x" size={20} color={Colors.status.error} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          )}
        />
      )}

      {/* 초대 결과 모달 — 6자리 코드 + 링크 공유 */}
      <InviteResultModal
        visible={!!inviteResult}
        result={inviteResult}
        onClose={() => setInviteResult(null)}
      />

      {/* 코드 입력 다이얼로그 — 받은 사람용 */}
      <CodeInputDialog
        visible={codeDialogOpen}
        code={codeInput}
        onChangeCode={setCodeInput}
        loading={accepting}
        onClose={() => { setCodeDialogOpen(false); setCodeInput(''); }}
        onSubmit={handleSubmitCode}
      />
    </SafeAreaView>
  );
}

function InviteResultModal({
  visible,
  result,
  onClose,
}: {
  visible: boolean;
  result: InviteResponse | null;
  onClose: () => void;
}) {
  const Colors = useColors();
  if (!result) return null;
  const link = result.inviteUrl || result.inviteLink;

  const handleShareLink = () => {
    Share.share({
      message: `발자국 앱에서 반려동물 케어를 함께 해요!\n${link}\n\n앱이 설치되어 있으면 링크를 누르면 자동으로 수락돼요.\n또는 앱에서 코드 ${result.inviteCode} 입력으로도 가능해요.`,
      title: '케어 공유 초대',
    });
  };

  const handleCopyCode = () => {
    Clipboard.setString(result.inviteCode);
    Alert.alert('복사됨', `코드 ${result.inviteCode} 가 복사됐어요.`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: Colors.surfaceElevated,
            borderRadius: Spacing.borderRadius.xl,
            padding: Spacing.xl,
            gap: Spacing.lg,
          }}
        >
          <Text style={{ ...Typography.preset.heading, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' }}>
            초대 코드
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center', marginTop: -Spacing.sm }}>
            받는 사람이 앱에서 직접 입력하거나{'\n'}링크 공유로 즉시 수락할 수 있어요
          </Text>

          {/* 큰 6자리 코드 */}
          <Pressable onPress={handleCopyCode}>
            <View
              style={{
                paddingVertical: Spacing.lg,
                borderRadius: Spacing.borderRadius.lg,
                backgroundColor: Colors.primaryLight,
                alignItems: 'center',
                gap: Spacing.xs,
              }}
            >
              <Text style={{
                fontSize: 36,
                letterSpacing: 8,
                fontWeight: Typography.weight.bold,
                color: Colors.primaryDark,
              }}>
                {result.inviteCode}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="copy" size={11} color={Colors.text.tertiary} />
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                  눌러서 복사
                </Text>
              </View>
            </View>
          </Pressable>

          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, textAlign: 'center' }}>
            24시간 안에 사용해주세요
          </Text>

          <Button onPress={handleShareLink} variant="primary" fullWidth icon="share-2">
            링크로 공유하기
          </Button>
          <Button onPress={onClose} variant="ghost" fullWidth>
            닫기
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CodeInputDialog({
  visible,
  code,
  onChangeCode,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  code: string;
  onChangeCode: (s: string) => void;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const Colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: Colors.surfaceElevated,
            borderRadius: Spacing.borderRadius.xl,
            padding: Spacing.xl,
            gap: Spacing.md,
          }}
        >
          <Text style={{ ...Typography.preset.heading, fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' }}>
            초대 코드 입력
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center' }}>
            받은 6자리 숫자 코드를 입력해주세요
          </Text>
          <TextInput
            value={code}
            onChangeText={(t) => onChangeCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={{
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.md,
              fontSize: 28,
              letterSpacing: 8,
              textAlign: 'center',
              color: Colors.text.primary,
              backgroundColor: Colors.white,
              marginTop: Spacing.sm,
            }}
          />
          <Button onPress={onSubmit} loading={loading} variant="primary" fullWidth>
            수락
          </Button>
          <Button onPress={onClose} variant="ghost" fullWidth>
            취소
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
