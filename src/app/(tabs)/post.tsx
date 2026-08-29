import { Redirect } from 'expo-router';

/**
 * Placeholder route for the "+" tab. The tab press is intercepted in
 * (tabs)/_layout.tsx and pushed to the /here modal, so this only renders if
 * something navigates here directly (e.g. a deep link).
 */
export default function PostTabPlaceholder() {
  return <Redirect href="/here" />;
}
