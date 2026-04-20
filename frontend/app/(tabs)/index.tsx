import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants';

export default function DiaryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: Colors.text.primary, fontSize: 17 }}>건강 다이어리</Text>
      </View>
    </SafeAreaView>
  );
}
