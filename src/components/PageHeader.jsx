import React from 'react';

export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        {eyebrow && (
          <div className="text-xs font-medium text-accent uppercase tracking-[0.2em] mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-4xl lg:text-5xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-3 text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
