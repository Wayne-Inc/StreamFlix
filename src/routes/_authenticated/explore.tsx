import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/explore")({
  component: ExploreLayout,
});

function ExploreLayout() {
  return <Outlet />;
}
