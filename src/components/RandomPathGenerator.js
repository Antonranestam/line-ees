import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import Controls from './Controls';
import { generateFluidPath, createFluidPathGeometry, smoothPath } from '../utils/fluidPathGenerator';
import { getPathByName, getPathNames } from '../assets/svgPaths';

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

  const colors = ['#008967', '#2458d4', '#eb4836', '#f3b2d1', '#f4bb54', '#ea4b36'];

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

  const createGradientMaterial = useCallback((colors) => {
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
  }, []);

  const createSolidColorMaterial = useCallback((color) => {
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
        varying vec3 vNormal;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.FrontSide,
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
    const gradientMaterial = createGradientMaterial(colors);

    const tubeMesh = new THREE.Mesh(geometry, gradientMaterial);

    const sphereGeometry = new THREE.SphereGeometry(lineWidth / 2, 16, 16);
    
    const startSphereMaterial = createSolidColorMaterial(colors[0]);
    const endSphereMaterial = createSolidColorMaterial(colors[colors.length - 1]);
    
    const startSphere = new THREE.Mesh(sphereGeometry, startSphereMaterial);
    const endSphere = new THREE.Mesh(sphereGeometry, endSphereMaterial);

    const curve = new THREE.CatmullRomCurve3(smoothedPoints);
    startSphere.position.copy(curve.getPointAt(0));
    endSphere.position.copy(curve.getPointAt(1));

    const pathGroup = new THREE.Group();
    pathGroup.add(tubeMesh);
    pathGroup.add(startSphere);
    pathGroup.add(endSphere);

    pathGroup.scale.set(scale, scale * A4_RATIO, 1);
    pathGroup.rotation.z = rotation * Math.PI / 180; // Convert degrees to radians
    sceneRef.current.add(pathGroup);

    pathRef.current = pathGroup;
    renderScene();
  }, [selectedPath, noiseScale, scale, lineWidth, rotation, randomSeed, smoothness, colors, createGradientMaterial, createSolidColorMaterial, renderScene]);

  useEffect(() => {
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      generateFluidPathMesh();
    }
  }, [generateFluidPathMesh]);

  const randomizePath = () => {
    setRandomSeed(Math.random());
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
          onRandomize={randomizePath}
          onRegenerate={generateFluidPathMesh}
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