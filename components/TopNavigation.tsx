import {
  ComponentPropsWithRef,
  unstable_ViewTransition as ViewTransition,
} from "react";
import { twMerge } from "tailwind-merge";

import "./TopNavigation.css";

export function TopNavigation({
  className,
  children,
  ...otherProps
}: ComponentPropsWithRef<"div">) {
  return (
    <ViewTransition name="top-navigation">
      <div
        {...otherProps}
        className={twMerge(
          "sticky top-0 px-8 sm:px-[10vw] py-4 bg-white border-b-2 border-black z-10",
          className
        )}
      >
        <ViewTransition name="top-navigation-content">
          <div className={twMerge(className)}>{children}</div>
        </ViewTransition>
      </div>
    </ViewTransition>
  );
}
