import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

// The Lovable OAuth broker only redirects back to lovable.app web URLs,
// so on native we bounce through our published web URL which then
// deep-links back into the app via the safesip:// custom scheme.
const PUBLISHED_WEB_ORIGIN = 'https://safe-sipper.lovable.app';
const BRIDGE_PATH = '/mobile-auth-bridge';
const APP_SCHEME = 'safesip';

export const isNative = () => Capacitor.isNativePlatform();

function generateState() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Starts Google/Apple OAuth on iOS/Android:
 * 1. Opens the Lovable OAuth broker in the system browser
 * 2. Broker auths the user, redirects back to our web bridge page
 * 3. Bridge page forwards tokens to safesip://auth-callback#...
 * 4. App URL listener picks up the deep link and sets the session
 */
export async function signInWithOAuthNative(provider: 'google' | 'apple') {
  const state = generateState();
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    provider,
    redirect_uri: `${PUBLISHED_WEB_ORIGIN}${BRIDGE_PATH}`,
    state,
  });

  const url = `${PUBLISHED_WEB_ORIGIN}/~oauth/initiate?${params.toString()}`;

  // Listen for the deep-link return before opening the browser
  const handle = await App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
    if (!event.url.startsWith(`${APP_SCHEME}://`)) return;

    // Tokens come back in the URL fragment: safesip://auth-callback#access_token=...&refresh_token=...&state=...
    const fragment = event.url.split('#')[1] ?? event.url.split('?')[1] ?? '';
    const params = new URLSearchParams(fragment);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const returnedState = params.get('state');
    const error = params.get('error') ?? params.get('error_description');

    await Browser.close().catch(() => {});
    handle.remove();

    if (error) {
      console.error('OAuth error:', error);
      return;
    }
    if (returnedState && returnedState !== sessionStorage.getItem('oauth_state')) {
      console.error('OAuth state mismatch');
      return;
    }
    if (!access_token || !refresh_token) {
      console.error('Missing tokens in OAuth callback');
      return;
    }

    sessionStorage.removeItem('oauth_state');
    await supabase.auth.setSession({ access_token, refresh_token });
    // useAuth's onAuthStateChange will pick this up and route to /home
  });

  await Browser.open({ url, presentationStyle: 'popover' });
}
