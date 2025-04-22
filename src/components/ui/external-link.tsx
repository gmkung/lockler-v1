
import React from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
  showIcon?: boolean;
  iconOnly?: boolean;
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  children,
  className,
  showIcon = true,
  iconOnly = false,
  ...props
}) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors ${iconOnly ? 'p-1.5 hover:bg-purple-900/30 rounded-full' : ''} ${className || ''}`}
      {...props}
    >
      {children}
      {showIcon && <ExternalLinkIcon className={`${iconOnly ? 'h-4.5 w-4.5' : 'h-3.5 w-3.5'}`} />}
    </a>
  );
};
