"use client";

import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  unstable_ViewTransition as ViewTransition,
  ViewTransitionInstance,
  unstable_addTransitionType as addTransitionType,
  startTransition,
  useEffect,
  useInsertionEffect,
  useState,
} from "react";

type AppRouterInstance = ReturnType<typeof useRouter>;

const FORWARD_TYPE = "forward";
const BACK_TYPE = "back";
const PUSH_TYPE = "push";
const REPLACE_TYPE = "replace";
const RELOAD_TYPE = "reload";

let didScheduleNextJSRouterNavigation = false;

type RestoreScrollPosition = () => void;
let scheduledScrollRestoration: RestoreScrollPosition | null = null;

// FIXME: this can cause memory leak, consider using LRU cache structure
const storedScrollPostions = new Map<number, [number, number]>(); // Map<EntryIndex, [ScrollX, ScrollY]>

if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => {
    const currentEntry = window.navigation.currentEntry;
    if (currentEntry == null) {
      return;
    }
    storedScrollPostions.set(currentEntry.index, [
      window.scrollX,
      window.scrollY,
    ]);
  });
}

export function NavigationIntercepter({
  children,
}: {
  children: React.ReactNode;
}) {
  type ResolveNavigation = () => void;
  const [resolveNavigation, setWorkInProgressNavigation] =
    useState<null | ResolveNavigation>(null);

  const router = useRouter();

  useEffect(() => {
    function handleNavigate(event: NavigateEvent) {
      if (!event.canIntercept) {
        return;
      }
      // prevent infinite loop by comparing previous and current navigation
      if (didScheduleNextJSRouterNavigation) {
        didScheduleNextJSRouterNavigation = false;
        return;
      }
      const handler = navigationIntercepterHandler.bind(
        null,
        router,
        setWorkInProgressNavigation,
        event
      );
      event.intercept({ handler, scroll: "manual" });
    }
    window.navigation.addEventListener("navigate", handleNavigate);

    function handlePopstate(event: PopStateEvent) {
      // hijack Next.js popstate handler, this may break other third party libraries rely on popstate event
      // TODO: we need to invastigate another way to poison nextjs router event handler
      // ref: https://github.com/vercel/next.js/blob/fd5f588f43360913197f655a7322b37022c51e17/packages/next/src/client/components/app-router.tsx#L402-L436
      event.stopImmediatePropagation();
    }
    window.addEventListener("popstate", handlePopstate);

    return () => {
      window.navigation.removeEventListener("navigate", handleNavigate);
      window.removeEventListener("popstate", handlePopstate);
    };
  }, [router]);

  useInsertionEffect(() => {
    if (!resolveNavigation) {
      return;
    }
    resolveNavigation();
    if (scheduledScrollRestoration != null) {
      scheduledScrollRestoration();
    }
  }, [resolveNavigation]);

  return (
    <ViewTransition onUpdate={handleTransitionUpdate}>
      {children}
    </ViewTransition>
  );
}

function handleTransitionUpdate(
  transition: ViewTransitionInstance,
  types: string[]
) {
  if (types.includes(FORWARD_TYPE)) {
    transition.new.animate(
      [
        { transform: "translateX(-100px)", opacity: 0 },
        { transform: "translateX(0px)", opacity: 1 },
      ],
      { duration: 200 }
    );
    transition.old.animate(
      [
        { transform: "translateX(0px)", opacity: 1 },
        { transform: "translateX(100px)", opacity: 0 },
      ],
      { duration: 200 }
    );
  }
  if (types.includes(PUSH_TYPE)) {
    transition.new.animate(
      [
        { transform: "translateX(-100px)", opacity: 0 },
        { transform: "translateX(0px)", opacity: 1 },
      ],
      { duration: 200 }
    );
    transition.old.animate(
      [
        { transform: "translateX(0px)", opacity: 1 },
        { transform: "translateX(100px)", opacity: 0 },
      ],
      { duration: 200 }
    );
  }
  if (types.includes(BACK_TYPE)) {
    transition.new.animate(
      [
        { transform: "translateX(100px)", opacity: 0 },
        { transform: "translateX(0px)", opacity: 1 },
      ],
      { duration: 200 }
    );
    transition.old.animate(
      [
        { transform: "translateX(0px)", opacity: 1 },
        { transform: "translateX(-100px)", opacity: 0 },
      ],
      { duration: 200 }
    );
  }
}

function navigationIntercepterHandler(
  router: AppRouterInstance,
  setResolver: Dispatch<SetStateAction<(() => void) | null>>,
  event: NavigateEvent
) {
  const { promise, resolve } = Promise.withResolvers<void>();
  const newUrl = new URL(event.destination.url);
  const nextUrl = newUrl.pathname + newUrl.search;
  startTransition(() => {
    switch (event.navigationType) {
      // we may need to add transition type for each navigation type?
      case "push": {
        didScheduleNextJSRouterNavigation = true;
        addTransitionType(PUSH_TYPE);
        router.push(nextUrl, { scroll: false });
        scheduledScrollRestoration = () => {
          window.scrollTo({ top: 0 });
        };
        break;
      }
      case "replace": {
        didScheduleNextJSRouterNavigation = true;
        addTransitionType(REPLACE_TYPE);
        router.replace(nextUrl);
        break;
      }
      case "reload": {
        didScheduleNextJSRouterNavigation = true;
        addTransitionType(RELOAD_TYPE);
        router.refresh();
        break;
      }
      case "traverse": {
        const previousIndex = window.navigation.currentEntry?.index;
        if (previousIndex == null) {
          throw new Error("previousIndex is null, this is a bug");
        }
        const navigationDirection =
          event.destination.index > previousIndex ? "forward" : "back";
        switch (navigationDirection) {
          case "back": {
            didScheduleNextJSRouterNavigation = true;
            addTransitionType(BACK_TYPE);
            router.replace(nextUrl, { scroll: false });
            scheduledScrollRestoration = () => {
              const currentEntry = window.navigation.currentEntry;
              if (currentEntry == null) {
                return;
              }
              const storedScrollPosition = storedScrollPostions.get(
                currentEntry.index
              );
              if (storedScrollPosition == null) {
                return;
              }
              const [left, top] = storedScrollPosition;
              window.scrollTo({ left, top });
            };
            break;
          }
          case "forward": {
            didScheduleNextJSRouterNavigation = true;
            addTransitionType(FORWARD_TYPE);
            router.replace(nextUrl, { scroll: false });
            scheduledScrollRestoration = () => {
              const currentEntry = window.navigation.currentEntry;
              if (currentEntry == null) {
                return;
              }
              const storedScrollPosition = storedScrollPostions.get(
                currentEntry.index
              );
              if (storedScrollPosition == null) {
                return;
              }
              const [left, top] = storedScrollPosition;
              window.scrollTo({ left, top });
            };
            break;
          }
        }
        break;
      }
    }
    setResolver(() => resolve);
  });
  return promise;
}
