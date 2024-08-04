// pathGenerator.js
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

const shapeParams = {
  circle: { a: 1, b: 1, freq: 1 },
  ellipse: { a: 1, b: 0.6, freq: 1 },
  figureEight: { a: 1, b: 1, freq: 2 },
  trefoil: { a: 1, b: 1, freq: 3 },
};

export const generatePath = (shape, noiseScale, numPoints = 100, maxRadius = 0.45) => {
  const points = [];
  const selectedShape = shapeParams[shape];

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = Math.PI * 2 * t * selectedShape.freq;
    
    const x = selectedShape.a * Math.cos(angle) * maxRadius;
    const y = selectedShape.b * Math.sin(angle) * maxRadius;

    const noiseX = noise2D(t * 10, 0) * noiseScale;
    const noiseY = noise2D(0, t * 10) * noiseScale;

    points.push(new THREE.Vector3(x + noiseX, y + noiseY, 0));
  }

  return points;
};

export const createPathGeometry = (points, lineWidth) => {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.curveType = 'catmullrom';
  curve.tension = 0.5;

  return new THREE.TubeGeometry(curve, points.length * 10, lineWidth / 2, 8, false);
};