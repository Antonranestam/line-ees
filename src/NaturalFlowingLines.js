import * as THREE from 'three';

const NaturalFlowingLines = {
  generatePath: (options = {}) => {
    const {
      numPoints = 100,
      smoothness = 0.5,
      curviness = 0.5,
      width = 1,
      height = 1,
      depth = 0.2,
      closed = false,
    } = options;

    // Generate initial control points
    const controlPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const angle = t * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.2; // Vary the radius for more organic shapes
      const x = Math.cos(angle) * radius * width;
      const y = Math.sin(angle) * radius * height;
      const z = (Math.random() - 0.5) * depth;
      controlPoints.push(new THREE.Vector3(x, y, z));
    }

    // Apply smoothing
    const smoothedPoints = smoothCurve(controlPoints, smoothness, closed);

    // Create the curve
    const curve = new THREE.CatmullRomCurve3(smoothedPoints);
    curve.curveType = 'centripetal';
    curve.tension = curviness;
    curve.closed = closed;

    return curve;
  },

  createTubeMesh: (curve, options = {}) => {
    const {
      tubeSegments = 200,
      radius = 0.01,
      radialSegments = 8,
      colors = ['#008967', '#2458d4', '#eb4836', '#f3b2d1', '#f4bb54', '#ea4b36'],
    } = options;

    const tubeGeometry = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false);
    const gradientMaterial = createGradientMaterial(colors);
    const tubeMesh = new THREE.Mesh(tubeGeometry, gradientMaterial);

    return tubeMesh;
  },
};

function smoothCurve(points, smoothness, closed) {
  const smoothedPoints = [];
  const pointCount = points.length;
  const smoothFactor = smoothness * 0.5;

  for (let i = 0; i < pointCount; i++) {
    const p0 = points[(i - 1 + pointCount) % pointCount];
    const p1 = points[i];
    const p2 = points[(i + 1) % pointCount];

    const x = p1.x + (p2.x - p0.x) * smoothFactor;
    const y = p1.y + (p2.y - p0.y) * smoothFactor;
    const z = p1.z + (p2.z - p0.z) * smoothFactor;

    smoothedPoints.push(new THREE.Vector3(x, y, z));
  }

  if (!closed) {
    // Adjust end points
    smoothedPoints[0].copy(points[0]);
    smoothedPoints[pointCount - 1].copy(points[pointCount - 1]);
  }

  return smoothedPoints;
}

function createGradientMaterial(colors) {
  return new THREE.ShaderMaterial({
    uniforms: {
      colors: { value: colors.map(color => new THREE.Color(color)) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colors[${colors.length}];
      varying vec2 vUv;
      
      vec3 getGradientColor(float t) {
        float stepSize = 1.0 / ${colors.length - 1}.0;
        for (int i = 0; i < ${colors.length - 1}; i++) {
          if (t < float(i + 1) * stepSize) {
            return mix(colors[i], colors[i + 1], smoothstep(0.0, 1.0, (t - float(i) * stepSize) / stepSize));
          }
        }
        return colors[${colors.length - 1}];
      }
      
      void main() {
        vec3 color = getGradientColor(vUv.x);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

export default NaturalFlowingLines;