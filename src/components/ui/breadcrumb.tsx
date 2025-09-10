"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Check if first item is Dashboard to avoid duplication
  const firstItemIsDashboard =
    items.length > 0 && items[0].label === "Dashboard";

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {/* Only show home icon + Dashboard if first item is not already Dashboard */}
      {!firstItemIsDashboard && (
        <Link
          href="/dashboard"
          className="flex items-center hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Dashboard
        </Link>
      )}

      {items.map((item, index) => (
        <React.Fragment key={index}>
          {/* Only show chevron if there's a previous item */}
          {(index > 0 || !firstItemIsDashboard) && (
            <ChevronRight className="w-4 h-4" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
