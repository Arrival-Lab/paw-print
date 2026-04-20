import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Colors } from '../../../constants/colors';
import type { PostTag } from '../api/communityApi';

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  content: z.string().min(1, '내용을 입력하세요'),
  tag: z.enum(['SYMPTOM_SHARE', 'HOSPITAL_REVIEW', 'INFO_SHARE']),
});

type FormValues = z.infer<typeof schema>;

const TAGS: { label: string; value: PostTag }[] = [
  { label: '#증상공유', value: 'SYMPTOM_SHARE' },
  { label: '#병원후기', value: 'HOSPITAL_REVIEW' },
  { label: '#정보공유', value: 'INFO_SHARE' },
];

interface Props {
  onSubmit: (data: FormValues) => void;
  loading?: boolean;
}

export function PostForm({ onSubmit, loading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tag: 'INFO_SHARE' },
  });

  return (
    <ScrollView className="px-4 py-4">
      <Text className="text-sm font-medium text-text-secondary mb-2">태그</Text>
      <Controller
        control={control}
        name="tag"
        render={({ field: { value, onChange } }) => (
          <View className="flex-row gap-2 mb-4">
            {TAGS.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => onChange(t.value)}
                className={`px-3 py-2 rounded-full border ${
                  value === t.value ? 'bg-primary border-primary' : 'bg-white border-border'
                }`}>
                <Text className={value === t.value ? 'text-white text-sm' : 'text-text-secondary text-sm'}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      <View className="mb-4">
        <Text className="text-sm font-medium text-text-secondary mb-1">제목</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border border-border rounded-xl px-3 py-3 text-text-primary"
              value={value}
              onChangeText={onChange}
              placeholder="제목을 입력하세요"
            />
          )}
        />
        {errors.title && <Text className="text-status-error text-xs mt-1">{errors.title.message}</Text>}
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-text-secondary mb-1">내용</Text>
        <Controller
          control={control}
          name="content"
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="border border-border rounded-xl px-3 py-3 text-text-primary"
              value={value}
              onChangeText={onChange}
              placeholder="내용을 입력하세요"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          )}
        />
        {errors.content && <Text className="text-status-error text-xs mt-1">{errors.content.message}</Text>}
      </View>

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold text-base">
          {loading ? '등록 중...' : '등록'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
