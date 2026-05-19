import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Share, Alert, Clipboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, Config } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { useUiStore } from '../../../shared/store/uiStore';
import { useShareMembers, useInvite, useRemoveMember } from '../hooks/useShare';
import type { Pet } from '../../pet/api/petApi';
import type { ShareMember, InviteResponse } from '../api/shareApi';

export default function PetShareSection({ pet }: { pet: Pet }) {
  const Colors = useColors();
  const isShared = !!pet.isShared;
  const isFree = useAuthStore((s) => s.user?.subscriptionType !== 'PREMIUM');
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: members = [] } = useShareMembers(pet.id);
  const { mutate: invite, isPending: inviting } = useInvite(pet.id);
  const { mutate: remove } = useRemoveMember(pet.id);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  const handleInvite = () => {
    if (isFree && members.length >= Config.freeMaxShareMembers) {
      showPremiumModal(`무료 플랜은 케어 공유를 ${Config.freeMaxShareMembers}명까지만 할 수 있어요.`);
      return;
    }
    invite(undefined, {
      onSuccess: (res: any) => setInviteResult(res as InviteResponse),
      onError: () => Alert.alert('오류', '초대 링크 생성에 실패했어요.'),
    });
  };

  const handleRemove = (m: ShareMember) => {
    Alert.alert('멤버 제거', `${m.memberNickname}님을 공유에서 제거하시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '제거', style: 'destructive', onPress: () => remove(m.memberId) },
    ]);
  };

  const headerLabel = isShared
    ? `${pet.ownerName ?? '소유자'}님이 공유한 펫`
    : `${members.length}명과 함께 돌봐요`;
  const subLabel = isShared
    ? '함께 보는 멤버 목록만 볼 수 있어요'
    : isFree
      ? `무료 플랜: ${members.length}/${Config.freeMaxShareMembers}명`
      : '프리미엄: 무제한 공유';

  return (
    <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: Colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="users" size={14} color={Colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.preset.body, fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
            {headerLabel}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: 2 }}>
            {subLabel}
          </Text>
        </View>
      </View>

      {/* 멤버 목록 — 가로 스크롤 아바타 */}
      {members.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={isShared ? undefined : () => handleRemove(m)}
              activeOpacity={isShared ? 1 : 0.7}
              style={{ alignItems: 'center', width: 56, gap: 4 }}
            >
              {m.memberProfileImage ? (
                <Image
                  source={{ uri: m.memberProfileImage }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
              ) : (
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: Colors.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ ...Typography.preset.body, fontWeight: Typography.weight.bold, color: Colors.primaryDark }}>
                    {m.memberNickname.charAt(0)}
                  </Text>
                </View>
              )}
              <Text
                style={{ ...Typography.preset.caption, color: Colors.text.secondary }}
                numberOfLines={1}
              >
                {m.memberNickname}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {!isShared ? (
        <Button variant="ghost" icon="user-plus" onPress={handleInvite} loading={inviting} size="sm">
          가족·친구 초대
        </Button>
      ) : null}

      <InviteResultModal
        visible={!!inviteResult}
        result={inviteResult}
        onClose={() => setInviteResult(null)}
      />
    </View>
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
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl }}
      >
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
              <Text
                style={{
                  fontSize: 36,
                  letterSpacing: 8,
                  fontWeight: Typography.weight.bold,
                  color: Colors.primaryDark,
                }}
              >
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
