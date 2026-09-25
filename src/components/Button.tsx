import React from "react";

interface ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "outlineWhite";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href: string; // href is still required for anchor semantics
  className?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  href,
  className = "",
  disabled = false,
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-page transition-all duration-150 ease-in-out";

  let variantStyles = "";
  switch (variant) {
    case "primary":
      variantStyles =
        "bg-accent text-on-accent hover:bg-accent-hover focus:ring-focus";
      break;
    case "secondary":
      variantStyles =
        "bg-accent-soft text-accent-soft-fg hover:bg-accent-soft-hover focus:ring-focus";
      break;
    case "outline":
      variantStyles =
        "border border-accent text-link hover:bg-accent-tint focus:ring-focus";
      break;
    case "outlineWhite":
      variantStyles =
        "border border-on-accent text-on-accent hover:bg-on-accent hover:text-link focus:ring-on-accent";
      break;
    case "ghost":
      variantStyles = "text-link hover:bg-accent-tint focus:ring-focus";
      break;
  }

  let sizeStyles = "";
  switch (size) {
    case "sm":
      sizeStyles = "px-3 py-1.5 text-sm";
      break;
    case "md":
      sizeStyles = "px-4 py-2 text-base";
      break;
    case "lg":
      sizeStyles = "px-6 py-3 text-lg";
      break;
  }

  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed"
    : "transform hover:scale-105";

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      // Original comments were:
      // If href is a placeholder like '#', prevent default navigation to allow onClick to handle action.
      // Or if the onClick handler itself wants to control navigation.
      // For this setup, we assume onClick takes precedence for actions.

      // Updated explanation for the behavior:
      // If the href is simply "#", it's often a placeholder for an action handled by JavaScript.
      // In this case, we prevent the default anchor behavior (e.g., scrolling to the top of the page)
      // to let the onClick handler manage the action. For any other href values, if the onClick
      // handler wishes to prevent default navigation, it must do so explicitly by calling event.preventDefault().

      // Fix: Corrected condition below. Removed 'tier.ctaLink' as 'tier' is not in scope here,
      // and relying on it made the Button component less generic and caused a runtime error.
      // The condition now only checks for href === '#' to prevent default anchor behavior
      // when an onClick handler is present and href is a simple placeholder.
      if (href === "#") {
        event.preventDefault();
      }
      onClick(event);
    }
    // If onClick is not provided, or if onClick was provided but didn't call event.preventDefault()
    // (and href wasn't '#'), then the default anchor navigation will proceed.
  };

  return (
    <a
      href={disabled && href !== "#" ? undefined : href} // Keep href for context, but disable navigation if truly disabled
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`}
      aria-disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
};

export default Button;
