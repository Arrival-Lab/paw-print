import 'expo-router/entry';
import { Platform } from 'react-native';

// Android 홈 화면 위젯 task handler + 설정 화면 등록. iOS 에서는 Android 전용 모듈을 로드하지 않는다.
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler, registerWidgetConfigurationScreen } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./features/widget/widgetTaskHandler');
  const { WidgetConfigurationScreen } = require('./features/widget/configScreen');
  registerWidgetTaskHandler(widgetTaskHandler);
  registerWidgetConfigurationScreen(WidgetConfigurationScreen);
}
