import { useEffect } from 'react';

/**
 * Runs on the PUBLISHED WEB URL only. The Lovable OAuth broker redirects
 * here after auth, with tokens in the URL fragment. We forward them into
 * the native app via the safesip:// custom URL scheme.
 */
const MobileAuthBridge = () => {
  useEffect(() => {
    const fragment = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.search.startsWith('?')
        ? window.location.search.slice(1)
        : '';

    const deepLink = `safesip://auth-callback#${fragment}`;
    // Use location.replace so the user can't navigate back to this bridge
    window.location.replace(deepLink);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-heading font-semibold mb-2">Returning to SafeSip…</h1>
      <p className="text-sm text-muted-foreground mb-4">
        If the app doesn't open automatically,{' '}
        <a
          href={`safesip://auth-callback${window.location.hash || window.location.search}`}
          className="text-primary underline"
        >
          tap here
        </a>
        .
      </p>
    </div>
  );
};

export default MobileAuthBridge;
