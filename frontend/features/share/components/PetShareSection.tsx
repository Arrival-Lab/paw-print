import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Share, Alert, Clipboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, getLimits, isUnlimited } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { useUiStore } from '../../../shared/store/uiStore';
import { useShareMembers, useInvite, useRemoveMember } from '../hooks/useShare';
import type { Pet } from '../../pet/api/petApi';
import type { ShareMember, InviteResponse } from '../api/shareApi';

export default function PetShareSection({ pet }: { pet: Pet }) {
  const Colors = useColors();
  const { t } = useTranslation();
  const isShared = !!pet.isShared;
  const subscriptionType = useAuthStore((s) => s.user?.subscriptionType);
  const limits = getLimits(subscriptionType);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: members = [] } = useShareMembers(pet.id);
  const { mutate: invite, isPending: inviting } = useInvite(pet.id);
  const { mutate: remove } = useRemoveMember(pet.id);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);

  const handleInvite = () => {
    if (members.length >= limits.maxShareMembers) {
      showPremiumModal(t('share.limit', { max: limits.maxShareMembers }));
      return;
    }
    invite(undefined, {
      onSuccess: (res: any) => setInviteResult(res as InviteResponse),
      onError: () => Alert.alert(t('share.errorTitle'), t('share.inviteLinkFail')),
    });
  };

  const handleRemove = (m: ShareMember) => {
    Alert.alert(t('share.removeMemberTitle'), t('share.removeMemberBody', { name: m.memberNickname }), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('share.remove'), style: 'destructive', onPress: () => remove(m.memberId) },
    ]);
  };

  const headerLabel = isShared
    ? t('share.sharedByPet', { name: pet.ownerName ?? t('pet.owner') })
    : t('share.coCaring', { count: members.length });
  const subLabel = isShared
    ? t('share.sharedViewOnly')
    : isUnlimited(limits.maxShareMembers)
      ? t('share.unlimitedShare')
      : t('share.memberCount', { count: members.length, max: limits.maxShareMembers });

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
          {t('share.inviteFamily')}
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
  const { t } = useTranslation();
  if (!result) return null;
  const link = result.inviteUrl || result.inviteLink;

  const handleShareLink = () => {
    Share.share({
      message: t('share.shareMessage', { link, code: result.inviteCode }),
      title: t('share.inviteTitle'),
    });
  };

  const handleCopyCode = () => {
    Clipboard.setString(result.inviteCode);
    Alert.alert(t('share.copiedTitle'), t('share.copiedMsg', { code: result.inviteCode }));
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
            {t('share.inviteCodeTitle')}
          </Text>
          <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, textAlign: 'center', marginTop: -Spacing.sm }}>
            {t('share.recvDescPre')}
            <Text style={{ fontWeight: Typography.weight.semibold, color: Colors.text.primary }}>
              {t('share.recvDescPath')}
            </Text>
            {t('share.recvDescPost')}
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
              {/* 6자리 → 3-3 그룹핑. 그룹 내 자간은 2, 그룹 간 gap 으로 시각 분리. */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <Text
                  style={{
                    fontSize: 36,
                    letterSpacing: 2,
                    fontWeight: Typography.weight.bold,
                    color: Colors.primaryDark,
                  }}
                >
                  {result.inviteCode.slice(0, 3)}
                </Text>
                <Text
                  style={{
                    fontSize: 36,
                    letterSpacing: 2,
                    fontWeight: Typography.weight.bold,
                    color: Colors.primaryDark,
                  }}
                >
                  {result.inviteCode.slice(3)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="copy" size={11} color={Colors.text.tertiary} />
                <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                  {t('share.tapToCopy')}
                </Text>
              </View>
            </View>
          </Pressable>

          <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, textAlign: 'center' }}>
            {t('share.expire24h')}
          </Text>

          <Button onPress={handleShareLink} variant="primary" fullWidth icon="share-2">
            {t('share.shareLink')}
          </Button>
          <Button onPress={onClose} variant="ghost" fullWidth>
            {t('action.close')}
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
