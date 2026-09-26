import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import districtGeoJsonText from '../data/geo/jharkhand-districts.geojson?raw';
import { getDistrictStats } from '../data/dashboardMockData';

const geoJson = JSON.parse(districtGeoJsonText);
const aliases = { 'Saraikela-Kharsawan': 'Saraikela Kharsawan' };
const severityClass = { Critical: 'very-high', High: 'high', Medium: 'medium', Low: 'low' };
function eachPoint(coordinates, visit) {
  if (typeof coordinates[0] === 'number') visit(coordinates);
  else coordinates.forEach((entry) => eachPoint(entry, visit));
}
const allPoints = [];
geoJson.features.forEach((feature) =>
  eachPoint(feature.geometry.coordinates, (point) => allPoints.push(point))
);
const bounds = {
  minX: Math.min(...allPoints.map(([x]) => x)),
  maxX: Math.max(...allPoints.map(([x]) => x)),
  minY: Math.min(...allPoints.map(([, y]) => y)),
  maxY: Math.max(...allPoints.map(([, y]) => y)),
};
const pad = 18;
const project = ([longitude, latitude]) => [
  pad + ((longitude - bounds.minX) / (bounds.maxX - bounds.minX)) * (1000 - pad * 2),
  700 - pad - ((latitude - bounds.minY) / (bounds.maxY - bounds.minY)) * (700 - pad * 2),
];
function ringPath(ring) {
  return (
    ring.map((point, index) => `${index ? 'L' : 'M'}${project(point).join(' ')}`).join(' ') + 'Z'
  );
}
function featurePath(feature) {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map(ringPath)).join(' ');
}
function featureCentroid(feature) {
  const points = [];
  eachPoint(feature.geometry.coordinates, (point) => points.push(project(point)));
  return points.reduce(
    (sum, point) => [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length],
    [0, 0]
  );
}

export default function JharkhandDistrictMap({
  problems,
  category,
  onCategoryChange,
  selectedDistrict,
  onDistrictChange,
  categories,
}) {
  const [period, setPeriod] = useState('All time'),
    [scale, setScale] = useState(1);
  const filteredProblems = useMemo(() => {
    const filtered =
      category === 'All categories'
        ? problems
        : problems.filter((problem) => problem.category === category);
    const cutoff =
      period === 'Last 30 days' ? '2026-08-14' : period === 'Last 90 days' ? '2026-06-15' : null;
    return cutoff ? filtered.filter((problem) => problem.reported_at >= cutoff) : filtered;
  }, [category, period, problems]);
  const detail = getDistrictStats(selectedDistrict, filteredProblems);
  return (
    <article id="map" className="dashboard-card map-card">
      <div className="card-heading">
        <div>
          <span>STATEWIDE VIEW</span>
          <h2>
            Problem Hotspot Map <small>(Jharkhand)</small>
          </h2>
        </div>
        <div className="map-filters">
          <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            {['All categories', ...categories.map((item) => item.category)].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option>All time</option>
            <option>Last 90 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>
      <div className="map-viewport real-map-viewport">
        <div className="map-legend">
          <b>HOTSPOT SEVERITY</b>
          <span>
            <i className="very-high" />
            Very High
          </span>
          <span>
            <i className="high" />
            High
          </span>
          <span>
            <i className="medium" />
            Medium
          </span>
          <span>
            <i className="low" />
            Low
          </span>
        </div>
        <svg
          className="jharkhand-svg"
          viewBox="0 0 1000 700"
          role="img"
          aria-label="Jharkhand map with 24 district boundaries"
        >
          <g transform={`translate(500 350) scale(${scale}) translate(-500 -350)`}>
            {geoJson.features.map((feature) => {
              const label = feature.properties.district,
                district = aliases[label] || label,
                [x, y] = featureCentroid(feature);
              return (
                <g key={label} className="district-group">
                  <path
                    d={featurePath(feature)}
                    className={`district-boundary ${selectedDistrict === district ? 'selected' : ''}`}
                    onClick={() => onDistrictChange(district)}
                  >
                    <title>{district}</title>
                  </path>
                  <text
                    x={x}
                    y={y}
                    className="district-label"
                    onClick={() => onDistrictChange(district)}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
            {filteredProblems.map((problem) => {
              const [x, y] = project([problem.longitude, problem.latitude]);
              return (
                <g
                  className="map-marker"
                  key={problem.id}
                  transform={`translate(${x} ${y})`}
                  onClick={() => onDistrictChange(problem.district)}
                >
                  <circle
                    className={`marker-pulse ${severityClass[problem.severity]}`}
                    r={problem.severity === 'Critical' ? 15 : 12}
                  />
                  <circle className={`marker-core ${severityClass[problem.severity]}`} r="6">
                    <title>{`${problem.district}: ${problem.severity} severity`}</title>
                  </circle>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="map-zoom">
          <button onClick={() => setScale(Math.min(1.7, scale + 0.15))} aria-label="Zoom in">
            <Plus size={17} />
          </button>
          <button onClick={() => setScale(Math.max(0.75, scale - 0.15))} aria-label="Zoom out">
            <Minus size={17} />
          </button>
        </div>
        <aside className="district-detail">
          <b>{selectedDistrict}</b>
          <span>{detail.problems} reported problems</span>
          <div>
            <strong>{detail.critical}</strong>
            <small>Very high</small>
            <strong>{detail.resolved}</strong>
            <small>Resolved</small>
          </div>
          <small>{detail.people.toLocaleString()} people potentially impacted</small>
        </aside>
      </div>
    </article>
  );
}
