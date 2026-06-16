import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography, getLimits, isUnlimited } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import { confirmLeaveIfDirty } from '../../../shared/utils/confirmLeave';
import Fab from '../../../shared/components/Fab';
import EmptyState from '../../../shared/components/EmptyState';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Button from '../../../shared/components/Button';
import DateInput from '../../../shared/components/DateInput';
import { useRefresh } from '../../../shared/hooks/useRefresh';
import { useAuthStore } from '../../auth/store/authStore';
import { useUiStore } from '../../../shared/store/uiStore';
import { VaccineCard } from './VaccineCard';
import { useVaccines, useCreateVaccine, useDeleteVaccine, useUpdateVaccine } from '../hooks/useVaccines';
import { scheduleVaccineNotificationPreview } from '../utils/notificationPreview';
import type { RecurrenceType, VaccineRequest, VaccineCategory } from '../api/vaccineApi';

// 백신 / 정기체크 두 맥락의 문구 i18n 키. 같은 컴포넌트를 category prop 으로 가른다. 렌더에서 t().
const COPY: Record<VaccineCategory, {
  emptyIcon: React.ComponentProps<typeof Feather>['name'];
  ns: string;
}> = {
  VACCINE: { emptyIcon: 'shield', ns: 'vaccine.cat.vaccine' },
  RECURRING: { emptyIcon: 'repeat', ns: 'vaccine.cat.recurring' },
};

const vaccineSchema = z.object({
  vaccineName: z.string().min(1, 'vaccine.itemNameRequired'),
  vaccinatedAt: z.string().min(1, 'vaccine.doseDateRequired'),
  nextVaccineAt: z.string().optional(),
  notes: z.string().optional(),
  alertEnabled: z.boolean(),
  recurrenceType: z.enum(['NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
});
type VaccineForm = z.infer<typeof vaccineSchema>;

const RECURRENCE_OPTIONS: { value: RecurrenceType; key: string }[] = [
  { value: 'NONE', key: 'none' },
  { value: 'MONTHLY', key: 'monthly' },
  { value: 'QUARTERLY', key: 'quarterly' },
  { value: 'YEARLY', key: 'yearly' },
];

function DateField({ label, control, name, title, hasError }: any) {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text
        style={{
          ...Typography.preset.label,
          color: Colors.text.secondary,
          marginBottom: Spacing.xs,
        }}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <DateInput value={value} onChange={onChange} title={title ?? label} hasError={hasError} />
        )}
      />
    </View>
  );
}

function Field({ label, control, name, placeholder, error }: any) {
  const Colors = useColors();
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text
        style={{
          ...Typography.preset.label,
          color: Colors.text.secondary,
          marginBottom: Spacing.xs,
        }}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.text.tertiary}
            style={{
              borderWidth: 1,
              borderColor: error ? Colors.status.error : Colors.border,
              borderRadius: Spacing.borderRadius.md,
              paddingHorizontal: Spacing.md,
              paddingVertical: 12,
              fontSize: Typography.size.md,
              color: Colors.text.primary,
              backgroundColor: Colors.white,
            }}
          />
        )}
      />
      {error && (
        <Text style={{ ...Typography.preset.caption, color: Colors.status.error, marginTop: 4 }}>
          {t(error.message)}
        </Text>
      )}
    </View>
  );
}

export function VaccinesTab({
  selectedPetId,
  topInset = 0,
  category = 'VACCINE',
}: {
  selectedPetId: number | null;
  topInset?: number;
  category?: VaccineCategory;
}) {
  const Colors = useColors();
  const { t } = useTranslation();
  const copy = COPY[category];
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);
  const showPremiumModal = useUiStore((s) => s.showPremiumModal);

  const { data: vaccines = [], isLoading } = useVaccines(selectedPetId ?? 0, category);
  const { mutate: create, isPending: creating } = useCreateVaccine(selectedPetId ?? 0);
  const { mutate: remove } = useDeleteVaccine(selectedPetId ?? 0);
  const { mutate: update } = useUpdateVaccine(selectedPetId ?? 0);
  const { refreshing, onRefresh } = useRefresh([['vaccines', selectedPetId ?? 0], ['vaccines', 'upcoming']]);

  const sortedVaccines = useMemo(
    () => [...vaccines].sort((a, b) => (b.vaccinatedAt ?? '').localeCompare(a.vaccinatedAt ?? '')),
    [vaccines],
  );

  const alertEnabledCount = vaccines.filter((v) => v.alertEnabled).length;
  const limits = getLimits(user?.subscriptionType);
  const alertLimited = !isUnlimited(limits.maxVaccineAlerts);
  const canEnableAlert = alertEnabledCount < limits.maxVaccineAlerts;

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<VaccineForm>({
    resolver: zodResolver(vaccineSchema),
    defaultValues: {
      vaccineName: '',
      vaccinatedAt: new Date().toISOString().slice(0, 10),
      nextVaccineAt: '',
      notes: '',
      alertEnabled: false,
      recurrenceType: 'NONE',
    },
  });

  const requestCloseForm = () => confirmLeaveIfDirty(isDirty, () => { setShowForm(false); reset(); });

  const handleCreate = (data: VaccineForm) => {
    const payload: VaccineRequest = {
      vaccineName: data.vaccineName,
      vaccinatedAt: data.vaccinatedAt,
      nextVaccineAt: data.nextVaccineAt || undefined,
      notes: data.notes || undefined,
      alertEnabled: data.alertEnabled,
      recurrenceType: data.recurrenceType,
      category,
    };
    create(payload, { onSuccess: () => { setShowForm(false); reset(); } });
  };

  const handleToggleAlert = (vaccineId: number, enabled: boolean) => {
    if (enabled && !canEnableAlert) {
      showPremiumModal(t('vaccine.alertLimit', { max: limits.maxVaccineAlerts }));
      return;
    }
    const vaccine = vaccines.find((v) => v.id === vaccineId);
    if (!vaccine) return;
    update({
      vaccineId,
      data: {
        vaccineName: vaccine.vaccineName,
        vaccinatedAt: vaccine.vaccinatedAt,
        nextVaccineAt: vaccine.nextVaccineAt ?? undefined,
        notes: vaccine.notes ?? undefined,
        alertEnabled: enabled,
        recurrenceType: vaccine.recurrenceType,
        category: vaccine.category,
      },
    });
  };

  const handleDelete = (vaccineId: number) => {
    Alert.alert(t('action.delete'), t('record.deleteConfirm'), [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('action.delete'), style: 'destructive', onPress: () => remove(vaccineId) },
    ]);
  };

  // 백신 ↔ 정기체크 이동 — 현재 탭의 반대 카테고리로 옮긴다(다른 필드는 유지).
  const targetCategory: VaccineCategory = category === 'VACCINE' ? 'RECURRING' : 'VACCINE';
  const targetLabel = targetCategory === 'RECURRING' ? t('vaccine.recurringShort') : t('vaccine.vaccineShort');
  const handleMove = (vaccineId: number) => {
    const v = vaccines.find((x) => x.id === vaccineId);
    if (!v) return;
    Alert.alert(t('vaccine.moveTitle'), t('vaccine.moveConfirm', { name: v.vaccineName, target: targetLabel }), [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('vaccine.move'),
        onPress: () => update({
          vaccineId,
          data: {
            vaccineName: v.vaccineName,
            vaccinatedAt: v.vaccinatedAt,
            nextVaccineAt: v.nextVaccineAt ?? undefined,
            notes: v.notes ?? undefined,
            alertEnabled: v.alertEnabled,
            recurrenceType: v.recurrenceType,
            category: targetCategory,
          },
        }),
      },
    ]);
  };

  if (!selectedPetId) return null;

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <View style={{ flex: 1, paddingTop: topInset }}>
          <LoadingSpinner label={t('common.loading')} />
        </View>
      ) : vaccines.length === 0 ? (
        <View style={{ flex: 1, paddingTop: topInset }}>
          <EmptyState
            icon={copy.emptyIcon}
            title={t(`${copy.ns}.emptyTitle`)}
            description={t(`${copy.ns}.emptyDesc`)}
            action={{ label: t('vaccine.addItem'), onPress: () => setShowForm(true) }}
          />
        </View>
      ) : (
        <FlatList
          data={sortedVaccines}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: topInset + Spacing.lg, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListHeaderComponent={
            alertLimited ? (
              <View style={{ marginBottom: Spacing.lg, paddingHorizontal: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary }}>
                    {t('vaccine.activeAlerts')}
                  </Text>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary }}>
                    {t('vaccine.alertCount', { count: alertEnabledCount, max: limits.maxVaccineAlerts })}
                  </Text>
                </View>
                <View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: Colors.border,
                    marginTop: Spacing.xs,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(100, (alertEnabledCount / limits.maxVaccineAlerts) * 100)}%`,
                      height: '100%',
                      backgroundColor: Colors.primary,
                    }}
                  />
                </View>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
          renderItem={({ item }) => (
            <VaccineCard
              vaccine={item}
              canEnableAlert={canEnableAlert}
              onToggleAlert={handleToggleAlert}
              onDelete={handleDelete}
              onMove={handleMove}
              moveLabel={t('vaccine.moveTo', { target: targetLabel })}
            />
          )}
        />
      )}

      <Fab onPress={() => setShowForm(true)} icon="plus" accessibilityLabel={t(`${copy.ns}.fabLabel`)} />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestCloseForm}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <ScreenHeader
            title={t(`${copy.ns}.modalTitle`)}
            back={requestCloseForm}
            actions={[{ icon: 'check', label: t('action.save'), onPress: handleSubmit(handleCreate) }]}
          />
          <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg }} keyboardShouldPersistTaps="handled">
            <Field label={t(`${copy.ns}.nameLabel`)} control={control} name="vaccineName" placeholder={t(`${copy.ns}.namePlaceholder`)} error={errors.vaccineName} />
            <DateField label={t(`${copy.ns}.dateLabel`)} control={control} name="vaccinatedAt" title={t(`${copy.ns}.dateTitle`)} hasError={!!errors.vaccinatedAt} />
            <DateField label={t('vaccine.nextDue')} control={control} name="nextVaccineAt" title={t('vaccine.nextDue')} />

            <Controller
              control={control}
              name="recurrenceType"
              render={({ field: { value, onChange } }) => (
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.xs }}>
                    {t('vaccine.recurrence')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                    {RECURRENCE_OPTIONS.map((opt) => {
                      const selected = value === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          activeOpacity={0.8}
                          style={{
                            paddingHorizontal: Spacing.md,
                            paddingVertical: Spacing.sm,
                            borderRadius: Spacing.borderRadius.full,
                            backgroundColor: selected ? Colors.primaryDark : Colors.surface,
                            borderWidth: 1,
                            borderColor: selected ? Colors.primaryDark : Colors.border,
                          }}
                        >
                          <Text
                            style={{
                              ...Typography.preset.caption,
                              color: selected ? Colors.white : Colors.text.primary,
                              fontWeight: Typography.weight.semibold,
                            }}
                          >
                            {t(`vaccine.recurrenceOpts.${opt.key}.label`)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ ...Typography.preset.caption, color: Colors.text.tertiary, marginTop: Spacing.xs }}>
                    {t(`vaccine.recurrenceOpts.${(RECURRENCE_OPTIONS.find((o) => o.value === value)?.key) ?? 'none'}.desc`)}
                    {value !== 'NONE' ? t('vaccine.recurrenceAutoNote') : ''}
                  </Text>
                </View>
              )}
            />


            <Field label={t('vaccine.memo')} control={control} name="notes" placeholder={t('vaccine.memoPlaceholder')} />
            <Controller
              control={control}
              name="alertEnabled"
              render={({ field: { value, onChange } }) => (
                <View
                  style={{
                    marginTop: Spacing.md,
                    padding: Spacing.md,
                    backgroundColor: Colors.surface,
                    borderRadius: Spacing.borderRadius.md,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    gap: value ? Spacing.sm : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...Typography.preset.bodyMedium, color: Colors.text.primary }}>{t('vaccine.nextAlertTitle')}</Text>
                      <Text style={{ ...Typography.preset.caption, color: Colors.text.secondary, marginTop: 2 }}>
                        {t('vaccine.nextAlertDesc')}
                      </Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.white}
                    />
                  </View>
                  {value ? (
                    <TouchableOpacity
                      onPress={async () => {
                        const name = (control._formValues?.vaccineName as string) || t('vaccine.vaccineShort');
                        const ok = await scheduleVaccineNotificationPreview(name);
                        if (ok) Alert.alert(t('vaccine.previewScheduledTitle'), t('vaccine.previewScheduledBody'));
                      }}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: Spacing.borderRadius.md,
                        backgroundColor: Colors.primaryLight,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Feather name="bell" size={12} color={Colors.primaryDark} />
                      <Text style={{ ...Typography.preset.caption, color: Colors.primaryDark, fontWeight: Typography.weight.bold }}>
                        {t('vaccine.previewCta')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            />
            <View style={{ height: Spacing.xl }} />
            <Button fullWidth size="lg" loading={creating} onPress={handleSubmit(handleCreate)}>
              {t('action.save')}
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
