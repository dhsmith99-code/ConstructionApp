import React from 'react';
import { HardHat } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-2">
        <HardHat className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="font-serif text-3xl font-semibold">Access Required</h1>
      <p className="text-muted-foreground max-w-sm">
        Your account hasn't been registered for this app yet. Please contact your administrator.
      </p>
    </div>
  );
}
