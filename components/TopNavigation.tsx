import {
  ComponentPropsWithRef,
  unstable_ViewTransition as ViewTransition,
} from "react";
import { twMerge } from "tailwind-merge";

import "./TopNavigation.css";

export function TopNavigation(props: ComponentPropsWithRef<"div">) {
  return (
    <ViewTransition name="top-navigation">
      <div
        {...props}
        className={twMerge(
          "sticky top-0 px-8 sm:px-[10vw] py-4 bg-white border-b-2 border-black z-10",
          props.className
        )}
      >
        <ViewTransition name="top-navigation-content">
          <div>{props.children}</div>
        </ViewTransition>
      </div>
    </ViewTransition>
  );
}
