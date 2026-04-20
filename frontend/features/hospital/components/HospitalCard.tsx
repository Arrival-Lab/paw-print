import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../../constants/colors';
import type { Hospital } from '../api/hospitalApi';

interface Props {
  hospital: Hospital;
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

export function HospitalCard({ hospital }: Props) {
  const handleCall = () => {
    if (hospital.phone) Linking.openURL(`tel:${hospital.phone}`);
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-border">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-base font-bold text-text-primary flex-1 mr-2" numberOfLines={1}>
          {hospital.name}
        </Text>
        <Text className="text-sm font-medium text-primary">{formatDistance(hospital.distance)}</Text>
      </View>
      <Text className="text-sm text-text-secondary mb-3" numberOfLines={1}>
        {hospital.address}
      </Text>
      {hospital.phone ? (
        <TouchableOpacity
          onPress={handleCall}
          className="rounded-xl py-2 px-4 items-center self-start"
          style={{ backgroundColor: Colors.status.success }}>
          <Text className="text-white text-sm font-semibold">{hospital.phone}</Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-sm text-text-disabled">전화번호 없음</Text>
      )}
    </View>
  );
}
