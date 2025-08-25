import React from "react";

const VARIANTS = {
  primary:
    "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500/60",
  secondary:
    "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500/60",
  ghost:
    "bg-transparent hover:bg-gray-700/60 text-gray-200 focus:ring-gray-500/40 border border-gray-700",
  danger:
    "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/60",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const variantCls = VARIANTS[variant] ?? VARIANTS.primary;
  const sizeCls = SIZES[size] ?? SIZES.md;

  return (
    <Tag
      className={[
        "inline-flex items-center justify-center gap-2 font-medium rounded-md",
        "transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeCls,
        variantCls,
        className,
      ].join(" ")}
      disabled={disabled}
      {...props}
    >
      {children}
    </Tag>
  );
}
