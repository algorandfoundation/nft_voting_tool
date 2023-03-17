import { useEffect, useRef } from "react";

const env = process.env.NODE_ENV;
/**
 * `useEffect` that does not fire on the first render
 */
export const useSubsequentRendersEffect = (effect: React.EffectCallback, deps?: React.DependencyList) => {
  const renders = useRef(0);
  useEffect(() => {
    // React.StrictMode renders components twice in development mode
    const runEffectAfterRenderNumber = env === "development" ? 2 : 1;
    if (renders.current >= runEffectAfterRenderNumber) {
      return effect();
    }
    renders.current += 1;
    return undefined;
  }, deps);
};
