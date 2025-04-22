
import React from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors ${className || ''}`}
      {...props}
    >
      {children}
      <ExternalLinkIcon className="h-3.5 w-3.5" />
    </a>
  );
};
