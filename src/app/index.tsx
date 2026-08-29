import { Redirect } from 'expo-router';

export default function Index() {
  // Redirects root route to the main tab navigation
  return <Redirect href="/(tabs)" />;
}
