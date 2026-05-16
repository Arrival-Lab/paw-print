import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Typography } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { formatDate } from '../../../shared/utils/format';
import type { DiaryPhoto } from '../api/diaryApi';

interface Props {
  date: string;
  content: string | null;
  tags: string[];
  photos: DiaryPhoto[];
  onEdit: () => void;
}

export default function DiaryReadView({ date, content, tags, photos, onEdit }: Props) {
  const Colors = useColors();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxxxl, gap: Spacing.lg }}
    >
      <Text style={{ ...Typography.preset.bodySmall, color: Colors.text.tertiary }}>
        {formatDate(date, 'yyyy년 MM월 dd일')}
      </Text>

      {content ? (
        <Text
          style={{
            ...Typography.preset.body,
            color: Colors.text.primary,
            lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
          }}
        >
          {content}
        </Text>
      ) : (
        <Text style={{ ...Typography.preset.body, color: Colors.text.tertiary, fontStyle: 'italic' }}>
          (내용 없음)
        </Text>
      )}

      {tags.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: Colors.primaryLight,
                borderRadius: Spacing.borderRadius.full,
                paddingVertical: Spacing.xs,
                paddingHorizontal: Spacing.md,
              }}
            >
              <Text style={{ fontSize: Typography.size.sm, color: Colors.primary }}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {photos.length > 0 ? (
        <View>
          <Text style={{ ...Typography.preset.label, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
            사진 ({photos.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {photos.map((p) => (
                <Image
                  key={p.id}
                  source={{ uri: p.photoUrl }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: Spacing.borderRadius.md,
                    backgroundColor: Colors.surface,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onEdit}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.xs,
          marginTop: Spacing.md,
          paddingVertical: Spacing.md,
          borderRadius: Spacing.borderRadius.lg,
          backgroundColor: Colors.primaryLight,
        }}
      >
        <Feather name="edit-3" size={16} color={Colors.primary} />
        <Text style={{ ...Typography.preset.button, color: Colors.primary }}>수정</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
