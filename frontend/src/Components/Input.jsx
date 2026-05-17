export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="font-medium text-gray-700">{label}</label>}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
      />
    </div>
  );
}