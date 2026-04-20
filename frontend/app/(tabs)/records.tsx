import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants';

export default function RecordsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: Colors.text.primary, fontSize: 17 }}>진료기록</Text>
      </View>
    </SafeAreaView>
  );
}
