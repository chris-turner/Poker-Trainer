import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MenuScreen } from '../screens/MenuScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { TableScreen } from '../screens/TableScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Menu">
        <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Poker Trainer' }} />
        <Stack.Screen name="ModeSelect" component={ModeSelectScreen} options={{ title: 'Choose Mode' }} />
        {/* title is overridden per-quiz by TableScreen itself via navigation.setOptions */}
        <Stack.Screen name="Table" component={TableScreen} options={{ title: 'Quiz', headerBackVisible: true }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
