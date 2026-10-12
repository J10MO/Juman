export function Loading({ label = 'لحظة، دا نجهزلك...' }) {
  return (
    <div className="state">
      <div className="spinner" />
      <span className="muted">{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state">
      <h3>أوه، صار شي غلط</h3>
      <p className="muted">{error?.message || 'ما گدرنا نجيب البيانات'}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          جرّب مرة ثانية
        </button>
      )}
    </div>
  )
}
