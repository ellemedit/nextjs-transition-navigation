"use client";

import NextLink from "next/link";
import { ComponentPropsWithRef } from "react";

export function Link({
  href,
  onClick,
  replace,
  ...otherProps
}: ComponentPropsWithRef<typeof NextLink>) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    window.navigation.navigate(
      typeof href === "string" ? href : href.toString(),
      { history: replace ? "replace" : "push" }
    );
  }
  return (
    <NextLink
      href={href}
      replace={replace}
      onClick={handleClick}
      {...otherProps}
    />
  );
}
