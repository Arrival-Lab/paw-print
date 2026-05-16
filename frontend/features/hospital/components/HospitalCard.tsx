import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { useColors } from '../../../shared/hooks/useTheme';
import type { Hospital } from '../api/hospitalApi';

interface Props {
  hospital: Hospital;
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

export function HospitalCard({ hospital }: Props) {
  const Colors = useColors();

  const handleCall = () => {
    if (hospital.phone) Linking.openURL(`tel:${hospital.phone}`);
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text.primary, flex: 1, marginRight: 8 }} numberOfLines={1}>
          {hospital.name}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.primary }}>
          {formatDistance(hospital.distance)}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: Colors.text.secondary, marginBottom: 12 }} numberOfLines={1}>
        {hospital.address}
      </Text>
      {hospital.phone ? (
        <TouchableOpacity
          onPress={handleCall}
          style={{
            backgroundColor: Colors.status.success,
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 16,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ color: Colors.white, fontSize: 13, fontWeight: '600' }}>{hospital.phone}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ fontSize: 13, color: Colors.text.disabled }}>전화번호 없음</Text>
      )}
    </View>
  );
}
