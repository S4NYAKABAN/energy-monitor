export default function AsyncState({ state, children, height = 160 }) {
  if (state.error) {
    return (
      <div className="state state-error" role="alert">
        <p>Не вдалося завантажити дані.</p>
        <button className="btn" onClick={state.reload}>
          Повторити
        </button>
      </div>
    );
  }
  if (state.loading) {
    return (
      <div aria-busy="true">
        <div className="skeleton" style={{ height }} />
        <span className="sr-only">Завантаження…</span>
      </div>
    );
  }
  return children(state.data);
}
