"use client";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  unstable_addTransitionType as addTransitionType,
  unstable_ViewTransition as ViewTransition,
  startTransition,
  useEffect,
  useInsertionEffect,
  useState,
} from "react";

// You cannot use CSS module for ViewTranstion
// ViewTransition identifer spec is not compatible
// CSS module naming algorithm with Safari in dev
import "./NavigationIntercepter.css";

// flag for preventing infinite loop by nextjs router navigation
let didScheduleNextJSRouterNavigation = false;

// scheduled scroll restoration after committing navigation transition
let scheduledScrollRestoration: (() => void) | null = null;

// capture navigation entry between navigation transition
// it is useful to assume current navigation entry is same
// navigation.currentEntry inside event handler is not same for all browsers
let workInProgressNavigationEntry =
  typeof window !== "undefined" ? window.navigation.currentEntry : null;

if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => {
    captureScrollPosition();
  });
}

export function NavigationIntercepter({
  children,
}: {
  children: React.ReactNode;
}) {
  const [resolveNavigation, setWorkInProgressNavigation] = useState<
    null | (() => void)
  >(null);

  const router = useRouter();

  useInsertionEffect(() => {
    // capture initial scroll position
    // it is for when user refreshed page
    captureScrollPosition();
  }, []);

  useEffect(() => {
    function handleNavigate(event: NavigateEvent) {
      if (!event.canIntercept) {
        return;
      }
      if (event.hashChange) {
        return;
      }
      if (event.downloadRequest != null) {
        return;
      }
      // prevent infinite loop by comparing previous and current navigation
      if (didScheduleNextJSRouterNavigation) {
        didScheduleNextJSRouterNavigation = false;
        return;
      }
      // should be below of checking scheduled nextjs router navigation
      if (event.navigationType === "replace") {
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
      // TODO: we need to invastigate safer way to poison nextjs router event handler
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
    // committing navigation
    resolveNavigation();
    scheduledScrollRestoration?.();
    workInProgressNavigationEntry = window.navigation.currentEntry;
  }, [resolveNavigation]);

  return (
    <ViewTransition default="navigation-container">{children}</ViewTransition>
  );
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
      case "push": {
        handlePushNavigation();
        break;
      }
      case "replace": {
        handleReplaceNavigation();
        break;
      }
      case "reload": {
        handleReloadNavigation();
        break;
      }
      case "traverse": {
        handleTraverseNavigation();
        break;
      }
    }
    setResolver(() => resolve);
  });

  function handlePushNavigation() {
    addTransitionType("navigation-forward");
    didScheduleNextJSRouterNavigation = true;
    router.push(nextUrl);
  }

  function handleReplaceNavigation() {
    didScheduleNextJSRouterNavigation = true;
    router.replace(nextUrl);
  }

  function handleReloadNavigation() {
    didScheduleNextJSRouterNavigation = true;
    router.refresh();
  }

  function handleTraverseNavigation() {
    const previousIndex =
      window.navigation.currentEntry == null
        ? 0
        : window.navigation.currentEntry.index;
    const navigationDirection =
      event.destination.index > previousIndex ? "forward" : "back";
    switch (navigationDirection) {
      case "back": {
        handleBackNavigation();
        break;
      }
      case "forward": {
        handleForwardNavigation();
        break;
      }
    }
  }

  function handleBackNavigation() {
    addTransitionType("navigation-back");
    didScheduleNextJSRouterNavigation = true;
    router.replace(nextUrl, { scroll: false });
    const currentEntry = workInProgressNavigationEntry;
    if (currentEntry == null) {
      // this case is a bug perhaps?
      return;
    }
    const previousEntry = window.navigation
      .entries()
      .at(currentEntry.index - 1);
    if (previousEntry == null) {
      // this case is a bug perhaps?
      return;
    }
    const storedScrollPosition = parseScrollPosition(previousEntry.getState());
    if (storedScrollPosition == null) {
      // this case is a bug or currepted by outside of application
      return;
    }
    scheduledScrollRestoration = () => {
      const [left, top] = storedScrollPosition;
      window.scrollTo({ left, top });
    };
  }

  function handleForwardNavigation() {
    addTransitionType("navigation-forward");
    didScheduleNextJSRouterNavigation = true;
    router.replace(nextUrl, { scroll: false });
    const currentEntry = workInProgressNavigationEntry;
    if (currentEntry == null) {
      // this case is a bug perhaps?
      return;
    }
    const nextEntry = window.navigation.entries().at(currentEntry.index + 1);
    if (nextEntry == null) {
      // this case is a bug perhaps?
      return;
    }
    const storedScrollPosition = parseScrollPosition(nextEntry.getState());
    if (storedScrollPosition == null) {
      // this case is a bug or currepted by outside of application
      return;
    }
    scheduledScrollRestoration = () => {
      const [left, top] = storedScrollPosition;
      window.scrollTo({ left, top });
    };
  }

  return promise;
}

function parseScrollPosition(state: unknown) {
  if (typeof state !== "object") {
    return null;
  }
  if (state == null) {
    return null;
  }
  if (!("scrollPosition" in state)) {
    return null;
  }
  const scrollPosition = state.scrollPosition;
  if (typeof scrollPosition !== "object") {
    return null;
  }
  if (!Array.isArray(scrollPosition)) {
    return null;
  }
  if (scrollPosition.length !== 2) {
    return null;
  }
  const [left, top] = scrollPosition;
  if (typeof left !== "number") {
    return null;
  }
  if (typeof top !== "number") {
    return null;
  }
  return [left, top] as const;
}

function captureScrollPosition() {
  const currentEntry = window.navigation.currentEntry;
  if (currentEntry == null) {
    return;
  }
  let previousState = currentEntry.getState();
  if (typeof previousState !== "object") {
    // this is actually no way to respect previous state
    // it can be happened when third party library modify entry state
    // I just pray if you face this issue, you can fix it
    previousState = null;
  }
  const scrollPosition = [window.scrollX, window.scrollY];
  // TODO: we may need to throttle this for supporting Safari
  // Safari doesn't support updating state more than 30 times within 30 seconds in the History API
  window.navigation.updateCurrentEntry({
    state: {
      // we should store previous state, almost all router frameworks rely on this
      ...(previousState as object),
      scrollPosition,
    },
  });
}
