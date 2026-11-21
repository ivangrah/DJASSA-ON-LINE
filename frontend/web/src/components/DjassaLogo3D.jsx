import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { Environment, Float, Sparkles, ContactShadows, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import gsap from 'gsap';

function ExtrudedLogoMesh({ svgUrl = '/images/logo-mark.svg', initialTiltDeg = -20 }) {
  const groupRef = useRef();
  const svgData = useLoader(SVGLoader, svgUrl);

  // 1. Conversion des tracés SVG avec détection hybride infaillible
  const shapesData = useMemo(() => {
    return svgData.paths.flatMap((path, pathIndex) => {
      // Three.js getHexString() renvoie 'ffffff' SANS le '#'
      const threeHex = path.color ? path.color.getHexString().toLowerCase() : '';
      const styleFill = path.userData?.style?.fill?.toLowerCase() || '';
      const nodeName = path.userData?.node?.id?.toLowerCase() || '';

      const isWhiteIcon =
        threeHex === 'ffffff' ||
        styleFill === '#ffffff' ||
        styleFill === '#fff' ||
        styleFill === 'white' ||
        nodeName.includes('white') ||
        nodeName.includes('icon');

      const shapes = typeof path.toShapes === 'function' ? path.toShapes() : SVGLoader.createShapes(path);
      return shapes.map((shape, shapeIndex) => ({
        id: `${pathIndex}-${shapeIndex}`,
        shape,
        isWhiteIcon,
        depth: isWhiteIcon ? 14 : 10,
        // Comme le groupe est pivoté de 180° sur X, l'avant correspond au Z négatif (-3)
        zOffset: isWhiteIcon ? -3 : 0,
      }));
    });
  }, [svgData]);

  // 2. Matériaux PBR calibrés sur la charte Djassa
  const redMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#780000'),
        roughness: 0.22,
        metalness: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
      }),
    []
  );

  const whiteMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FFFFFF'),
        emissive: new THREE.Color('#FFFFFF'),
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.1,
      }),
    []
  );

  // 3. Chorégraphie GSAP : Balancement gauche/droite + Zoom (scales strictement positifs)
  useEffect(() => {
    if (!groupRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const baseTiltRad = THREE.MathUtils.degToRad(initialTiltDeg);

    const ctx = gsap.context(() => {
      // Mouvement gauche / droite fluido-dynamique
      gsap.to(groupRef.current.rotation, {
        y: 0.42,
        z: baseTiltRad - 0.06,
        duration: 2.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        startAt: { y: -0.42, z: baseTiltRad + 0.06 },
      });

      // Zoom avant / arrière (respiration 3D positive)
      gsap.to(groupRef.current.scale, {
        x: 0.036,
        y: 0.036,
        z: 0.036,
        duration: 2.2,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, [initialTiltDeg]);

  // Parallaxe douce au mouvement de la souris
  useFrame((state) => {
    if (!groupRef.current) return;
    const targetX = state.pointer.y * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
  });

  return (
    <group
      ref={groupRef}
      scale={[0.03, 0.03, 0.03]}
      rotation={[0, 0, THREE.MathUtils.degToRad(initialTiltDeg)]}
    >
      {/* Rotation 180° sur X pour corriger l'axe Y du SVG sans inverser les normales */}
      <group rotation={[Math.PI, 0, 0]} position={[-50, 50, 0]}>
        {shapesData.map(({ id, shape, isWhiteIcon, depth, zOffset }) => (
          <mesh
            key={id}
            position={[0, 0, zOffset]}
            material={isWhiteIcon ? whiteMaterial : redMaterial}
            castShadow
            receiveShadow
          >
            <extrudeGeometry
              args={[
                shape,
                {
                  depth,
                  bevelEnabled: true,
                  bevelThickness: 1.5,
                  bevelSize: 1.2,
                  bevelSegments: 4,
                },
              ]}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function DjassaLogo3D({
  svgUrl = '/images/logo-mark.svg',
  className = '',
  tiltDeg = -20,
  compact = false,
}) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        eventSource={document.getElementById('root') || undefined}
        eventPrefix="client"
        camera={{ position: [0, 0, compact ? 5.2 : 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.4} color="#121212" />
        <directionalLight position={[5, 8, 6]} intensity={1.8} color="#FFFFFF" />
        <pointLight position={[-4, -3, 4]} intensity={1.2} color="#780000" />

        <Environment resolution={compact ? 128 : 256}>
          <Lightformer form="rect" intensity={2} position={[0, 5, 3]} scale={[10, 2, 1]} color="#FFFFFF" />
          <Lightformer form="ring" intensity={1.5} position={[-5, 0, 2]} scale={4} color="#bcb8b1" />
          <Lightformer form="rect" intensity={2} position={[5, -2, 2]} scale={[5, 5, 1]} color="#780000" />
        </Environment>

        <Float
          speed={compact ? 1.6 : 2.2}
          rotationIntensity={compact ? 0.18 : 0.25}
          floatIntensity={compact ? 0.4 : 0.6}
          floatingRange={[-0.12, 0.12]}
        >
          <ExtrudedLogoMesh svgUrl={svgUrl} initialTiltDeg={tiltDeg} />
        </Float>

        {!compact && (
          <>
            <Sparkles count={35} scale={4.5} size={2.2} speed={0.4} opacity={0.75} color="#780000" />
            <Sparkles count={25} scale={5} size={1.5} speed={0.3} opacity={0.5} color="#bcb8b1" />
            <ContactShadows position={[0, -1.8, 0]} opacity={0.35} scale={6} blur={2.4} color="#121212" />
            <EffectComposer disableNormalPass>
              <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.55} radius={0.6} />
              <Vignette eskil={false} offset={0.15} darkness={0.4} />
            </EffectComposer>
          </>
        )}
      </Canvas>
    </div>
  );
}