"use client";

import NextLink from "next/link";
import { ComponentPropsWithRef } from "react";

export function Link({
  href,
  onNavigate,
  replace,
  ...otherProps
}: ComponentPropsWithRef<typeof NextLink>) {
  return (
    <NextLink
      href={href}
      replace={replace}
      onNavigate={(event) => {
        event.preventDefault();
        onNavigate?.(event);
        window.navigation.navigate(
          typeof href === "string" ? href : href.toString(),
          { history: replace ? "replace" : "push" }
        );
      }}
      {...otherProps}
    />
  );
}
