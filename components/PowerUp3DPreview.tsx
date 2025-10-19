import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface PowerUp3DPreviewProps {
  type: 'shield' | 'boost' | 'bonus' | 'multishot' | 'timefreeze' | 'magnet' | 'invisibility';
  size?: number;
}

const PowerUp3DPreview: React.FC<PowerUp3DPreviewProps> = ({ type, size = 0.8 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const meshRef = useRef<THREE.Mesh>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(50, 50);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Create lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Create power-up mesh based on type
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let mesh: THREE.Mesh;

    switch (type) {
      case 'shield':
        geometry = new THREE.OctahedronGeometry(size, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x00ffff,
          emissive: 0x002222,
          shininess: 100,
          specular: 0x00ffff
        });
        break;
      case 'boost':
        geometry = new THREE.TetrahedronGeometry(size, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xffff00,
          emissive: 0x222200,
          shininess: 100,
          specular: 0xffff00
        });
        break;
      case 'bonus':
        geometry = new THREE.BoxGeometry(size * 1.2, size * 1.2, size * 1.2);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x00ff00,
          emissive: 0x002200,
          shininess: 100,
          specular: 0x00ff00
        });
        break;
      case 'multishot':
        geometry = new THREE.TorusGeometry(size * 0.6, size * 0.2, 8, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0xff6600,
          emissive: 0x221100,
          shininess: 100,
          specular: 0xff6600
        });
        break;
      case 'timefreeze':
        geometry = new THREE.IcosahedronGeometry(size, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x0066ff,
          emissive: 0x001122,
          shininess: 100,
          specular: 0x0066ff
        });
        break;
      case 'magnet':
        geometry = new THREE.TorusGeometry(size * 0.6, size * 0.2, 8, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x00ff00,
          emissive: 0x002200,
          shininess: 100,
          specular: 0x00ff00
        });
        break;
      case 'invisibility':
        geometry = new THREE.DodecahedronGeometry(size, 0);
        material = new THREE.MeshPhongMaterial({ 
          color: 0x8800ff,
          emissive: 0x220044,
          shininess: 100,
          specular: 0x8800ff
        });
        break;
      default:
        geometry = new THREE.BoxGeometry(size, size, size);
        material = new THREE.MeshPhongMaterial({ color: 0x888888 });
    }

    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: (material as any).color || 0x888888,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.01;
        meshRef.current.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    };
  }, [type, size]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '50px', 
        height: '50px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }} 
    />
  );
};

export default PowerUp3DPreview;
