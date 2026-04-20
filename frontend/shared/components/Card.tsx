import { Pressable, View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const cardBase: ViewStyle = {
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Spacing.borderRadius.lg,
  padding: Spacing.lg,
};

export default function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [cardBase, style, pressed && { opacity: 0.8 }]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardBase, style]}>{children}</View>;
}
