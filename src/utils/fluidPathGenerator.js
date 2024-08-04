import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { createNoise2D } from 'simplex-noise';

export const generateFluidPath = (svgPath, numPoints = 200, noiseScale = 0, seed = Math.random()) => {
  const loader = new SVGLoader();
  const svgData = loader.parse(`<svg><path d="${svgPath}"/></svg>`);
  const path = svgData.paths[0];

  const extractedPoints = [];
  path.subPaths.forEach((subPath) => {
    const points = subPath.getPoints();
    extractedPoints.push(...points);
  });

  const box = new THREE.Box2();
  extractedPoints.forEach(point => box.expandByPoint(point));
  const center = box.getCenter(new THREE.Vector2());
  const size = box.getSize(new THREE.Vector2());
  const scale = 1 / Math.max(size.x, size.y);

  const normalizedPoints = extractedPoints.map(point => 
    new THREE.Vector2().subVectors(point, center).multiplyScalar(scale)
  );

  const noise2D = createNoise2D(() => seed);
  const fluidPoints = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const index = Math.floor(t * (normalizedPoints.length - 1));
    const pointA = normalizedPoints[index];
    const pointB = normalizedPoints[Math.min(index + 1, normalizedPoints.length - 1)];
    
    const lerpedPoint = new THREE.Vector2().lerpVectors(pointA, pointB, t * (normalizedPoints.length - 1) % 1);
    
    const noiseX = noise2D(t * 10, 0) * noiseScale;
    const noiseY = noise2D(0, t * 10) * noiseScale;
    
    // Apply a more interesting distortion effect
    const distortionX = Math.sin(t * Math.PI * 4) * noiseScale * 0.5;
    const distortionY = Math.cos(t * Math.PI * 6) * noiseScale * 0.5;
    
    fluidPoints.push(new THREE.Vector3(
      lerpedPoint.x + noiseX + distortionX,
      lerpedPoint.y + noiseY + distortionY,
      0
    ));
  }

  return fluidPoints;
};

export const createFluidPathGeometry = (points, lineWidth) => {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.curveType = 'centripetal';
  curve.tension = 0.5;

  // Increase the number of tube segments for smoother curves
  const tubularSegments = points.length * 4;
  
  // Increase the radial segments for smoother tube surface
  const radialSegments = 16;

  return new THREE.TubeGeometry(curve, tubularSegments, lineWidth / 2, radialSegments, false);
};

// New function to smooth out sharp corners
export const smoothPath = (points, smoothness = 0.5) => {
  const smoothedPoints = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[i - 1] || points[i];
    const current = points[i];
    const next = points[i + 1] || points[i];

    const smoothed = new THREE.Vector3()
      .add(prev)
      .add(current.multiplyScalar(smoothness))
      .add(next)
      .divideScalar(2 + smoothness);

    smoothedPoints.push(smoothed);
  }
  return smoothedPoints;
};