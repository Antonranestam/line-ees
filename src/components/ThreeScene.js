// ThreeScene.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { generatePath, createPathGeometry } from '../utils/pathGenerator';

const ThreeScene = ({ shape, noiseScale }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color('#ece7e3');
    
    const aspectRatio = width / height;
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
      const aspectRatio = width / height;
      cameraRef.current.left = frustumSize * aspectRatio / -2;
      cameraRef.current.right = frustumSize * aspectRatio / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = frustumSize / -2;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    generateAndRenderPath();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    generateAndRenderPath();
  }, [shape, noiseScale]);

  const generateAndRenderPath = () => {
    if (pathRef.current) {
      sceneRef.current.remove(pathRef.current);
      pathRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    const points = generatePath(shape, noiseScale);
    const geometry = createPathGeometry(points, 0.01);
    const material = createGradientMaterial();

    pathRef.current = new THREE.Mesh(geometry, material);
    pathRef.current.scale.set(0.9, 0.9 * (297 / 210), 1); // Scale to fit A4 ratio
    sceneRef.current.add(pathRef.current);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const createSphereEndMaterial = (color) => {
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, 1.0) * intensity;
        }
      `,
      side: THREE.FrontSide,
    });
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

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }}></div>;
};

export default ThreeScene;
