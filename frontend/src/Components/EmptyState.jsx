export default function EmptyState({ title, subtitle }) {
  return (
    <div className="text-center py-10 text-gray-600">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}