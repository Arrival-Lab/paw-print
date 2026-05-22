import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants';
import { useColors } from '../../../shared/hooks/useTheme';
import { useGlossaryStore } from '../store/glossaryStore';

interface Props {
  /** 클릭 시 사전을 이 용어로 자동 검색해서 엽니다. 없으면 빈 검색창. */
  term?: string;
  size?: number;
}

export default function GlossaryHint({ term, size = 16 }: Props) {
  const Colors = useColors();
  const open = useGlossaryStore((s) => s.open);
  return (
    <Pressable
      onPress={() => open(term)}
      hitSlop={Spacing.hitSlop}
      style={{
        width: size + 8,
        height: size + 8,
        borderRadius: (size + 8) / 2,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name="help-circle" size={size} color={Colors.text.accent} />
    </Pressable>
  );
}
