import type { Map as MapLibreMap } from "maplibre-gl";

const active = new WeakMap<MapLibreMap, () => void>();

export function cancelPinDrop(map: MapLibreMap) {
  active.get(map)?.();
  active.delete(map);
}

export function dropPins(map: MapLibreMap) {
  cancelPinDrop(map);
  if (!map.getLayer("unclustered")) return;
  map.setPaintProperty("unclustered", "icon-translate-transition", { duration: 0 });
  map.setPaintProperty("unclustered", "icon-opacity-transition", { duration: 0 });
  map.setPaintProperty("unclustered", "icon-translate-anchor", "viewport");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    map.setPaintProperty("unclustered", "icon-translate", [0, 0]);
    map.setPaintProperty("unclustered", "icon-opacity", 1);
    return;
  }

  let frame = 0;
  let started = false;
  let stopped = false;
  const cleanup = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    map.off("sourcedata", onData);
    map.off("idle", begin);
  };
  const begin = () => {
    if (started || stopped) return;
    started = true;
    map.off("sourcedata", onData);
    map.off("idle", begin);
    const start = performance.now();
    const tick = (now: number) => {
      if (stopped || !map.getLayer("unclustered")) return;
      const progress = Math.min(1, (now - start) / 580);
      const t = progress - 1;
      // A short overshoot gives the pin a small bounce at its destination.
      const eased = 1 + 2.15 * t * t * t + 1.15 * t * t;
      map.setPaintProperty("unclustered", "icon-translate", [0, -56 * (1 - eased)]);
      map.setPaintProperty("unclustered", "icon-opacity", Math.min(1, progress * 5));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else {
        map.setPaintProperty("unclustered", "icon-translate", [0, 0]);
        active.delete(map);
      }
    };
    frame = requestAnimationFrame(tick);
  };
  const onData = (event: { sourceId?: string; isSourceLoaded?: boolean }) => {
    if (event.sourceId === "places" && event.isSourceLoaded) begin();
  };
  active.set(map, cleanup);
  map.setPaintProperty("unclustered", "icon-translate", [0, -56]);
  map.setPaintProperty("unclustered", "icon-opacity", 0);
  map.on("sourcedata", onData);
  map.on("idle", begin);
  if (map.isSourceLoaded("places")) begin();
}
