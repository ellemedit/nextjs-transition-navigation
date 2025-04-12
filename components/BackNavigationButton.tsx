"use client";

import { ComponentPropsWithRef, MouseEvent } from "react";

export function BackNavigationButton({
  onClick,
  ...otherProps
}: ComponentPropsWithRef<"button">) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.isDefaultPrevented()) {
      return;
    }
    if (window.navigation.canGoBack) {
      window.navigation.back();
    } else {
      window.navigation.navigate("/");
    }
  }
  return <button {...otherProps} onClick={handleClick} />;
}
