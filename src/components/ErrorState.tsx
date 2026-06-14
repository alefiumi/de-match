interface Props {
  message: string | null;
}

export function ErrorState({ message }: Props) {
  if (!message) return null;

  return (
    <div className="error-card p-5 mb-6 animate-fade-up" role="alert" aria-live="assertive">
      <div className="flex gap-3 items-start">
        <svg
          width="20" height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth="2"
          strokeLinecap="round"
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <p className="font-semibold text-red-300 text-sm mb-1">Oracle Connection Failed</p>
          <p className="text-red-400 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
