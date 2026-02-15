import type { PresenceUpdate } from '../types';

interface CollaboratorPresenceProps {
  presence: PresenceUpdate | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function CollaboratorPresence({ presence, connectionState }: CollaboratorPresenceProps) {
  const viewers = presence?.viewers ?? [];
  const others = viewers.filter((v) => v.displayName && v.displayName !== 'Anonymous');

  if (connectionState === 'error') {
    return (
      <span className="text-sm text-amber-500" title="Connection lost. Changes may not sync.">
        Offline
      </span>
    );
  }

  if (connectionState === 'connecting') {
    return <span className="text-sm text-muted">Connecting…</span>;
  }

  if (viewers.length <= 1 && others.length === 0) {
    return <span className="text-sm text-muted">Just you</span>;
  }

  const names = others.map((o) => o.displayName).join(', ');
  return (
    <span className="text-sm text-muted" title={names ? `Viewing: ${names}` : undefined}>
      {viewers.length} {viewers.length === 1 ? 'person' : 'people'} viewing
    </span>
  );
}
