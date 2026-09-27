import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Sun,
  Eye,
  Grid,
  Sparkles,
  Play,
  Pause,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export type LightingPreset = 'studio' | 'cyber' | 'sunlight' | 'magma';

interface ModelViewer3DProps {
  modelGroup: THREE.Group;
  animatedWarrior?: any;
  height?: string | number;
  autoRotate?: boolean;
  showControls?: boolean;
  initialDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  cameraTargetY?: number;
  wireframe?: boolean;
  lighting?: LightingPreset;
  onAnimationTrigger?: (animType: string) => void;
  badge?: string;
  subBadge?: string;
}

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({
  modelGroup,
  animatedWarrior,
  height = '100%',
  autoRotate: defaultAutoRotate = true,
  showControls = true,
  initialDistance = 3.5,
  minDistance = 1.0,
  maxDistance = 18.0,
  cameraTargetY = 0.8,
  wireframe: defaultWireframe = false,
  lighting: defaultLighting = 'studio',
  badge,
  subBadge,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(defaultAutoRotate);
  const [isWireframe, setIsWireframe] = useState(defaultWireframe);
  const [currentLighting, setCurrentLighting] = useState<LightingPreset>(defaultLighting);
  const [showGridPedestal, setShowGridPedestal] = useState(true);
  const [activePose, setActivePose] = useState<string>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Orbit angles & distance state
  const orbitRef = useRef({
    theta: 0.5,
    phi: 1.25,
    radius: initialDistance,
    target: new THREE.Vector3(0, cameraTargetY, 0),
    isDragging: false,
    prevX: 0,
    prevY: 0,
  });

  // Apply wireframe to all materials in the model
  const applyWireframe = useCallback((enable: boolean) => {
    if (!currentModelRef.current) return;
    currentModelRef.current.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if ('wireframe' in m) m.wireframe = enable;
          });
        } else if (child.material && 'wireframe' in child.material) {
          child.material.wireframe = enable;
        }
      }
    });
  }, []);

  // Update lighting environment
  const updateLighting = useCallback((preset: LightingPreset) => {
    if (!lightsGroupRef.current || !sceneRef.current) return;

    // Clear old lights
    while (lightsGroupRef.current.children.length > 0) {
      lightsGroupRef.current.remove(lightsGroupRef.current.children[0]);
    }

    if (preset === 'studio') {
      const ambient = new THREE.AmbientLight(0xffffff, 1.2);
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
      keyLight.position.set(4, 8, 5);
      const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.0);
      fillLight.position.set(-5, 3, -3);
      const rimLight = new THREE.DirectionalLight(0xfef08a, 1.2);
      rimLight.position.set(0, 5, -6);

      lightsGroupRef.current.add(ambient, keyLight, fillLight, rimLight);
      sceneRef.current.background = new THREE.Color(0x0c0f14);
    } else if (preset === 'cyber') {
      const ambient = new THREE.AmbientLight(0x0f172a, 1.0);
      const cyanLight = new THREE.PointLight(0x06b6d4, 4.0, 15);
      cyanLight.position.set(3, 3, 3);
      const magentaLight = new THREE.PointLight(0xd946ef, 4.0, 15);
      magentaLight.position.set(-3, 2, -3);
      const topBlue = new THREE.DirectionalLight(0x3b82f6, 1.5);
      topBlue.position.set(0, 8, 2);

      lightsGroupRef.current.add(ambient, cyanLight, magentaLight, topBlue);
      sceneRef.current.background = new THREE.Color(0x05070d);
    } else if (preset === 'sunlight') {
      const ambient = new THREE.AmbientLight(0xffedd5, 1.4);
      const sun = new THREE.DirectionalLight(0xfbbf24, 2.8);
      sun.position.set(6, 10, 4);
      const sky = new THREE.HemisphereLight(0x38bdf8, 0x78350f, 1.0);

      lightsGroupRef.current.add(ambient, sun, sky);
      sceneRef.current.background = new THREE.Color(0x131720);
    } else if (preset === 'magma') {
      const ambient = new THREE.AmbientLight(0x450a0a, 1.0);
      const magmaPoint = new THREE.PointLight(0xef4444, 5.0, 12);
      magmaPoint.position.set(0, -1, 0);
      const orangeKey = new THREE.DirectionalLight(0xf97316, 2.5);
      orangeKey.position.set(3, 5, 3);
      const darkRim = new THREE.DirectionalLight(0x7f1d1d, 1.5);
      darkRim.position.set(-3, 2, -3);

      lightsGroupRef.current.add(ambient, magmaPoint, orangeKey, darkRim);
      sceneRef.current.background = new THREE.Color(0x120808);
    }
  }, []);

  // Initialize Three.js WebGL scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const heightPx = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f14);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Lights group
    const lightsGroup = new THREE.Group();
    lightsGroupRef.current = lightsGroup;
    scene.add(lightsGroup);
    updateLighting(currentLighting);

    // Grid Floor
    const grid = new THREE.GridHelper(10, 20, 0xeab308, 0x334155);
    grid.position.y = -0.01;
    gridHelperRef.current = grid;
    scene.add(grid);

    // Add Model
    currentModelRef.current = modelGroup;
    scene.add(modelGroup);
    applyWireframe(isWireframe);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Render loop
    let lastTime = performance.now();
    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Auto rotation
      if (isAutoRotate && !orbitRef.current.isDragging) {
        orbitRef.current.theta += delta * 0.45;
      }

      // Update camera position from spherical coords
      const { theta, phi, radius, target } = orbitRef.current;
      const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
      camera.position.x = target.x + radius * Math.sin(clampedPhi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(clampedPhi);
      camera.position.z = target.z + radius * Math.sin(clampedPhi) * Math.cos(theta);
      camera.lookAt(target);

      // Update warrior animation if present
      if (animatedWarrior && animatedWarrior.updateAnimation) {
        const isAim = activePose === 'aim';
        const isSlash = activePose === 'slash';
        const isRun = activePose === 'run';
        const speed = isRun ? 6.0 : 0.0;
        animatedWarrior.updateAnimation(delta, speed, isAim, false, false, false, isSlash);
      }

      renderer.render(scene, camera);
    };

    render();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Model Group when modelGroup prop changes
  useEffect(() => {
    if (!sceneRef.current || !modelGroup) return;

    if (currentModelRef.current && currentModelRef.current !== modelGroup) {
      sceneRef.current.remove(currentModelRef.current);
    }

    currentModelRef.current = modelGroup;
    sceneRef.current.add(modelGroup);
    applyWireframe(isWireframe);

    // Auto fit camera distance based on model bounding box
    const bbox = new THREE.Box3().setFromObject(modelGroup);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    orbitRef.current.radius = Math.max(minDistance, Math.min(maxDistance, maxDim * 1.8 || initialDistance));
    orbitRef.current.target.set(0, size.y * 0.45 || cameraTargetY, 0);
  }, [modelGroup, applyWireframe, isWireframe, initialDistance, minDistance, maxDistance, cameraTargetY]);

  // Lighting change listener
  useEffect(() => {
    updateLighting(currentLighting);
  }, [currentLighting, updateLighting]);

  // Wireframe change listener
  useEffect(() => {
    applyWireframe(isWireframe);
  }, [isWireframe, applyWireframe]);

  // Grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGridPedestal;
    }
  }, [showGridPedestal]);

  // Mouse & Touch Orbit Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    orbitRef.current.isDragging = true;
    orbitRef.current.prevX = e.clientX;
    orbitRef.current.prevY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbitRef.current.isDragging) return;
    const deltaX = e.clientX - orbitRef.current.prevX;
    const deltaY = e.clientY - orbitRef.current.prevY;
    orbitRef.current.prevX = e.clientX;
    orbitRef.current.prevY = e.clientY;

    orbitRef.current.theta -= deltaX * 0.008;
    orbitRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitRef.current.phi - deltaY * 0.008));
  };

  const handleMouseUp = () => {
    orbitRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    orbitRef.current.radius = Math.max(
      minDistance,
      Math.min(maxDistance, orbitRef.current.radius + e.deltaY * 0.005)
    );
  };

  // Touch controls for mobile
  const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      orbitRef.current.isDragging = true;
      orbitRef.current.prevX = e.touches[0].clientX;
      orbitRef.current.prevY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      orbitRef.current.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.dist = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && orbitRef.current.isDragging) {
      const deltaX = e.touches[0].clientX - orbitRef.current.prevX;
      const deltaY = e.touches[0].clientY - orbitRef.current.prevY;
      orbitRef.current.prevX = e.touches[0].clientX;
      orbitRef.current.prevY = e.touches[0].clientY;

      orbitRef.current.theta -= deltaX * 0.008;
      orbitRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitRef.current.phi - deltaY * 0.008));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const pinchDelta = touchStartRef.current.dist - dist;
      touchStartRef.current.dist = dist;

      orbitRef.current.radius = Math.max(
        minDistance,
        Math.min(maxDistance, orbitRef.current.radius + pinchDelta * 0.015)
      );
    }
  };

  const handleResetCamera = () => {
    soundEngine.playUiClick();
    orbitRef.current.theta = 0.5;
    orbitRef.current.phi = 1.25;
    orbitRef.current.radius = initialDistance;
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    soundEngine.playUiClick();
    const factor = inOut === 'in' ? -0.8 : 0.8;
    orbitRef.current.radius = Math.max(minDistance, Math.min(maxDistance, orbitRef.current.radius + factor));
  };

  const handlePoseChange = (pose: string) => {
    soundEngine.playUiClick();
    setActivePose(pose);
    if (animatedWarrior && pose === 'booyah') {
      animatedWarrior.playEmote?.('booyah_cheer', 3.0);
    }
  };

  return (
    <div
      style={{ height }}
      className={`relative w-full overflow-hidden select-none bg-[#0a0d12] rounded-xl border border-slate-700/60 shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => (orbitRef.current.isDragging = false)}
    >
      {/* 3D WebGL Canvas Target Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Badge */}
      {(badge || subBadge) && (
        <div className="absolute top-3 left-3 flex flex-col pointer-events-none z-10 animate-in fade-in duration-200">
          {badge && (
            <span className="px-2.5 py-1 rounded bg-black/80 border border-yellow-500/50 text-yellow-400 font-black text-xs uppercase tracking-widest backdrop-blur-md shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              {badge}
            </span>
          )}
          {subBadge && (
            <span className="text-[10px] text-slate-300 font-mono tracking-wider ml-1 mt-0.5 drop-shadow">
              {subBadge}
            </span>
          )}
        </div>
      )}

      {/* Top-Right Quick Viewport Action Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-auto z-10">
          {/* Wireframe Mode Toggle */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setIsWireframe(prev => !prev);
            }}
            className={`p-2 rounded-lg border backdrop-blur-md transition ${
              isWireframe
                ? 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                : 'bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90'
            }`}
            title="Toggle Wireframe Mesh Topology"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Grid / Floor Pedestal Toggle */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setShowGridPedestal(prev => !prev);
            }}
            className={`p-2 rounded-lg border backdrop-blur-md transition ${
              showGridPedestal
                ? 'bg-yellow-500 text-black border-yellow-300'
                : 'bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90'
            }`}
            title="Toggle Ground Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Auto Rotation Toggle */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setIsAutoRotate(prev => !prev);
            }}
            className={`p-2 rounded-lg border backdrop-blur-md transition ${
              isAutoRotate
                ? 'bg-yellow-500 text-black border-yellow-300'
                : 'bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90'
            }`}
            title="Toggle 360 Auto-Rotation"
          >
            {isAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset Camera View */}
          <button
            onClick={handleResetCamera}
            className="p-2 rounded-lg border bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90 backdrop-blur-md transition"
            title="Reset Camera Angle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom In & Out */}
          <button
            onClick={() => handleZoom('in')}
            className="p-2 rounded-lg border bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90 backdrop-blur-md transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 rounded-lg border bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90 backdrop-blur-md transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setIsFullscreen(prev => !prev);
            }}
            className="p-2 rounded-lg border bg-black/70 text-slate-300 border-white/15 hover:text-white hover:bg-black/90 backdrop-blur-md transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Bottom Bar: Lighting Environment Presets & Character Animation Poses */}
      {showControls && (
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto z-10">
          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-black/80 border border-white/15 rounded-lg backdrop-blur-md">
            <span className="text-[9px] font-black uppercase text-slate-400 px-2 flex items-center gap-1">
              <Sun className="w-3 h-3 text-yellow-400" /> LIGHTING:
            </span>
            {(['studio', 'cyber', 'sunlight', 'magma'] as LightingPreset[]).map(light => (
              <button
                key={light}
                onClick={() => {
                  soundEngine.playUiClick();
                  setCurrentLighting(light);
                }}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition ${
                  currentLighting === light
                    ? 'bg-yellow-500 text-black font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {light}
              </button>
            ))}
          </div>

          {/* Character / Weapon Animation Action Buttons */}
          {animatedWarrior && (
            <div className="flex items-center gap-1.5 p-1 bg-black/80 border border-white/15 rounded-lg backdrop-blur-md">
              <span className="text-[9px] font-black uppercase text-slate-400 px-2 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-yellow-400" /> POSE:
              </span>
              {[
                { id: 'idle', label: 'IDLE' },
                { id: 'aim', label: 'AIM' },
                { id: 'slash', label: 'ATTACK' },
                { id: 'run', label: 'SPRINT' },
                { id: 'booyah', label: 'BOOYAH' },
              ].map(pose => (
                <button
                  key={pose.id}
                  onClick={() => handlePoseChange(pose.id)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition ${
                    activePose === pose.id
                      ? 'bg-yellow-500 text-black font-black shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {pose.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
