import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants';

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 }}>
          발자국
        </Text>
        <Text style={{ fontSize: 15, color: Colors.text.secondary }}>
          반려동물 건강 기록 서비스
        </Text>
      </View>
    </SafeAreaView>
  );
}
