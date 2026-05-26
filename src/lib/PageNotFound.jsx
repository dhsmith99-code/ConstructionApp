import React from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <h1 className="font-serif text-6xl font-semibold text-foreground">404</h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
      <Link to="/" className="text-sm font-medium underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  );
}
