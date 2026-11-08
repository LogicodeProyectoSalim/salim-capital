// Genera el mapa de puntos (España → Golfo) usado en la portada.
// Se ejecuta una vez (npm run map) y el resultado se guarda en src/partials/map.svg.
import { readFileSync, writeFileSync } from "node:fs";
import { geoEquirectangular, geoContains } from "d3-geo";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-50m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);

const W = 640;
const H = 340;
const bounds = { west: -12, east: 60, north: 47, south: 13 };
const projection = geoEquirectangular().scale(1).translate([0, 0]);
// Ajusta la proyección al recuadro geográfico.
const [x0, y0] = projection([bounds.west, bounds.north]);
const [x1, y1] = projection([bounds.east, bounds.south]);
const k = Math.min(W / (x1 - x0), H / (y1 - y0));
projection.scale(k).translate([-x0 * k, -y0 * k]);

const step = 0.8; // grados entre puntos
const segs = [];
for (let lat = bounds.north; lat >= bounds.south; lat -= step) {
  for (let lon = bounds.west; lon <= bounds.east; lon += step) {
    if (geoContains(land, [lon, lat])) {
      const [x, y] = projection([lon, lat]);
      segs.push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
    }
  }
}

const cities = {
  madrid: [-3.7, 40.42],
  riyadh: [46.68, 24.71],
  doha: [51.53, 25.29],
  dubai: [55.27, 25.2],
};
const p = Object.fromEntries(Object.entries(cities).map(([k2, c]) => [k2, projection(c).map((n) => +n.toFixed(1))]));
const [mx, my] = p.madrid;
const [dx, dy] = p.dubai;
const cx = (mx + dx) / 2;
const cy = Math.min(my, dy) - 110;

const svg = `<svg class="map" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path class="map-land" d="${segs.join("")}"/>
  <path class="map-arc" d="M${mx} ${my} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${dx} ${dy}"/>
  <circle class="map-city map-city--gulf" cx="${p.riyadh[0]}" cy="${p.riyadh[1]}" r="3.5"/>
  <circle class="map-city map-city--gulf" cx="${p.doha[0]}" cy="${p.doha[1]}" r="3.5"/>
  <circle class="map-node" cx="${dx}" cy="${dy}" r="7"/>
  <circle class="map-node" cx="${mx}" cy="${my}" r="7"/>
</svg>
`;
writeFileSync(new URL("../src/partials/map.svg", import.meta.url), svg);
writeFileSync(
  new URL("../src/partials/map-points.json", import.meta.url),
  JSON.stringify({ madrid: p.madrid, dubai: p.dubai, width: W, height: H }, null, 2) + "\n",
);
console.log(`map.svg: ${segs.length} puntos, Madrid ${p.madrid}, Dubái ${p.dubai}`);
