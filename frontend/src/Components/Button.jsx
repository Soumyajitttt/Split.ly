export default function Button({
  children,
  className = "",
  onClick,
  type = "button",
  variant = "primary",
}) {
  const base =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200";

  const variants = {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}