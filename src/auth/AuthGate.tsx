import {ClerkFailed, SignIn, SignOutButton, useAuth} from '@clerk/react';
import {useState} from 'react';
import {Logo} from '../ui/parts';

// Clerk draws borders as box shadows, so the 2px rule is an inset shadow too.
const FRAME = {
  minHeight: '50px',
  borderRadius: 0,
  border: 0,
  boxShadow: 'inset 0 0 0 2px var(--sumi)',
  background: 'var(--paper)',
  color: 'var(--sumi)',
  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
} as const;

// Inline styles, because Clerk's own stylesheet outranks the app's classes.
const appearance = {
  options: {socialButtonsVariant: 'blockButton', socialButtonsPlacement: 'top'},
  variables: {
    colorPrimary: 'var(--sumi)',
    colorPrimaryForeground: 'var(--paper)',
    colorBackground: 'var(--paper)',
    colorForeground: 'var(--sumi)',
    colorMutedForeground: 'var(--grey)',
    colorInput: 'var(--paper)',
    colorInputForeground: 'var(--sumi)',
    colorBorder: 'var(--hair)',
    colorRing: 'var(--ind)',
    colorDanger: 'var(--err)',
    colorShadow: 'transparent',
    fontFamily: 'inherit',
    fontSize: '17px',
    borderRadius: '0',
  },
  elements: {
    rootBox: {width: '100%'},
    cardBox: {width: '100%', maxWidth: 'none', boxShadow: 'none', border: 0, borderRadius: 0, background: 'transparent', overflow: 'visible'},
    card: {padding: 0, gap: '24px', boxShadow: 'none', border: 0, background: 'transparent', overflow: 'visible'},
    header: {alignItems: 'flex-start', textAlign: 'left'},
    headerTitle: {fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--sumi)'},
    headerSubtitle: {fontSize: '17px', color: 'var(--grey)'},
    socialButtons: {display: 'grid', gridTemplateColumns: '1fr', gap: '10px'},
    socialButtonsBlockButton: {...FRAME, '&:hover': {background: 'var(--sumi)', color: 'var(--paper)'}},
    socialButtonsBlockButtonText: {fontSize: '17px', fontWeight: 700, color: 'inherit'},
    socialButtonsProviderIcon: {width: '18px', height: '18px'},
    lastAuthenticationStrategyBadge: {
      top: '-10px',
      right: '10px',
      padding: '1px 7px',
      borderRadius: 0,
      border: 0,
      background: 'var(--paper2)',
      color: 'var(--sumi)',
      fontSize: '12px',
      fontWeight: 700,
      boxShadow: 'none',
    },
    dividerRow: {margin: '2px 0'},
    dividerLine: {background: 'var(--hair)', height: '1.5px'},
    dividerText: {color: 'var(--grey)', fontSize: '15px'},
    formFieldLabel: {fontSize: '15px', fontWeight: 700, color: 'var(--sumi)'},
    formFieldInput: {
      ...FRAME,
      padding: '0 14px',
      fontSize: '17px',
      caretColor: 'var(--red)',
      '&:focus': {boxShadow: 'inset 0 0 0 3px var(--ind)'},
      '&::placeholder': {color: 'var(--grey)'},
    },
    otpCodeFieldInput: {...FRAME, minHeight: '56px', fontSize: '22px', fontWeight: 700},
    identityPreview: {...FRAME, minHeight: 'auto', padding: '10px 14px'},
    identityPreviewEditButton: {color: 'var(--ind)'},
    formButtonPrimary: {
      minHeight: '50px',
      borderRadius: 0,
      border: 0,
      boxShadow: 'none',
      backgroundImage: 'none',
      background: 'var(--sumi)',
      color: 'var(--paper)',
      fontSize: '17px',
      fontWeight: 700,
      textTransform: 'none',
      transition: 'background 0.2s',
      '&:hover': {background: 'var(--ind)'},
      '&::after': {display: 'none'},
    },
    buttonArrowIcon: {display: 'none'},
    formFieldErrorText: {color: 'var(--err)', fontSize: '15px'},
    alert: {borderRadius: 0, boxShadow: 'inset 0 0 0 2px var(--err)', background: 'var(--paper)'},
    formResendCodeLink: {color: 'var(--ind)', fontWeight: 600},
    footer: {background: 'transparent', marginTop: '4px', padding: 0, '& > div': {justifyContent: 'flex-start'}},
    footerAction: {justifyContent: 'flex-start', padding: '0 0 12px'},
    footerActionText: {color: 'var(--grey)', fontSize: '15px'},
    footerActionLink: {color: 'var(--sumi)', fontSize: '15px', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationThickness: '2px', '&:hover': {color: 'var(--ind)'}},
    footerPages: {justifyContent: 'flex-start'},
    backLink: {color: 'var(--ind)'},
  },
} as const;

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
            <h1 className="h-step">Log in to Tymes.</h1>
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
