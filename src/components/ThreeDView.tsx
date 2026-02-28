import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Entity {
  pos: { x: number; y: number };
  vel: { x: number; y: number };
  radius: number;
  color: string;
  mass: number;
}

interface ThreeDViewProps {
  playerRef: React.MutableRefObject<Entity>;
  ballRef: React.MutableRefObject<Entity>;
  teammatesRef: React.MutableRefObject<Entity[]>;
  opponentsRef: React.MutableRefObject<Entity[]>;
  pitchWidth: number;
  pitchHeight: number;
  selectedTeam: any;
}

const ThreeDView: React.FC<ThreeDViewProps> = ({
  playerRef,
  ballRef,
  teammatesRef,
  opponentsRef,
  pitchWidth,
  pitchHeight,
  selectedTeam
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerMeshRef = useRef<THREE.Mesh | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const teammateMeshesRef = useRef<THREE.Mesh[]>([]);
  const opponentMeshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a0a); // Dark green background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      5000
    );
    camera.position.set(pitchWidth / 2, 800, pitchHeight + 400);
    camera.lookAt(pitchWidth / 2, 0, pitchHeight / 2);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(pitchWidth / 2, 1000, pitchHeight / 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -pitchWidth;
    directionalLight.shadow.camera.right = pitchWidth;
    directionalLight.shadow.camera.top = pitchHeight;
    directionalLight.shadow.camera.bottom = -pitchHeight;
    scene.add(directionalLight);

    // Pitch
    const pitchGeometry = new THREE.PlaneGeometry(pitchWidth, pitchHeight);
    const pitchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5a27,
      side: THREE.DoubleSide 
    });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(pitchWidth / 2, 0, pitchHeight / 2);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Pitch Lines
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Center circle
    const circleGeometry = new THREE.RingGeometry(90, 92, 64);
    const circle = new THREE.Mesh(circleGeometry, lineMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(pitchWidth / 2, 0.1, pitchHeight / 2);
    scene.add(circle);

    // Center line
    const centerLineGeometry = new THREE.PlaneGeometry(2, pitchHeight);
    const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(pitchWidth / 2, 0.1, pitchHeight / 2);
    scene.add(centerLine);

    // Goal areas
    const goalAreaGeometry = new THREE.PlaneGeometry(120, 300);
    const goalAreaLeft = new THREE.Mesh(goalAreaGeometry, lineMaterial);
    goalAreaLeft.rotation.x = -Math.PI / 2;
    goalAreaLeft.position.set(60, 0.1, pitchHeight / 2);
    scene.add(goalAreaLeft);

    const goalAreaRight = new THREE.Mesh(goalAreaGeometry, lineMaterial);
    goalAreaRight.rotation.x = -Math.PI / 2;
    goalAreaRight.position.set(pitchWidth - 60, 0.1, pitchHeight / 2);
    scene.add(goalAreaRight);

    // Player (Local)
    const playerGeometry = new THREE.CylinderGeometry(18, 18, 40, 32);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: playerRef.current.color });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    playerMesh.castShadow = true;
    scene.add(playerMesh);
    playerMeshRef.current = playerMesh;

    // Ball
    const ballGeometry = new THREE.SphereGeometry(12, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // Teammates
    teammateMeshesRef.current = teammatesRef.current.map(tm => {
      const mesh = new THREE.Mesh(playerGeometry, new THREE.MeshStandardMaterial({ color: tm.color }));
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    });

    // Opponents
    opponentMeshesRef.current = opponentsRef.current.map(op => {
      const mesh = new THREE.Mesh(playerGeometry, new THREE.MeshStandardMaterial({ color: op.color }));
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    });

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Update positions from refs
      if (playerMeshRef.current) {
        playerMeshRef.current.position.set(playerRef.current.pos.x, 20, playerRef.current.pos.y);
      }
      if (ballMeshRef.current) {
        ballMeshRef.current.position.set(ballRef.current.pos.x, 12, ballRef.current.pos.y);
        // Add some rotation to the ball based on velocity
        ballMeshRef.current.rotation.x += ballRef.current.vel.y * 0.1;
        ballMeshRef.current.rotation.z -= ballRef.current.vel.x * 0.1;
      }

      teammateMeshesRef.current.forEach((mesh, i) => {
        const tm = teammatesRef.current[i];
        if (tm) mesh.position.set(tm.pos.x, 20, tm.pos.y);
      });

      opponentMeshesRef.current.forEach((mesh, i) => {
        const op = opponentsRef.current[i];
        if (op) mesh.position.set(op.pos.x, 20, op.pos.y);
      });

      // Camera follows the ball
      if (cameraRef.current) {
        const targetX = ballRef.current.pos.x;
        const targetZ = ballRef.current.pos.y;
        
        // Smooth camera follow
        cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.z += (targetZ + 400 - cameraRef.current.position.z) * 0.05;
        cameraRef.current.lookAt(targetX, 0, targetZ);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [pitchWidth, pitchHeight, selectedTeam]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeDView;
