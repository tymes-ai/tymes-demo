import {ClerkFailed, SignIn, SignOutButton, useAuth} from '@clerk/react';
import {useState} from 'react';
import {Logo} from '../ui/parts';

const appearance = {
  variables: {
    colorPrimary: '#1a1a1a',
    colorBackground: '#f3eee4',
    borderRadius: '0',
    fontFamily: 'inherit',
  },
  elements: {cardBox: {boxShadow: 'none'}},
};

/** The visitor is the real person, held by Clerk. The story's founder stays in the demo's own state. */
export function AuthGate({children}: {children: React.ReactNode}) {
  const {isLoaded, isSignedIn} = useAuth();
  if (!isLoaded) {
    return (
      <ClerkFailed>
        <p role="alert" style={{padding: 48}}>Sign-in could not load. Check your connection or ad blocker, then refresh the page.</p>
      </ClerkFailed>
    );
  }
  return isSignedIn ? <>{children}</> : <LoginPage />;
}

/**
 * Clerk's form reads the hash as its own route, and leaves the page if it doesn't
 * know it. So a demo route is dropped first, keeping only Clerk's returns from Google.
 */
function dropDemoRoute() {
  if (window.location.hash && !/sso-callback|verify/.test(window.location.hash)) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function LoginPage() {
  useState(dropDemoRoute);
  return (
    <div className="setup">
      <div className="login-grid" style={{minHeight: '100dvh'}}>
        <div className="login-left" id="main">
          <Logo />
          <div className="login-box">
            <SignIn routing="hash" withSignUp appearance={appearance} />
          </div>
          <small>
            We record your name, email, and when you sign in. <a href="./privacy.html">Privacy policy</a> · <a href="./terms.html">Terms</a>
          </small>
        </div>
        <div className="login-right dark">
          <p>Pay only for the meetings you had.</p>
          <small>Buy a pack of 10, 20, 50, or 100 up front. No seats.</small>
        </div>
      </div>
    </div>
  );
}

export function SignOut({className}: {className?: string}) {
  return (
    <SignOutButton>
      <button type="button" className={className}>Sign out</button>
    </SignOutButton>
  );
}
