import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="border border-dashed border-border rounded-2xl py-16 px-6 text-center bg-card/30">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
