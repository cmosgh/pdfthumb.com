import React from "react";

// The inline SVGs that used to sit in components, moved here as-is. The
// caller gives size and colour (className) and any aria attributes.
// The outline icons in ../icons.tsx are re-exported so `ui` is the one
// import point.
export * from "../icons";

type SvgProps = React.SVGProps<SVGSVGElement>;

// 24px outline icons, 2px stroke.
const Outline: React.FC<SvgProps & { d: string }> = ({ d, ...props }) => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export const MenuIcon: React.FC<SvgProps> = (props) => (
  <Outline d="M4 6h16M4 12h16M4 18h16" {...props} />
);

export const XMarkIcon: React.FC<SvgProps> = (props) => (
  <Outline d="M6 18L18 6M6 6l12 12" {...props} />
);

export const ClipboardIcon: React.FC<SvgProps> = (props) => (
  <Outline
    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    {...props}
  />
);

export const CheckIcon: React.FC<SvgProps> = (props) => (
  <Outline d="M5 13l4 4L19 7" {...props} />
);

// An empty circle: a step not done yet, beside CheckCircleIcon's done.
export const CircleIcon: React.FC<SvgProps> = (props) => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const KeyIcon: React.FC<SvgProps> = (props) => (
  <Outline
    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    {...props}
  />
);

// 20px solid.
export const ExclamationTriangleIcon: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// The ring-and-arc spinner in ConfirmationDialog's busy button. The caller
// adds animate-spin, size and colour.
export const SpinnerIcon: React.FC<SvgProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
