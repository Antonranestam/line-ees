import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import Controls from './Controls';

const RandomPathGenerator = () => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [path, setPath] = useState(null);

  const [shape, setShape] = useState('circle');
  const [noiseScale, setNoiseScale] = useState(0.1);

  const colors = ['#008967', '#2458d4', '#eb4836', '#f3b2d1', '#f4bb54', '#ea4b36'];
  const A4_RATIO = 297 / 210; // height / width
  const LINE_WIDTH = 0.15; // Adjusted for better visibility
  const CURVE_POINTS = 200; // Reduced for a shorter path
  const CONTROL_POINTS = 8; // Reduced number of control points
  const PPI = 300; // Pixels per inch for print quality
  const CANVAS_BORDER = 0.2;

  const noise2D = createNoise2D();

  useEffect(() => {
    let animationFrameId;

    const setup = () => {
      if (!mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      const newScene = new THREE.Scene();
      newScene.background = new THREE.Color('#ece7e3');
      
      const aspectRatio = width / height;
      const frustumSize = 1.2;
      const newCamera = new THREE.OrthographicCamera(
        frustumSize * aspectRatio / -2,
        frustumSize * aspectRatio / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      
      const newRenderer = new THREE.WebGLRenderer({ antialias: true });
      newRenderer.setPixelRatio(window.devicePixelRatio * (PPI / 96));
      newRenderer.setSize(width, height);
      mountRef.current.appendChild(newRenderer.domElement);
      newCamera.position.z = 1;

      setScene(newScene);
      setCamera(newCamera);
      rendererRef.current = newRenderer;

      const handleResize = () => {
        if (!mountRef.current || !newRenderer || !newCamera) return;
        
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        newRenderer.setSize(width, height);
        const aspectRatio = width / height;
        newCamera.left = frustumSize * aspectRatio / -2;
        newCamera.right = frustumSize * aspectRatio / 2;
        newCamera.top = frustumSize / 2;
        newCamera.bottom = frustumSize / -2;
        newCamera.updateProjectionMatrix();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (mountRef.current && newRenderer.domElement) {
          mountRef.current.removeChild(newRenderer.domElement);
        }
        newRenderer.dispose();
      };
    };

    const cleanup = setup();

    return () => {
      if (cleanup) cleanup();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (scene && camera && rendererRef.current) {
      generateFluidPath();
      animate();
    }
  }, [scene, camera, shape, noiseScale]);

  const generateFluidPath = () => {
    if (path) {
      scene.remove(path);
      path.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    const curvePoints = generateSmoothControlPoints();
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.curveType = 'catmullrom';
    curve.tension = 0.5;

    const tubeGeometry = new THREE.TubeGeometry(curve, CURVE_POINTS, LINE_WIDTH / 2, 8, false);
    const gradientMaterial = createGradientMaterial(colors);

    const tubeMesh = new THREE.Mesh(tubeGeometry, gradientMaterial);

    // Create spheres for rounded endpoints
    const sphereGeometry = new THREE.SphereGeometry(LINE_WIDTH / 2, 16, 16);
    
    const startSphereMaterial = createSphereEndMaterial(colors, 0);
    const endSphereMaterial = createSphereEndMaterial(colors, 1);
    
    const startSphere = new THREE.Mesh(sphereGeometry, startSphereMaterial);
    const endSphere = new THREE.Mesh(sphereGeometry, endSphereMaterial);

    startSphere.position.copy(curve.getPointAt(0));
    endSphere.position.copy(curve.getPointAt(1));

    const pathGroup = new THREE.Group();
    pathGroup.add(tubeMesh);
    pathGroup.add(startSphere);
    pathGroup.add(endSphere);

    pathGroup.scale.set(0.9, 0.9 * A4_RATIO, 1); // Scale to fit A4 ratio
    scene.add(pathGroup);

    setPath(pathGroup);
  };

  const createGradientMaterial = (colors) => {
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
  };

  const createSphereEndMaterial = (colors, endPosition) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        colors: { value: colors.map(color => new THREE.Color(color)) },
        endPosition: { value: endPosition },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float endPosition;
        void main() {
          vUv = vec2(endPosition, 0.5);
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
      side: THREE.FrontSide,
    });
  };

  const generateSmoothControlPoints = () => {
    const points = [];
    const angleStep = (Math.PI * 2) / CONTROL_POINTS;
    let angle = Math.random() * Math.PI * 2;

    const maxRadius = 0.5 - CANVAS_BORDER;
    const minRadius = 0.2;

    for (let i = 0; i < CONTROL_POINTS; i++) {
      const t = i / (CONTROL_POINTS - 1);
      const baseRadius = minRadius + (maxRadius - minRadius) * Math.sin(t * Math.PI);
      const radius = baseRadius + noise2D(t, 0) * noiseScale;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * A4_RATIO;
      points.push(new THREE.Vector3(x, y, 0));
      angle += angleStep + (noise2D(t, 1) - 0.5) * angleStep * 0.5;
    }

    return points;
  };

  const animate = () => {
    if (rendererRef.current && scene && camera) {
      rendererRef.current.render(scene, camera);
    }
    requestAnimationFrame(animate);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '80vmin', height: `${80 * A4_RATIO}vmin`, border: '1px solid #ccc' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%' }}></div>
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.7)', padding: '5px', borderRadius: '3px' }}>
          A4 Poster
        </div>
      </div>
      <Controls
        shape={shape}
        setShape={setShape}
        noiseScale={noiseScale}
        setNoiseScale={setNoiseScale}
        onRegenerate={generateFluidPath}
      />
    </div>
  );
};

export default RandomPathGenerator;