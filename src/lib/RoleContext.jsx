import React, { createContext, useContext, useState } from 'react';
import { HardHat, TrendingUp, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

// ─── Change this PIN to protect management access ────────────────────────────
const MANAGEMENT_PIN = '1234';

export const ROLES = {
  management: {
    key: 'management',
    label: 'Management',
    description: 'Full access to all projects and every phase',
    icon: ShieldCheck,
    accent: '#FBBF24',       // primary yellow
    requiresPin: true,
  },
  sales: {
    key: 'sales',
    label: 'Sales',
    description: 'Sales pipeline — leads and proposals',
    icon: TrendingUp,
    accent: '#3B82F6',       // blue
    requiresPin: false,
  },
  construction: {
    key: 'construction',
    label: 'Construction',
    description: 'Active construction jobs only',
    icon: HardHat,
    accent: '#10B981',       // green
    requiresPin: false,
  },
};

const RoleContext = createContext(null);

// ─── Role selector screen ─────────────────────────────────────────────────────
function RoleSelector({ onSelect }) {
  const [pinState, setPinState] = useState(null); // { roleKey } when PIN entry is open
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const pick = (roleKey) => {
    if (ROLES[roleKey].requiresPin) {
      setPinState({ roleKey });
      setPin('');
      setError(false);
    } else {
      onSelect(roleKey);
    }
  };

  const submitPin = (e) => {
    e.preventDefault();
    if (pin === MANAGEMENT_PIN) {
      onSelect(pinState.roleKey);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-primary flex items-center justify-center">
            <HardHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-2xl font-semibold">Foreman</span>
        </div>

        {pinState ? (
          /* PIN entry */
          <div>
            <button
              onClick={() => setPinState(null)}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="font-serif text-xl font-semibold mb-1">Management Access</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter the management PIN to continue.</p>
            <form onSubmit={submitPin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(false); }}
                  placeholder="Enter PIN"
                  autoFocus
                  className={`w-full border px-4 py-3 text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring pr-12 ${
                    error ? 'border-destructive' : 'border-input'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-sm text-destructive">Incorrect PIN. Try again.</p>
              )}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        ) : (
          /* Role picker */
          <div>
            <h2 className="font-serif text-xl font-semibold mb-1 text-center">Who are you?</h2>
            <p className="text-sm text-muted-foreground mb-8 text-center">Select your role to continue.</p>
            <div className="space-y-3">
              {Object.values(ROLES).map(({ key, label, description, icon: Icon, accent, requiresPin }) => (
                <button
                  key={key}
                  onClick={() => pick(key)}
                  className="w-full flex items-center gap-4 p-4 border border-border bg-card hover:border-primary/40 hover:bg-accent/5 transition-all group text-left"
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accent + '20', color: accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  {requiresPin && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function RoleProvider({ children }) {
  const [role, setRole] = useState(
    () => localStorage.getItem('foreman_role') || null
  );

  const selectRole = (r) => {
    localStorage.setItem('foreman_role', r);
    setRole(r);
  };

  const switchRole = () => {
    localStorage.removeItem('foreman_role');
    setRole(null);
  };

  if (!role) {
    return <RoleSelector onSelect={selectRole} />;
  }

  return (
    <RoleContext.Provider
      value={{
        role,
        roleInfo: ROLES[role],
        isManagement: role === 'management',
        isSales: role === 'sales',
        isConstruction: role === 'construction',
        switchRole,
        canSeePhase: (phase) => {
          if (role === 'management') return true;
          if (role === 'sales') return phase === 'sales' || !phase;
          if (role === 'construction') return phase === 'construction';
          return false;
        },
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
