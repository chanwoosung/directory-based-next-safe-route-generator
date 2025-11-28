"use client";

import type { LinkProps } from "next/link";
import Link from 'next/link'
import { useRouter as useAppRouter } from "next/navigation";
import { useRouter as usePageRouter } from "next/router";
import { ReactNode } from 'react';

interface RouteBase {
    path: string;
    params?: Record<string, any>;
}

type PathOf<R extends RouteBase> = R["path"];

type RouteByPath<
  R extends RouteBase,
  Path extends PathOf<R>
> = Extract<R, { path: Path }>;

type ParamsFor<
  R extends RouteBase,
  Path extends PathOf<R>
> = RouteByPath<R, Path> extends { params: infer P } ? P : never;

type RouteArg<
  R extends RouteBase,
  Path extends PathOf<R>
> = ParamsFor<R, Path> extends never
  ? { path: Path }
  : { path: Path; params: ParamsFor<R, Path> };

export type SafeRouter<AllRoutes extends RouteBase> = {
  push<Path extends PathOf<AllRoutes>>(route: RouteArg<AllRoutes, Path>): void;
  replace<Path extends PathOf<AllRoutes>>(route: RouteArg<AllRoutes, Path>): void;
  back(): void;
};

function detectRouterEnv() {
  if (typeof window === "undefined") return "server";
  try {
    const appRouter = require("next/navigation");
    if (appRouter.useRouter) return "app";
  } catch {}
  try {
    const pageRouter = require("next/router");
    if (pageRouter.useRouter) return "pages";
  } catch {}
  return "unknown";
}

function resolvePath<
  AllRoutes extends RouteBase,
  Path extends PathOf<AllRoutes>
>(route: RouteArg<AllRoutes, Path>): string {
  let path = route.path as string;
  if ("params" in route && route.params) {
    for (const [k, v] of Object.entries(
      route.params as Record<string, unknown>
    )) {
      path = path.replace(`$${k}`, String(v));
    }
  }
  return path;
}

export function safeRedirect<AllRoutes extends RouteBase>() {
  return function <Path extends PathOf<AllRoutes>>(
    route: RouteArg<AllRoutes, Path>
  ) {
    const finalPath = resolvePath<AllRoutes, Path>(route);
    const { redirect: appRedirect } = require("next/navigation");
    return appRedirect(finalPath);
  };
}

// 훅도 동일한 방식으로 제네릭 AllRoutes를 받음
export function useSafeRouter<AllRoutes extends RouteBase>(): SafeRouter<AllRoutes> {
  const env = detectRouterEnv();

  if (env === "app") {
    const router = useAppRouter();
    return createSafeRouter<AllRoutes>(router);
  }

  if (env === "pages") {
    const router = usePageRouter();
    return createSafeRouter<AllRoutes>(router);
  }

  return {
    push: () =>
      console.warn("SafeRouter is only available in app/page routers"),
    replace: () =>
      console.warn("SafeRouter is only available in app/page routers"),
    back: () => {},
  } as SafeRouter<AllRoutes>;
}

function createSafeRouter<AllRoutes extends RouteBase>(
  router: any
): SafeRouter<AllRoutes> {
  return {
    push<Path extends PathOf<AllRoutes>>(route: RouteArg<AllRoutes, Path>) {
      router.push(resolvePath<AllRoutes, Path>(route));
    },
    replace<Path extends PathOf<AllRoutes>>(route: RouteArg<AllRoutes, Path>) {
      router.replace(resolvePath<AllRoutes, Path>(route));
    },
    back() {
      router.back();
    },
  };
}

export function createSafeLink<AllRoutes extends RouteBase>() {
  return function SafeLinkTyped<Path extends PathOf<AllRoutes>>(
    props: Omit<LinkProps, "href"> & {
      route: RouteArg<AllRoutes, Path>;
      children?: ReactNode;
    }
  ) {
    const { route, ...rest } = props;
    const href = resolvePath<AllRoutes, Path>(route);
    return <Link {...rest} href={href} />;
  };
}