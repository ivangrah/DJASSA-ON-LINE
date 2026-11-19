import { StatusBar } from 'expo-status-bar';
import Root from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <Root />
      <StatusBar style="light" />
    </>
  );
}
