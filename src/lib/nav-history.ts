import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

const MAX_TRACKED = 12;
const visited: string[] = [];

function recordPath(pathname: string) {
  if (visited[visited.length - 1] === pathname) return;
  visited.push(pathname);
  if (visited.length > MAX_TRACKED) visited.shift();
}

export function useNavTracker() {
  const router = useRouter();
  useEffect(() => {
    recordPath(router.state.location.pathname);
    const unsub = router.subscribe("onResolved", ({ toLocation }) => {
      recordPath(toLocation.pathname);
    });
    return unsub;
  }, [router]);
}

export function stepsToUsefulBackTarget(current: string, skip: string[]): number | null {
  for (let i = visited.length - 2; i >= 0; i--) {
    const path = visited[i];
    if (path === current || skip.includes(path)) continue;
    return visited.length - 1 - i;
  }
  return null;
}
