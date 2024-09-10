import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import Controls from './Controls';
import { generateFluidPath, createFluidPathGeometry, smoothPath } from '../utils/fluidPathGenerator';
import { getPathByName, getPathNames } from '../assets/svgPaths';
import { getRandomGradient, getGradientByName, getAllGradientNames } from '../utils/gradients';

const A4_RATIO = 210 / 297; // Width / Height for portrait orientation

const RandomPathGenerator = () => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const pathRef = useRef(null);

  const [selectedPath, setSelectedPath] = useState(getPathNames()[0]);
  const [noiseScale, setNoiseScale] = useState(0);
  const [scale, setScale] = useState(0.9);
  const [lineWidth, setLineWidth] = useState(0.2);
  const [rotation, setRotation] = useState(0);
  const [randomSeed, setRandomSeed] = useState(Math.random());
  const [smoothness, setSmoothness] = useState(1);
  const [selectedGradient, setSelectedGradient] = useState(getRandomGradient().name);

  const renderScene = useCallback(() => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  const setup = useCallback(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color('#ece7e3');
    
    const aspectRatio = A4_RATIO;
    const frustumSize = 1.2;
    cameraRef.current = new THREE.OrthographicCamera(
      frustumSize * aspectRatio / -2,
      frustumSize * aspectRatio / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    cameraRef.current.position.z = 1;
    
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(width, height);
    mountRef.current.appendChild(rendererRef.current.domElement);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      renderScene();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    };
  }, [renderScene]);

  useEffect(() => {
    const cleanup = setup();
    return cleanup;
  }, [setup]);

  const createGradientMaterial = useCallback((gradientName) => {
    const gradient = getGradientByName(gradientName);
    const colors = gradient.colors.map(color => new THREE.Color(color));

    return new THREE.ShaderMaterial({
      uniforms: {
        colors: { value: colors },
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
  }, []);

  const createColorShaderMaterial = useCallback((color) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, []);

  const generateFluidPathMesh = useCallback(() => {
    if (pathRef.current) {
      sceneRef.current.remove(pathRef.current);
      pathRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    const svgPath = getPathByName(selectedPath);
    const fluidPoints = generateFluidPath(svgPath, 200, noiseScale, randomSeed);
    const smoothedPoints = smoothPath(fluidPoints, smoothness);
    const geometry = createFluidPathGeometry(smoothedPoints, lineWidth);
    const gradientMaterial = createGradientMaterial(selectedGradient);

    const tubeMesh = new THREE.Mesh(geometry, gradientMaterial);

    const gradient = getGradientByName(selectedGradient);
    const startColor = gradient.colors[0];
    const endColor = gradient.colors[gradient.colors.length - 1];

    const createColoredSphere = (color, position) => {
      const sphereGeometry = new THREE.SphereGeometry(lineWidth / 2, 32, 32);
      const sphereMaterial = createColorShaderMaterial(color);
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(position);
      return sphere;
    };

    const curve = new THREE.CatmullRomCurve3(smoothedPoints);
    const startSphere = createColoredSphere(startColor, curve.getPointAt(0));
    const endSphere = createColoredSphere(endColor, curve.getPointAt(1));

    const pathGroup = new THREE.Group();
    pathGroup.add(tubeMesh);
    pathGroup.add(startSphere);
    pathGroup.add(endSphere);

    pathGroup.scale.set(scale, scale * A4_RATIO, 1);
    pathGroup.rotation.z = rotation * Math.PI / 180; // Convert degrees to radians
    sceneRef.current.add(pathGroup);

    pathRef.current = pathGroup;
    renderScene();
  }, [selectedPath, noiseScale, scale, lineWidth, rotation, randomSeed, smoothness, selectedGradient, createGradientMaterial, createColorShaderMaterial, renderScene]);

  useEffect(() => {
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      generateFluidPathMesh();
    }
  }, [generateFluidPathMesh]);

  const randomizeScaleLineWidthRotation = () => {
    setScale(Math.random() * 0.8 + 0.5); // Random scale between 0.5 and 1.3
    setLineWidth(Math.random() * 0.3 + 0.05); // Random line width between 0.05 and 0.35
    setRotation(Math.random() * 360); // Random rotation between 0 and 360 degrees
  };

  const randomizeAll = () => {
    setRandomSeed(Math.random());
    setSelectedGradient(getRandomGradient().name);
    randomizeScaleLineWidthRotation();
  };

  return (
    <div style={styles.container}>
      <div style={styles.posterContainer}>
        <div ref={mountRef} style={styles.canvas}></div>
        <div style={styles.posterLabel}>A4 Poster</div>
      </div>
      <div style={styles.controlsContainer}>
        <Controls
          selectedPath={selectedPath}
          setSelectedPath={setSelectedPath}
          noiseScale={noiseScale}
          setNoiseScale={setNoiseScale}
          scale={scale}
          setScale={setScale}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          rotation={rotation}
          setRotation={setRotation}
          smoothness={smoothness}
          setSmoothness={setSmoothness}
          selectedGradient={selectedGradient}
          setSelectedGradient={setSelectedGradient}
          gradientNames={getAllGradientNames()}
          onRandomize={randomizeAll}
          onRegenerate={generateFluidPathMesh}
          onRandomizeScaleLineWidthRotation={randomizeScaleLineWidthRotation}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
  },
  posterContainer: {
    position: 'relative',
    width: '60%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  },
  canvas: {
    height: '90%',
    aspectRatio: A4_RATIO,
    maxWidth: '100%',
    border: '1px solid #ccc',
  },
  posterLabel: {
    position: 'absolute',
    top: '30px',
    left: '10%',
    background: 'rgba(255,255,255,0.7)',
    padding: '5px',
    borderRadius: '3px',
  },
  controlsContainer: {
    width: '40%',
    height: '100%',
    overflowY: 'auto',
    padding: '20px',
    boxSizing: 'border-box',
  },
};

export default RandomPathGenerator;