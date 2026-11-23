export default function Notice({ kind = "info", role, children }) {
  return (
    <p className="notice" data-kind={kind} role={role}>
      {children}
    </p>
  );
}
