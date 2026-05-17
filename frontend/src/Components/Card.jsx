export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white shadow-sm border rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}