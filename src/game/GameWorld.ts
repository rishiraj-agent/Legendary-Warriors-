import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AnimatedWarrior, createWarriorMesh } from './CharacterModel';
import {
  createAirdropMesh,
  createGlooWallMesh,
  createLootMesh,
  createWeaponMesh,
} from './WeaponModels';
import { BotEntity, BotManager } from './BotAI';
import {
  DamageNumber,
  GlooWallObject,
  HeroCharacter,
  KillFeedItem,
  LevelConfig,
  LootPickupItem,
  PlayerStats,
  WeaponData,
  WeaponInventorySlot,
  EmoteData,
  ActiveEmoteEvent,
  SquadMember,
  WeaponAttachments,
  TacticalPingWaypoint,
} from '../types';
import { DEFAULT_SQUAD_MEMBERS, DEFAULT_WEAPON_ATTACHMENTS, HEROES, WEAPONS } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';
import { mobileHaptic } from '../utils/haptics';

export interface GameWorldCallbacks {
  onStatsUpdate: (stats: {
    health: number;
    maxHealth: number;
    armor: number;
    maxArmor: number;
    ep: number;
    activeSlotIndex: number;
    slots: WeaponInventorySlot[];
    glooWalls: number;
    medkits: number;
    aliveCount: number;
    kills: number;
    headshots: number;
    isAiming: boolean;
    isReloading: boolean;
    reloadProgress: number;
    skillCooldownRemaining: number;
    isSkillActive: boolean;
    safeZoneRadius: number;
    safeZoneTimer: number;
    // Squad & 100-Player Matchmaking
    squadMembers: SquadMember[];
    totalCombatants: number;
    matchmakingPing: number;
    // Super Shield (1,200 HP)
    superShieldHp: number;
    maxSuperShieldHp: number;
    isSuperShieldActive: boolean;
    superShieldCooldownRemaining: number;
    // Gradual Damage Bleed Decay
    pendingDamageBleed: number;
    // Downed / Revive state
    isPlayerDowned: boolean;
    downedBleedTimer: number;
    canReviveNear: boolean;
    isReviving: boolean;
    reviveProgress: number;
    // Tactical Waypoints
    tacticalPingWaypoints: TacticalPingWaypoint[];
  }) => void;
  onDamageNumber: (dmg: DamageNumber) => void;
  onKillFeed: (kill: KillFeedItem) => void;
  onGameOver: (victory: boolean, stats: PlayerStats) => void;
  onCrosshairHit: (isHeadshot: boolean) => void;
  onEmoteTriggered?: (event: ActiveEmoteEvent) => void;
}

export class GameWorld {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private animationFrameId: number = 0;
  private isRunning: boolean = false;
  private isDisposed: boolean = false;

  // Level & Hero
  private levelConfig: LevelConfig;
  private hero: HeroCharacter;
  private callbacks: GameWorldCallbacks;
  public customAttachments: Record<string, WeaponAttachments> = DEFAULT_WEAPON_ATTACHMENTS;

  // Player
  private playerWarrior: AnimatedWarrior;
  private playerWeaponGroup: THREE.Group = new THREE.Group();
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerRotationY: number = 0;
  private cameraPitch: number = 0.2; // vertical angle
  private isGrounded: boolean = true;
  private isCrouching: boolean = false;
  private isProne: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private isAiming: boolean = false;
  private isFiring: boolean = false;
  private isSlashing: boolean = false;
  private slashTimer: number = 0;

  // Player Stats
  private health: number = 200;
  private maxHealth: number = 200;
  private armor: number = 100;
  private maxArmor: number = 100;
  private ep: number = 100; // Energy Points (regenerates HP)
  private timeSinceLastDamage: number = 10; // For automatic shield regeneration
  private glooWallsCount: number = 3;
  private medkitsCount: number = 3;

  // Super Shield Barrier (1,200 HP, 85% absorb, 15% EP conversion)
  private superShieldHp: number = 1200;
  private maxSuperShieldHp: number = 1200;
  private isSuperShieldActive: boolean = false;
  private superShieldActiveTimer: number = 0;
  private superShieldCooldownTimer: number = 0;
  private superShieldMesh!: THREE.Mesh;

  // Gradual Damage Bleed Decay (40% instant / 60% bleed over 4s)
  private pendingDamageBleed: number = 0;

  // Squad Alpha & 100-Player Battle Royale
  private squadMembers: SquadMember[] = JSON.parse(JSON.stringify(DEFAULT_SQUAD_MEMBERS));
  private squadVoiceChatStates: {
    talkTimer: number;
    duration: number;
    isTalking: boolean;
    voiceLine: string;
    intensity: number;
  }[] = [
    { talkTimer: 0, duration: 0, isTalking: false, voiceLine: '', intensity: 0 },
    { talkTimer: 2.5, duration: 3.0, isTalking: false, voiceLine: 'Scanning perimeter...', intensity: 0 },
    { talkTimer: 5.0, duration: 2.5, isTalking: false, voiceLine: 'Safe zone moving!', intensity: 0 },
    { talkTimer: 8.0, duration: 3.5, isTalking: false, voiceLine: 'Holding rooftop angle.', intensity: 0 },
  ];
  private isPlayerDowned: boolean = false;
  private downedBleedTimer: number = 30;
  private downedHp: number = 100;
  private isRevivingTeammate: boolean = false;
  private reviveCastProgress: number = 0;
  private nearestDownedTeammateId: string | null = null;
  private totalCombatantsAlive: number = 100;
  private backgroundSkirmishTimer: number = 5.0;
  private matchmakingPing: number = 24;

  // Tactical Pings
  private tacticalPingWaypoints: TacticalPingWaypoint[] = [];
  private tacticalBeaconMeshes: THREE.Group[] = [];

  // Weapons Inventory
  private inventorySlots: WeaponInventorySlot[] = [];
  private activeSlotIndex: number = 0;
  private shootCooldown: number = 0;
  private isReloading: boolean = false;
  private reloadTimer: number = 0;
  private reloadDuration: number = 2.0;

  // Hero Skill
  private skillCooldownTimer: number = 0;
  private skillActiveTimer: number = 0;
  private isSkillActive: boolean = false;

  // Stats Recording
  private stats: PlayerStats = {
    kills: 0,
    headshots: 0,
    damageDealt: 0,
    shotsFired: 0,
    shotsHit: 0,
    survivalTimeSeconds: 0,
    glooWallsUsed: 0,
    medkitsUsed: 0,
  };

  // Safe Zone
  private safeZoneRadius: number = 80;
  private initialRadius: number = 80;
  private safeZoneCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private safeZoneMesh!: THREE.Mesh;
  private safeZoneTimer: number = 60; // seconds before shrink starts

  // Systems
  public botManager!: BotManager;
  private glooWalls: { mesh: THREE.Group; data: GlooWallObject }[] = [];
  private lootItems: { mesh: THREE.Group; data: LootPickupItem }[] = [];
  private airdrops: { mesh: THREE.Group; pos: THREE.Vector3; falling: boolean; loot: LootPickupItem[] }[] = [];
  private obstacles: THREE.Box3[] = [];
  private bulletTracers: { mesh: THREE.Line; life: number }[] = [];
  private particleBursts: { points: THREE.Points; velocities: THREE.Vector3[]; life: number }[] = [];
  private activeEmoteBillboards: { sprite: THREE.Sprite; life: number; maxLife: number; yOffset: number }[] = [];

  // Input states
  private keys: Record<string, boolean> = {};
  public mouseSensitivity: number = 0.0025;
  public autoShoot: boolean = false;
  private joystickInput: { x: number; y: number; isSprinting: boolean } = { x: 0, y: 0, isSprinting: false };

  // Raycaster
  private raycaster = new THREE.Raycaster();

  constructor(
    container: HTMLElement,
    levelConfig: LevelConfig,
    hero: HeroCharacter,
    callbacks: GameWorldCallbacks
  ) {
    this.container = container;
    this.levelConfig = levelConfig;
    this.hero = hero;
    this.callbacks = callbacks;

    this.maxHealth = hero.baseHp;
    this.health = this.maxHealth;
    this.initialRadius = levelConfig.initialSafeZoneRadius;
    this.safeZoneRadius = this.initialRadius;

    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.getEnvironmentBgColor());
    this.scene.fog = new THREE.FogExp2(this.getEnvironmentFogColor(), 0.007);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    if (this.composer) this.composer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Setup Post Processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.6;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);

    // Load Custom Attachments if saved
    try {
      const savedAtt = localStorage.getItem('lw_gunsmith_attachments');
      if (savedAtt) {
        this.customAttachments = { ...DEFAULT_WEAPON_ATTACHMENTS, ...JSON.parse(savedAtt) };
      }
    } catch (e) {
      // Ignore
    }

    // Build Default Inventory
    this.initInventory();

    // Create Player Warrior Rig
    this.playerWarrior = createWarriorMesh(hero, false);
    this.playerWarrior.root.position.set(0, 0, 0);
    this.scene.add(this.playerWarrior.root);

    // Create Super Shield Forcefield Dome (1,200 HP)
    const shieldGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    this.superShieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.superShieldMesh.position.set(0, 1.2, 0);
    this.superShieldMesh.visible = false;
    this.playerWarrior.root.add(this.superShieldMesh);

    this.updateEquippedWeaponMesh();

    // Setup Lighting & Environment
    this.setupLighting();
    this.buildMapEnvironment();
    this.buildSafeZone();
    this.spawnMapLoot();

    // Setup Bot AI (Enemy Bots + Squad Alpha Teammates)
    this.botManager = new BotManager(this.scene, levelConfig);
    this.botManager.spawnSquadTeammates(this.playerPos);
    this.botManager.spawnBots(levelConfig.botCount, this.initialRadius * 0.85, this.initialRadius);

    // Setup Airdrop Event
    this.scheduleAirdrop();

    // Setup Window Resize
    window.addEventListener('resize', this.onResize);

    // Start Loop
    this.isRunning = true;
    soundEngine.startBattleMusic();
    this.lastTime = performance.now();
    this.animate();
  }

  private initInventory() {
    // Starting loadout: Desert Falcon pistol, AK-47 assault rifle, Shotgun, and Katana blade
    this.inventorySlots = [
      { weapon: WEAPONS.ak47, currentAmmo: 30, reserveAmmo: 120 },
      { weapon: WEAPONS.desert_eagle, currentAmmo: 8, reserveAmmo: 48 },
      { weapon: WEAPONS.m1887, currentAmmo: 2, reserveAmmo: 24 },
      { weapon: WEAPONS.katana, currentAmmo: 1, reserveAmmo: 1 },
    ];
    if (this.levelConfig.levelNumber >= 2) {
      this.inventorySlots[2] = { weapon: WEAPONS.mp40, currentAmmo: 32, reserveAmmo: 160 };
    }
    if (this.levelConfig.levelNumber >= 4) {
      this.inventorySlots[1] = { weapon: WEAPONS.plasma_launcher, currentAmmo: 4, reserveAmmo: 16 };
    }
  }

  private getEnvironmentBgColor(): number {
    switch (this.levelConfig.environmentTheme) {
      case 'desert': return 0xd4a373;
      case 'volcano': return 0x450a0a;
      case 'cyber': return 0x090915;
      case 'factory': return 0x27272a;
      case 'bunker': return 0x1e293b;
      case 'legendary': return 0x18002e;
      default: return 0x87ceeb; // Blue sky
    }
  }

  private getEnvironmentFogColor(): number {
    switch (this.levelConfig.environmentTheme) {
      case 'desert': return 0xecd9b5;
      case 'volcano': return 0x7f1d1d;
      case 'cyber': return 0x0f172a;
      case 'factory': return 0x3f3f46;
      case 'bunker': return 0x334155;
      case 'legendary': return 0x3b0764;
      default: return 0xcde8f6;
    }
  }

  private setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(45, 80, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 250;
    const d = 90;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);
  }

  private buildMapEnvironment() {
    // Ground Terrain
    const groundSize = 350;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 40, 40);

    let groundColor = 0x3f6212; // Grass
    if (this.levelConfig.environmentTheme === 'desert') groundColor = 0xd97706;
    if (this.levelConfig.environmentTheme === 'volcano') groundColor = 0x292524;
    if (this.levelConfig.environmentTheme === 'cyber') groundColor = 0x0f172a;
    if (this.levelConfig.environmentTheme === 'factory') groundColor = 0x52525b;

    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ground grid lines for battle royale tactical field look
    const gridHelper = new THREE.GridHelper(groundSize, 70, 0xffffff, 0x000000);
    gridHelper.position.y = 0.02;
    (gridHelper.material as THREE.Material).opacity = 0.12;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);

    // Generate Buildings, Shipping Containers, Watchtowers, and Barricades
    this.generateStructures();
  }

  private generateStructures() {
    const containerColors = [0xef4444, 0x3b82f6, 0xeab308, 0x10b981, 0x6366f1];

    // 1. Shipping Containers
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * (this.initialRadius * 0.8);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const cW = 2.8;
      const cH = 2.8;
      const cL = 6.5;
      const cGeo = new THREE.BoxGeometry(cW, cH, cL);
      const cMat = new THREE.MeshStandardMaterial({
        color: containerColors[i % containerColors.length],
        metalness: 0.6,
        roughness: 0.4,
      });
      const containerMesh = new THREE.Mesh(cGeo, cMat);
      containerMesh.position.set(x, cH / 2, z);
      containerMesh.rotation.y = Math.random() * Math.PI;
      containerMesh.castShadow = true;
      containerMesh.receiveShadow = true;
      this.scene.add(containerMesh);

      // Add obstacle hitbox
      const box = new THREE.Box3().setFromObject(containerMesh);
      this.obstacles.push(box);
    }

    // 2. Military Bunkers / Houses
    const bunkerPositions = [
      { x: -30, z: -25 },
      { x: 35, z: 20 },
      { x: -20, z: 40 },
      { x: 45, z: -35 },
      { x: 0, z: -45 },
    ];

    bunkerPositions.forEach(pos => {
      const bGroup = new THREE.Group();
      bGroup.position.set(pos.x, 0, pos.z);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.9 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });

      // Main room
      const roomGeo = new THREE.BoxGeometry(10, 4.5, 8);
      const room = new THREE.Mesh(roomGeo, wallMat);
      room.position.y = 2.25;
      room.castShadow = true;
      room.receiveShadow = true;
      bGroup.add(room);

      // Roof
      const roofGeo = new THREE.BoxGeometry(11, 0.4, 9);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 4.7;
      roof.castShadow = true;
      bGroup.add(roof);

      this.scene.add(bGroup);
      this.obstacles.push(new THREE.Box3().setFromObject(bGroup));
    });

    // 3. Sniper Watchtowers
    const towerPositions = [
      { x: -45, z: -45 },
      { x: 50, z: 45 },
      { x: -50, z: 30 },
      { x: 40, z: -50 },
    ];

    towerPositions.forEach(pos => {
      const tGroup = new THREE.Group();
      tGroup.position.set(pos.x, 0, pos.z);

      const metalMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8 });
      // 4 Pillar legs
      [-1.8, 1.8].forEach(px => {
        [-1.8, 1.8].forEach(pz => {
          const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
          const leg = new THREE.Mesh(legGeo, metalMat);
          leg.position.set(px, 4, pz);
          leg.castShadow = true;
          tGroup.add(leg);
        });
      });

      // Platform
      const platGeo = new THREE.BoxGeometry(4.5, 0.3, 4.5);
      const platform = new THREE.Mesh(platGeo, metalMat);
      platform.position.y = 8;
      platform.castShadow = true;
      tGroup.add(platform);

      // Guardrail
      const railGeo = new THREE.BoxGeometry(4.4, 1.0, 0.1);
      [-2.1, 2.1].forEach(rz => {
        const rail = new THREE.Mesh(railGeo, metalMat);
        rail.position.set(0, 8.6, rz);
        tGroup.add(rail);
      });

      this.scene.add(tGroup);
      this.obstacles.push(new THREE.Box3().setFromObject(tGroup));
    });

    // 4. Palm Trees / Foliage
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * (this.initialRadius * 0.9);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 6, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Leaves
      const leafGeo = new THREE.ConeGeometry(2.5, 4, 6);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
      const leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.y = 6.5;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      this.scene.add(treeGroup);
    }

    // 5. Cyberpunk City Skyline & Neon Holographic Billboards
    this.createCyberpunkCityscapeAndBillboards();
  }

  private createCyberBillboardCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Dark cyberpunk gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, 'rgba(10, 15, 30, 0.95)');
    bgGrad.addColorStop(1, 'rgba(2, 6, 18, 0.98)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Cyan holographic grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Glowing cyber neon border frame
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 25;
    ctx.strokeRect(20, 20, 984, 472);

    // Corner brackets
    ctx.fillStyle = '#38bdf8';
    const bLen = 60;
    ctx.fillRect(15, 15, bLen, 12);
    ctx.fillRect(15, 15, 12, bLen);
    ctx.fillRect(1024 - 15 - bLen, 15, bLen, 12);
    ctx.fillRect(1024 - 27, 15, 12, bLen);
    ctx.fillRect(15, 512 - 27, bLen, 12);
    ctx.fillRect(15, 512 - 15 - bLen, 12, bLen);
    ctx.fillRect(1024 - 15 - bLen, 512 - 27, bLen, 12);
    ctx.fillRect(1024 - 27, 512 - 15 - bLen, 12, bLen);

    // Subtitle top badge
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#eab308';
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 26px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('/// BATTLE ROYALE SIMULATION ACTIVE ///', 512, 110);

    // Main Glowing Game Title
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 35;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 92px "Chakra Petch", sans-serif';
    ctx.fillText('LEGENDARY', 512, 230);

    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 45;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 900 88px "Chakra Petch", sans-serif';
    ctx.fillText('WARRIORS', 512, 335);

    // Bottom telemetry line
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px "Rajdhani", monospace';
    ctx.fillText('100 WARRIORS DROP • 1 CHAMPION SURVIVES • SYSTEM v4.5', 512, 420);

    return canvas;
  }

  private createCyberpunkCityscapeAndBillboards() {
    const billboardCanvas = this.createCyberBillboardCanvas();
    const billboardTexture = new THREE.CanvasTexture(billboardCanvas);
    billboardTexture.wrapS = THREE.ClampToEdgeWrapping;
    billboardTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 1. Surrounding Skyscraper Perimeter
    const skyscraperAngles = [0, 0.45, 0.9, 1.35, 1.8, 2.25, 2.7, 3.14, 3.6, 4.05, 4.5, 4.95, 5.4, 5.85];
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.3,
      metalness: 0.85,
    });

    skyscraperAngles.forEach((angle, idx) => {
      const dist = 110 + (idx % 3) * 20;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const height = 45 + (idx % 5) * 22;
      const width = 18 + (idx % 3) * 8;
      const depth = 18 + (idx % 2) * 8;

      const towerGeo = new THREE.BoxGeometry(width, height, depth);
      const towerMesh = new THREE.Mesh(towerGeo, towerMat);
      towerMesh.position.set(x, height / 2, z);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      this.scene.add(towerMesh);

      // Add Glowing Rooftop Antenna Spire
      const spireGeo = new THREE.CylinderGeometry(0.1, 0.3, 16, 6);
      const spireMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(x, height + 8, z);
      this.scene.add(spire);

      // Warning beacon light on top
      const beaconGeo = new THREE.SphereGeometry(0.6, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: (idx % 2 === 0) ? 0xef4444 : 0x06b6d4 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(x, height + 16, z);
      this.scene.add(beacon);
    });

    // 2. High-Tech Rooftop Holographic Billboards (Displaying "LEGENDARY WARRIORS")
    const billboardPositions = [
      { x: 0, z: -75, rotY: 0 },
      { x: 75, z: 0, rotY: -Math.PI / 2 },
      { x: -75, z: 0, rotY: Math.PI / 2 },
      { x: 0, z: 75, rotY: Math.PI },
    ];

    billboardPositions.forEach(bPos => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bPos.x, 0, bPos.z);
      bGroup.rotation.y = bPos.rotY;

      // Steel truss frame legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      [-10, 10].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 14, 8), legMat);
        leg.position.set(lx, 7, 0);
        bGroup.add(leg);
      });

      // Billboard Screen Board
      const screenGeo = new THREE.PlaneGeometry(24, 12);
      const screenMat = new THREE.MeshBasicMaterial({
        map: billboardTexture,
        side: THREE.DoubleSide,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 14, 0);
      bGroup.add(screen);

      // Neon Backlight glow panel
      const backGeo = new THREE.BoxGeometry(24.4, 12.4, 0.6);
      const backMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 });
      const backMesh = new THREE.Mesh(backGeo, backMat);
      backMesh.position.set(0, 14, -0.35);
      bGroup.add(backMesh);

      // Spot light projecting soft neon glow
      const spotLight = new THREE.PointLight(0x06b6d4, 1.2, 35);
      spotLight.position.set(0, 14, 2);
      bGroup.add(spotLight);

      this.scene.add(bGroup);
      this.obstacles.push(new THREE.Box3().setFromObject(bGroup));
    });
  }

  private buildSafeZone() {
    const geo = new THREE.CylinderGeometry(this.safeZoneRadius, this.safeZoneRadius, 35, 36, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    this.safeZoneMesh = new THREE.Mesh(geo, mat);
    this.safeZoneMesh.position.y = 17.5;
    this.scene.add(this.safeZoneMesh);
  }

  private spawnMapLoot() {
    const lootTypes: ('weapon' | 'ammo' | 'medkit' | 'gloowall' | 'armor' | 'shield_battery' | 'ep_drink')[] = [
      'ammo', 'medkit', 'gloowall', 'armor', 'weapon', 'shield_battery', 'ep_drink',
    ];

    const count = Math.floor(36 * this.levelConfig.lootDensity);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * (this.initialRadius * 0.78);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];
      let colorHex = '#10b981';
      let name = 'Medkit (+75 HP)';
      let weaponId: string | undefined = undefined;

      if (type === 'ammo') {
        colorHex = '#f59e0b';
        name = 'Ammo Pack (+60 Rounds)';
      } else if (type === 'gloowall') {
        colorHex = '#06b6d4';
        name = 'Gloo Wall Capsule (+1)';
      } else if (type === 'armor') {
        colorHex = '#8b5cf6';
        name = 'Level 3 Heavy Kevlar';
      } else if (type === 'shield_battery') {
        colorHex = '#38bdf8';
        name = 'Shield Battery (+50 SHD)';
      } else if (type === 'ep_drink') {
        colorHex = '#facc15';
        name = 'Energy Drink (+50 EP)';
      } else if (type === 'weapon') {
        const wepKeys = ['scar', 'm1887', 'mp40', 'awm', 'desert_eagle', 'plasma_launcher', 'katana'];
        weaponId = wepKeys[Math.floor(Math.random() * wepKeys.length)];
        const wep = WEAPONS[weaponId] || WEAPONS.ak47;
        colorHex = wep.color;
        name = wep.displayName;
      }

      const lootData: LootPickupItem = {
        id: `loot_${i}`,
        type,
        weaponId,
        name,
        position: { x, y: 0, z },
        color: colorHex,
      };

      const mesh = createLootMesh(type, colorHex);
      mesh.position.set(x, 0, z);
      this.scene.add(mesh);

      this.lootItems.push({ mesh, data: lootData });
    }
  }

  private scheduleAirdrop() {
    // Schedule high-value supply crate drop
    setTimeout(() => {
      if (this.isDisposed || !this.isRunning) return;

      const dropX = (Math.random() - 0.5) * (this.safeZoneRadius * 0.6);
      const dropZ = (Math.random() - 0.5) * (this.safeZoneRadius * 0.6);
      const mesh = createAirdropMesh();
      mesh.position.set(dropX, 40, dropZ);
      this.scene.add(mesh);

      soundEngine.playExplosion();

      const airdropLoot: LootPickupItem[] = [
        {
          id: 'airdrop_launcher',
          type: 'weapon',
          weaponId: 'plasma_launcher',
          name: 'Plasma Annihilator (AoE Heavy)',
          position: { x: dropX, y: 0, z: dropZ },
          color: '#ef4444',
        },
        {
          id: 'airdrop_awm',
          type: 'weapon',
          weaponId: 'awm',
          name: 'AWM Sniper King',
          position: { x: dropX, y: 0, z: dropZ },
          color: '#ec4899',
        },
        {
          id: 'airdrop_shield_cell',
          type: 'shield_battery',
          name: 'Overcharge Shield Battery',
          position: { x: dropX, y: 0, z: dropZ },
          color: '#38bdf8',
        },
        {
          id: 'airdrop_gloos',
          type: 'gloowall',
          name: 'Super Gloo Wall (+3)',
          position: { x: dropX, y: 0, z: dropZ },
          color: '#06b6d4',
        },
        {
          id: 'airdrop_armor',
          type: 'armor',
          name: 'Titanium Nanotech Armor',
          position: { x: dropX, y: 0, z: dropZ },
          color: '#a855f7',
        },
      ];

      this.airdrops.push({
        mesh,
        pos: new THREE.Vector3(dropX, 0, dropZ),
        falling: true,
        loot: airdropLoot,
      });

      this.callbacks.onKillFeed({
        id: `airdrop_${Date.now()}`,
        killer: 'SYSTEM',
        victim: 'AIRDROP',
        weaponName: 'Heavy Supply Crate Inbound!',
        isHeadshot: false,
        isPlayerKiller: false,
        timestamp: Date.now(),
      });
    }, 20000);
  }

  public updateEquippedWeaponMesh() {
    if (this.playerWeaponGroup) {
      this.playerWarrior.weaponAnchor.remove(this.playerWeaponGroup);
    }
    const currentWeapon = this.getActiveWeapon();
    this.playerWeaponGroup = createWeaponMesh(currentWeapon);
    this.playerWarrior.weaponAnchor.add(this.playerWeaponGroup);
  }

  public getActiveWeapon(): WeaponData {
    return this.inventorySlots[this.activeSlotIndex]?.weapon || WEAPONS.ak47;
  }

  public switchWeapon(index: number) {
    if (index >= 0 && index < this.inventorySlots.length && index !== this.activeSlotIndex) {
      this.activeSlotIndex = index;
      this.isReloading = false;
      this.shootCooldown = 0.2;
      this.updateEquippedWeaponMesh();
      soundEngine.playReload();
    }
  }

  public reloadActiveWeapon() {
    const slot = this.inventorySlots[this.activeSlotIndex];
    if (!slot || slot.weapon.type === 'katana') return;

    const att = this.customAttachments[slot.weapon.id];
    let maxMag = slot.weapon.magazineSize;
    if (att?.magazine === 'extended_mag_lvl3') maxMag += 20;
    else if (att?.magazine === 'drum_mag') maxMag += 30;

    if (slot.currentAmmo >= maxMag || slot.reserveAmmo <= 0 || this.isReloading) return;

    this.isReloading = true;
    let baseReload = slot.weapon.reloadTime;
    if (att?.magazine === 'quick_reload_mag') baseReload *= 0.65;
    if (att?.chipLevel && att.chipLevel > 1) baseReload *= (1 - (att.chipLevel - 1) * 0.08);

    this.reloadDuration = Math.max(0.6, baseReload);
    this.reloadTimer = this.reloadDuration;
    soundEngine.playReload();
  }

  public useMedkit() {
    if (this.medkitsCount <= 0 || (this.health >= this.maxHealth && this.pendingDamageBleed <= 0)) return;
    this.medkitsCount--;
    this.health = Math.min(this.maxHealth, this.health + 150);
    this.pendingDamageBleed = 0; // Immediate purge of temporal damage bleed!
    this.stats.medkitsUsed++;
    soundEngine.playHealSound();
  }

  public activateSuperShield() {
    if (this.superShieldCooldownTimer > 0 || this.isSuperShieldActive || this.superShieldHp <= 0) return;

    this.isSuperShieldActive = true;
    this.superShieldActiveTimer = 10.0; // 10s duration
    this.superShieldMesh.visible = true;
    soundEngine.playShieldRecharge();

    this.squadMembers[0].isSuperShieldActive = true;
  }

  public triggerTacticalPing() {
    // Raycast from camera crosshair into 3D world
    const rayDir = new THREE.Vector3();
    this.camera.getWorldDirection(rayDir);
    this.raycaster.set(this.camera.position, rayDir);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let hitPos = this.playerPos.clone().add(rayDir.clone().multiplyScalar(40));
    let hitType: 'enemy' | 'rally' | 'loot' = 'rally';
    let label = 'TACTICAL RALLY POINT';

    for (const hit of intersects) {
      if (hit.object === this.playerWarrior.root || hit.object.parent === this.playerWarrior.root) continue;
      if (hit.distance > 2.0 && hit.distance < 200) {
        hitPos = hit.point;
        // Check if hit a bot
        for (const b of this.botManager.bots) {
          if (!b.isDead && b.position.distanceTo(hitPos) < 3.5) {
            hitType = 'enemy';
            label = `ENEMY SPOTTED: ${b.name}`;
            break;
          }
        }
        break;
      }
    }

    const dist = Math.round(this.playerPos.distanceTo(hitPos));
    const newPing: TacticalPingWaypoint = {
      id: `ping_${Date.now()}`,
      x: hitPos.x,
      y: hitPos.y,
      z: hitPos.z,
      label: `${label} (${dist}m)`,
      sender: 'You',
      color: hitType === 'enemy' ? '#ef4444' : '#06b6d4',
      distance: dist,
      timestamp: Date.now(),
    };

    this.tacticalPingWaypoints = [newPing, ...this.tacticalPingWaypoints.slice(0, 3)];

    // Create 3D Beacon in scene
    const beaconGroup = new THREE.Group();
    beaconGroup.position.copy(hitPos);

    // Glowing beam
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 25, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: hitType === 'enemy' ? 0xef4444 : 0x06b6d4,
      transparent: true,
      opacity: 0.65,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 12.5;
    beaconGroup.add(beam);

    this.scene.add(beaconGroup);
    this.tacticalBeaconMeshes.push(beaconGroup);

    soundEngine.playUiClick();
  }

  public reviveNearestTeammate() {
    if (this.isPlayerDowned) return;

    // Look for downed squad member near player (<3.5m)
    for (let i = 1; i < this.squadMembers.length; i++) {
      const tm = this.squadMembers[i];
      if (tm.status === 'downed') {
        const dist = this.playerPos.distanceTo(new THREE.Vector3(tm.position.x, tm.position.y, tm.position.z));
        if (dist < 3.5) {
          this.isRevivingTeammate = true;
          this.nearestDownedTeammateId = tm.id;
          return;
        }
      }
    }
  }

  public deployGlooWall() {
    if (this.glooWallsCount <= 0) return;
    this.glooWallsCount--;
    this.stats.glooWallsUsed++;

    // Calculate spawn position in front of player
    const spawnDist = 2.5;
    const forwardX = Math.sin(this.playerRotationY) * spawnDist;
    const forwardZ = Math.cos(this.playerRotationY) * spawnDist;

    const wallPos = {
      x: this.playerPos.x + forwardX,
      y: 0,
      z: this.playerPos.z + forwardZ,
    };

    const wallMesh = createGlooWallMesh();
    wallMesh.position.set(wallPos.x, wallPos.y, wallPos.z);
    wallMesh.rotation.y = this.playerRotationY;
    this.scene.add(wallMesh);

    const wallData: GlooWallObject = {
      id: `gloo_${Date.now()}`,
      position: wallPos,
      rotationY: this.playerRotationY,
      hp: 450,
      maxHp: 450,
      createdTime: Date.now(),
    };

    this.glooWalls.push({ mesh: wallMesh, data: wallData });
    soundEngine.playGlooWallDeploy();
  }

  public activateHeroSkill() {
    if (this.skillCooldownTimer > 0 || this.isSkillActive) return;

    this.isSkillActive = true;
    this.skillActiveTimer = this.hero.skillDuration;
    this.skillCooldownTimer = this.hero.skillCooldown;
    soundEngine.playSkillActive();

    // Visual auras
    if (this.hero.id === 'alok' && this.playerWarrior.auraMesh) {
      (this.playerWarrior.auraMesh.material as THREE.Material).opacity = 0.8;
    }
    if (this.hero.id === 'chrono' && this.playerWarrior.shieldMesh) {
      (this.playerWarrior.shieldMesh.material as THREE.Material).opacity = 0.7;
    }
  }

  public setInput(key: string, value: boolean) {
    const k = key.toLowerCase();
    this.keys[k] = value;
    if (value) {
      if (k === '1') this.switchWeapon(0);
      else if (k === '2') this.switchWeapon(1);
      else if (k === '3') this.switchWeapon(2);
      else if (k === '4') this.switchWeapon(3);
      else if (k === 'r') this.reloadActiveWeapon();
      else if (k === 'e') this.activateSuperShield();
      else if (k === 'h') this.useMedkit();
      else if (k === 'f') this.reviveNearestTeammate();
      else if (k === 'p') this.triggerTacticalPing();
      else if (k === 'g') this.deployGlooWall();
      else if (k === 'z') {
        this.isProne = !this.isProne;
        if (this.isProne) { this.isCrouching = false; this.isSliding = false; }
      }
      else if (k === 'c') {
        this.isCrouching = !this.isCrouching;
        if (this.isCrouching) { this.isProne = false; this.isSliding = false; }
      }
      else if (k === 'v') {
        if (this.keys['shift'] && !this.isProne && !this.isCrouching && !this.isAiming) {
          this.isSliding = true;
          this.slideTimer = 0.8; // Slide lasts 0.8s
        }
      }
      else if (k === 'q') this.activateHeroSkill();
    }
  }

  public setJoystickInput(x: number, y: number, isSprinting: boolean = false) {
    this.joystickInput = { x, y, isSprinting };
  }

  public triggerJump() {
    if (this.isGrounded) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  public toggleCrouch() {
    this.isCrouching = !this.isCrouching;
    if (this.isCrouching) {
      this.isProne = false;
      this.isSliding = false;
    }
  }

  public toggleProne() {
    this.isProne = !this.isProne;
    if (this.isProne) {
      this.isCrouching = false;
      this.isSliding = false;
    }
  }

  public triggerSlide() {
    if (!this.isProne && !this.isCrouching && !this.isAiming) {
      this.isSliding = true;
      this.slideTimer = 0.8;
    }
  }

  public onMouseMove(movementX: number, movementY: number) {
    this.playerRotationY -= movementX * this.mouseSensitivity;
    this.cameraPitch = Math.max(-0.4, Math.min(0.7, this.cameraPitch - movementY * this.mouseSensitivity));
  }

  public applyGyroscopeDelta(pitchDelta: number, rollDelta: number, mode: 'disabled' | 'scope_only' | 'always_on' = 'scope_only') {
    if (mode === 'disabled') return;
    if (mode === 'scope_only' && !this.isAiming) return;

    this.playerRotationY += rollDelta;
    this.cameraPitch = Math.max(-0.4, Math.min(0.7, this.cameraPitch + pitchDelta));
  }

  public setAiming(aim: boolean) {
    this.isAiming = aim;
  }

  public setFiring(firing: boolean) {
    this.isFiring = firing;
  }

  // Shoot Execution
  public performPlayerShoot() {
    const slot = this.inventorySlots[this.activeSlotIndex];
    if (!slot) return;
    const weapon = slot.weapon;

    if (weapon.type === 'katana') {
      this.isSlashing = true;
      this.slashTimer = 0.3;
      soundEngine.playKatanaSlash();
      this.checkMeleeHit(weapon);
      return;
    }

    if (slot.currentAmmo <= 0) {
      this.reloadActiveWeapon();
      return;
    }

    slot.currentAmmo--;
    this.stats.shotsFired++;
    mobileHaptic.triggerFire();

    // Weapon Sounds
    if (weapon.id === 'desert_eagle' || weapon.type === 'pistol') {
      soundEngine.playPistolShot();
    } else if (weapon.id === 'plasma_launcher' || weapon.type === 'launcher') {
      soundEngine.playPlasmaShot();
    } else if (weapon.id === 'm1887' || weapon.type === 'shotgun') {
      soundEngine.playShotgunBlast();
    } else if (weapon.id === 'awm' || weapon.type === 'sniper') {
      soundEngine.playSniperShot();
    } else if (weapon.id === 'mp40' || weapon.type === 'smg') {
      soundEngine.playSMGShot();
    } else {
      soundEngine.playAKShot();
    }

    // Raycast center screen from camera
    this.shootRaycast(weapon);
  }

  private checkMeleeHit(weapon: WeaponData) {
    const attackRange = weapon.range;
    for (const bot of this.botManager.bots) {
      if (bot.isDead) continue;
      const dist = this.playerPos.distanceTo(bot.position);
      if (dist <= attackRange) {
        // Forward angle check
        const toBot = new THREE.Vector3().subVectors(bot.position, this.playerPos).normalize();
        const forward = new THREE.Vector3(Math.sin(this.playerRotationY), 0, Math.cos(this.playerRotationY));
        const dot = forward.dot(toBot);
        if (dot > 0.4) {
          const dmg = weapon.damage * (this.isSkillActive && this.hero.id === 'hayato' ? 1.4 : 1.0);
          this.applyDamageToBot(bot, dmg, false, weapon.displayName);
        }
      }
    }
  }

  private performPlasmaBlast(epicenter: THREE.Vector3, aoeRadius: number, baseDamage: number) {
    soundEngine.playExplosion();
    this.spawnParticleBurst(epicenter, 0xef4444);
    this.spawnParticleBurst(epicenter.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x06b6d4);

    for (const bot of this.botManager.bots) {
      if (bot.isDead) continue;
      const dist = bot.position.distanceTo(epicenter);
      if (dist <= aoeRadius) {
        const falloff = 1 - (dist / aoeRadius);
        const splashDamage = Math.round(baseDamage * Math.max(0.4, falloff));
        this.applyDamageToBot(bot, splashDamage, false, 'Plasma Annihilator');
      }
    }
  }

  private shootRaycast(weapon: WeaponData) {
    // Forward direction from camera
    const rayDir = new THREE.Vector3();
    this.camera.getWorldDirection(rayDir);

    const att = this.customAttachments[weapon.id];

    // Apply weapon spread (reduced when aiming, and reduced by compensator)
    let spread = this.isAiming ? weapon.spread * 0.3 : weapon.spread;
    if (att?.muzzle === 'compensator') spread *= 0.75;
    if (att?.underbarrel === 'angled_foregrip') spread *= 0.85;

    rayDir.x += (Math.random() - 0.5) * spread;
    rayDir.y += (Math.random() - 0.5) * spread;
    rayDir.z += (Math.random() - 0.5) * spread;
    rayDir.normalize();

    const rayOrigin = this.camera.position.clone();
    this.raycaster.set(rayOrigin, rayDir);

    let closestHitDist = weapon.range;
    let hitBot: BotEntity | null = null;
    let isHeadshot = false;
    let hitPoint = rayOrigin.clone().add(rayDir.clone().multiplyScalar(weapon.range));

    // Check Gloo Walls First
    for (const gw of this.glooWalls) {
      const gwBox = new THREE.Box3().setFromObject(gw.mesh);
      const intersect = this.raycaster.ray.intersectBox(gwBox, new THREE.Vector3());
      if (intersect) {
        const d = rayOrigin.distanceTo(intersect);
        if (d < closestHitDist) {
          closestHitDist = d;
          hitPoint = intersect;
          gw.data.hp -= weapon.damage;
          if (gw.data.hp <= 0) {
            this.scene.remove(gw.mesh);
            this.glooWalls = this.glooWalls.filter(g => g !== gw);
          }
        }
      }
    }

    // Check Bots
    for (const bot of this.botManager.bots) {
      if (bot.isDead) continue;

      // Check Headshot
      const headIntersect = this.raycaster.ray.intersectBox(bot.headshotHitbox, new THREE.Vector3());
      if (headIntersect) {
        const d = rayOrigin.distanceTo(headIntersect);
        if (d < closestHitDist) {
          closestHitDist = d;
          hitBot = bot;
          isHeadshot = true;
          hitPoint = headIntersect;
        }
      }

      // Check Body
      if (!isHeadshot) {
        const bodyIntersect = this.raycaster.ray.intersectBox(bot.bodyHitbox, new THREE.Vector3());
        if (bodyIntersect) {
          const d = rayOrigin.distanceTo(bodyIntersect);
          if (d < closestHitDist) {
            closestHitDist = d;
            hitBot = bot;
            isHeadshot = false;
            hitPoint = bodyIntersect;
          }
        }
      }
    }

    // Spawn Bullet Tracer Line
    this.spawnTracer(this.playerWarrior.weaponAnchor.getWorldPosition(new THREE.Vector3()), hitPoint);

    // Plasma Launcher AoE Explosive handling
    if (weapon.isAoE) {
      this.performPlasmaBlast(hitPoint, weapon.aoeRadius || 6.5, weapon.damage);
      return;
    }

    // Apply Damage
    if (hitBot) {
      // Limb hit approximation (bottom 25% of body box)
      const isLimb = !isHeadshot && (hitPoint.y - hitBot.position.y) < 0.6;
      let multiplier = isHeadshot ? 3.5 : (isLimb ? 0.7 : 1.0);
      
      // Apply damage falloff based on distance
      let falloffMultiplier = 1.0;
      if (weapon.damageFalloff && weapon.damageFalloff.length > 0) {
        const dist = closestHitDist;
        const falloff = weapon.damageFalloff;
        
        if (dist <= falloff[0].distance) {
          falloffMultiplier = falloff[0].multiplier;
        } else if (dist >= falloff[falloff.length - 1].distance) {
          falloffMultiplier = falloff[falloff.length - 1].multiplier;
        } else {
          for (let i = 0; i < falloff.length - 1; i++) {
            if (dist >= falloff[i].distance && dist <= falloff[i+1].distance) {
              const t = (dist - falloff[i].distance) / (falloff[i+1].distance - falloff[i].distance);
              falloffMultiplier = falloff[i].multiplier + t * (falloff[i+1].multiplier - falloff[i].multiplier);
              break;
            }
          }
        }
      }
      
      let dmg = weapon.damage * multiplier * falloffMultiplier;

      // Chip level damage upgrade (+15% per level above 1)
      if (att?.chipLevel && att.chipLevel > 1) {
        dmg *= (1 + (att.chipLevel - 1) * 0.15);
      }

      if (this.isSkillActive && this.hero.id === 'hayato') {
        dmg *= 1.35;
      }
      this.applyDamageToBot(hitBot, dmg, isHeadshot, weapon.displayName);
    }
  }

  private applyDamageToBot(bot: BotEntity, damage: number, isHeadshot: boolean, weaponName: string) {
    const result = this.botManager.damageBot(bot, damage, isHeadshot);
    this.stats.damageDealt += Math.round(result.finalDamage);
    this.stats.shotsHit++;

    // Audio hit marker
    if (isHeadshot) {
      soundEngine.playHeadshotSound();
      this.callbacks.onCrosshairHit(true);
    } else {
      soundEngine.playHitMarker();
      this.callbacks.onCrosshairHit(false);
    }

    // 3D Damage number
    this.callbacks.onDamageNumber({
      id: `dmg_${Date.now()}_${Math.random()}`,
      damage: Math.round(result.finalDamage),
      isHeadshot,
      isShieldHit: result.isShieldHit,
      x: window.innerWidth / 2 + (Math.random() * 80 - 40),
      y: window.innerHeight / 2 - 40 + (Math.random() * 40 - 20),
      opacity: 1.0,
      scale: isHeadshot ? 1.5 : 1.0,
      time: Date.now(),
    });

    // Blood / Spark FX
    const sparkColor = result.isShieldHit ? 0x06b6d4 : (isHeadshot ? 0xfacc15 : 0xef4444);
    this.spawnParticleBurst(bot.position.clone().add(new THREE.Vector3(0, isHeadshot ? 1.6 : 1.0, 0)), sparkColor);

    if (result.died) {
      this.stats.kills++;
      if (isHeadshot) this.stats.headshots++;

      this.callbacks.onKillFeed({
        id: `kill_${Date.now()}`,
        killer: `${this.hero.name}`,
        victim: bot.name,
        weaponName,
        isHeadshot,
        isPlayerKiller: true,
        timestamp: Date.now(),
      });

      // Spawn loot on death
      this.spawnDeathLoot(bot.position);

      // Check Victory Condition
      if (this.botManager.getAliveBotsCount() === 0) {
        this.triggerGameOver(true);
      }
    }
  }

  private spawnDeathLoot(pos: THREE.Vector3) {
    const lootRnd = Math.random();
    let lootType: 'shield_battery' | 'ep_drink' | 'medkit' | 'weapon' = 'shield_battery';
    let color = '#38bdf8';
    let name = 'Shield Battery (+50 SHD)';
    let weaponId: string | undefined = undefined;

    if (lootRnd < 0.35) {
      lootType = 'shield_battery';
      color = '#38bdf8';
      name = 'Shield Battery (+50 SHD)';
    } else if (lootRnd < 0.6) {
      lootType = 'ep_drink';
      color = '#facc15';
      name = 'Energy Drink (+50 EP)';
    } else if (lootRnd < 0.85) {
      lootType = 'medkit';
      color = '#10b981';
      name = 'Medical Supply (+75 HP)';
    } else {
      lootType = 'weapon';
      const drops = ['desert_eagle', 'plasma_launcher', 'awm', 'm1887', 'mp40'];
      weaponId = drops[Math.floor(Math.random() * drops.length)];
      const wep = WEAPONS[weaponId];
      color = wep.color;
      name = wep.displayName;
    }

    const mesh = createLootMesh(lootType, color);
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);

    this.lootItems.push({
      mesh,
      data: {
        id: `death_loot_${Date.now()}_${Math.random()}`,
        type: lootType,
        weaponId,
        name,
        position: { x: pos.x, y: 0, z: pos.z },
        color,
      },
    });
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const mat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.bulletTracers.push({ mesh: line, life: 0.08 });
  }

  private spawnParticleBurst(pos: THREE.Vector3, colorHex: number) {
    const pCount = 14;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 4 + 1,
          (Math.random() - 0.5) * 6
        )
      );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particleBursts.push({ points, velocities, life: 0.35 });
  }

  private triggerGameOver(victory: boolean) {
    this.isRunning = false;
    soundEngine.stopBattleMusic();
    if (victory) {
      soundEngine.playBooyah();
    } else {
      soundEngine.playDefeat();
    }
    this.callbacks.onGameOver(victory, this.stats);
  }

  private lastTime: number = 0;

  private animate = () => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.isRunning) {
      this.update(deltaTime);
    }

    this.composer.render();
  };

  private update(deltaTime: number) {
    this.stats.survivalTimeSeconds += deltaTime;

    // 1. Player Movement & Physics
    this.updatePlayerMovement(deltaTime);

    // 2. Super Shield & Cooldown Timer
    if (this.isSuperShieldActive) {
      this.superShieldActiveTimer -= deltaTime;
      if (this.superShieldActiveTimer <= 0) {
        this.isSuperShieldActive = false;
        this.superShieldMesh.visible = false;
        this.superShieldCooldownTimer = 20.0;
      }
    } else if (this.superShieldCooldownTimer > 0) {
      this.superShieldCooldownTimer = Math.max(0, this.superShieldCooldownTimer - deltaTime);
    }

    // 3. Gradual Damage Bleed Decay (Ticks 60% damage smoothly over time)
    if (this.pendingDamageBleed > 0) {
      const bleedTick = Math.min(this.pendingDamageBleed, Math.max(0.5, this.pendingDamageBleed * 0.8) * deltaTime);
      this.pendingDamageBleed -= bleedTick;
      this.health = Math.max(0, this.health - bleedTick);
      if (this.health <= 0) {
        this.checkPlayerKnockdownOrDeath('Damage Bleed');
      }
    }

    // 4. Downed State Bleedout & Revive Handler
    if (this.isPlayerDowned) {
      this.downedBleedTimer -= deltaTime;
      if (this.downedBleedTimer <= 0) {
        this.triggerGameOver(false);
        return;
      }
    }

    // 5. Squad Teammate Revive Casting Progress
    let canReviveNear = false;
    for (let i = 1; i < this.squadMembers.length; i++) {
      const tm = this.squadMembers[i];
      if (tm.status === 'downed') {
        const d = this.playerPos.distanceTo(new THREE.Vector3(tm.position.x, tm.position.y, tm.position.z));
        if (d < 3.5) {
          canReviveNear = true;
          break;
        }
      }
    }

    if (this.isRevivingTeammate && this.nearestDownedTeammateId) {
      this.reviveCastProgress += deltaTime / 3.0; // 3 second revive
      if (this.reviveCastProgress >= 1.0) {
        const tm = this.squadMembers.find(m => m.id === this.nearestDownedTeammateId);
        if (tm) {
          tm.status = 'active';
          tm.hp = 100;
          tm.shieldHp = 50;
        }
        this.isRevivingTeammate = false;
        this.reviveCastProgress = 0;
        this.nearestDownedTeammateId = null;
        soundEngine.playHealSound();
      }
    } else {
      this.reviveCastProgress = 0;
    }

    // 6. Sync Squad Members with BotManager Teammates & Real-time Voice Chat Simulation
    this.squadMembers[0].hp = Math.max(0, Math.round(this.health));
    this.squadMembers[0].shieldHp = Math.max(0, Math.round(this.armor));
    this.squadMembers[0].ep = Math.round(this.ep);
    this.squadMembers[0].position = { x: this.playerPos.x, y: this.playerPos.y, z: this.playerPos.z };
    this.squadMembers[0].kills = this.stats.kills;
    this.squadMembers[0].isSuperShieldActive = this.isSuperShieldActive;
    this.squadMembers[0].isSpeaking = this.isFiring || this.isAiming;
    this.squadMembers[0].voiceIntensity = this.squadMembers[0].isSpeaking
      ? 0.4 + Math.sin(Date.now() * 0.02) * 0.3 + Math.random() * 0.3
      : 0;

    const tacticalCalloutPools = [
      ['Enemy 120 North!', 'Rooftop sniper spotted!', 'Pushing forward!', 'Watch your flanks!'],
      ['Cover me, reloading!', 'Dropping tactical smoke!', 'Target down!', 'Stay inside the safe zone!'],
      ['Super shield deployed!', 'Got your back!', 'Need medical kit!', 'Engaging enemy squad!'],
    ];

    if (this.botManager.squadTeammates.length > 0) {
      for (let i = 0; i < this.botManager.squadTeammates.length; i++) {
        const aiTm = this.botManager.squadTeammates[i];
        const squadMember = this.squadMembers[i + 1];
        const vState = this.squadVoiceChatStates[i + 1];

        if (squadMember && vState) {
          squadMember.hp = Math.max(0, Math.round(aiTm.hp));
          squadMember.shieldHp = Math.max(0, Math.round(aiTm.armor));
          squadMember.position = { x: aiTm.position.x, y: aiTm.position.y, z: aiTm.position.z };
          if (aiTm.isDead) {
            squadMember.status = 'eliminated';
            squadMember.isSpeaking = false;
            squadMember.voiceIntensity = 0;
            squadMember.activeVoiceLine = undefined;
            vState.isTalking = false;
          } else {
            // Update organic voice chat intervals
            vState.talkTimer -= deltaTime;
            if (vState.isTalking) {
              vState.duration -= deltaTime;
              // Modulate real-time voice waveform intensity with rhythmic audio harmonic simulation
              const t = Date.now() * 0.018 + i * 3.7;
              vState.intensity = 0.35 + Math.abs(Math.sin(t)) * 0.4 + Math.abs(Math.cos(t * 1.6)) * 0.25;
              squadMember.isSpeaking = true;
              squadMember.voiceIntensity = Math.min(1.0, vState.intensity);
              squadMember.activeVoiceLine = vState.voiceLine;

              if (vState.duration <= 0) {
                vState.isTalking = false;
                vState.talkTimer = 4.0 + Math.random() * 7.0; // Next talk delay
                squadMember.isSpeaking = false;
                squadMember.voiceIntensity = 0;
                squadMember.activeVoiceLine = undefined;
              }
            } else if (vState.talkTimer <= 0) {
              // Begin speaking
              vState.isTalking = true;
              vState.duration = 2.2 + Math.random() * 2.8;
              const pool = tacticalCalloutPools[i] || tacticalCalloutPools[0];
              vState.voiceLine = pool[Math.floor(Math.random() * pool.length)];
              squadMember.isSpeaking = true;
              squadMember.voiceIntensity = 0.6;
              squadMember.activeVoiceLine = vState.voiceLine;
            } else {
              squadMember.isSpeaking = false;
              squadMember.voiceIntensity = 0;
              squadMember.activeVoiceLine = undefined;
            }
          }
        }
      }
    }

    // 7. 100-Player Battle Royale Background Skirmish Simulation
    this.backgroundSkirmishTimer -= deltaTime;
    if (this.backgroundSkirmishTimer <= 0) {
      this.backgroundSkirmishTimer = 3.5 + Math.random() * 4.0;
      if (this.totalCombatantsAlive > this.botManager.getAliveBotsCount() + 4) {
        const eliminated = Math.floor(1 + Math.random() * 3);
        this.totalCombatantsAlive = Math.max(this.botManager.getAliveBotsCount() + 4, this.totalCombatantsAlive - eliminated);

        // Feed background kill in feed
        const botNames = ['ShadowReaper', 'GhostSniper', 'Vortex', 'CyberSamurai', 'ApexStalker', 'NovaPulse', 'IronClad'];
        const killer = botNames[Math.floor(Math.random() * botNames.length)];
        const victim = `Soldier_${Math.floor(Math.random() * 90) + 10}`;
        const weapons = ['AK-47', 'AWM Sniper', 'M1887 Shotgun', 'Plasma Mortar', 'MP40'];
        this.callbacks.onKillFeed({
          id: `skirmish_${Date.now()}`,
          killer,
          victim,
          weaponName: weapons[Math.floor(Math.random() * weapons.length)],
          isHeadshot: Math.random() > 0.6,
          isPlayerKiller: false,
          timestamp: Date.now(),
        });
      }
    }

    // 8. Shield & Health Regeneration System
    this.timeSinceLastDamage += deltaTime;
    if (this.timeSinceLastDamage > 3.8 && this.armor < this.maxArmor) {
      this.armor = Math.min(this.maxArmor, this.armor + deltaTime * 18);
    }
    if (this.ep > 0 && this.health < this.maxHealth) {
      const epBurn = deltaTime * 3.5;
      if (this.ep >= epBurn) {
        this.ep -= epBurn;
        this.health = Math.min(this.maxHealth, this.health + deltaTime * 4.5);
      }
    }

    // 9. Safe Zone Shrinking & Damage
    this.updateSafeZone(deltaTime);

    // 10. Reloading & Weapons
    this.updateWeapons(deltaTime);

    // 11. Hero Skill timers
    this.updateHeroSkill(deltaTime);

    // 12. Bot AI Updates (Opponents + Squad Teammates)
    this.botManager.update(
      deltaTime,
      this.playerPos,
      this.health,
      this.safeZoneCenter,
      this.safeZoneRadius,
      (bot, aimTarget) => this.onBotShootAtPlayer(bot, aimTarget),
      bot => this.onBotDeployGloo(bot),
      (bot, meleeDmg) => this.onBotMeleeAttack(bot, meleeDmg),
      this.isPlayerDowned,
      () => this.onTeammateRevivePlayer(),
      (enemy, dmg) => this.applyDamageToBot(enemy, dmg, false, 'Squad Support Fire')
    );

    // 13. Tactical Ping Waypoints Decay
    for (let i = this.tacticalPingWaypoints.length - 1; i >= 0; i--) {
      if (Date.now() - this.tacticalPingWaypoints[i].timestamp > 15000) {
        this.tacticalPingWaypoints.splice(i, 1);
        if (this.tacticalBeaconMeshes[i]) {
          this.scene.remove(this.tacticalBeaconMeshes[i]);
          this.tacticalBeaconMeshes.splice(i, 1);
        }
      }
    }

    // 14. Airdrops & Loot Pickups
    this.updateAirdrops(deltaTime);
    this.checkLootPickups();

    // 15. Visual Tracers & Particles
    this.updateTracersAndParticles(deltaTime);
    this.updateEmoteBillboards(deltaTime);

    // 16. Third-Person Camera Tracking
    this.updateCamera();

    // 17. Sync HUD Callbacks
    this.callbacks.onStatsUpdate({
      health: Math.max(0, Math.round(this.health)),
      maxHealth: this.maxHealth,
      armor: Math.max(0, Math.round(this.armor)),
      maxArmor: this.maxArmor,
      ep: Math.round(this.ep),
      activeSlotIndex: this.activeSlotIndex,
      slots: this.inventorySlots,
      glooWalls: this.glooWallsCount,
      medkits: this.medkitsCount,
      aliveCount: this.botManager.getAliveBotsCount() + (this.health > 0 || this.isPlayerDowned ? 1 : 0),
      kills: this.stats.kills,
      headshots: this.stats.headshots,
      isAiming: this.isAiming,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading ? 1 - this.reloadTimer / this.reloadDuration : 0,
      skillCooldownRemaining: Math.max(0, this.skillCooldownTimer),
      isSkillActive: this.isSkillActive,
      safeZoneRadius: this.safeZoneRadius,
      safeZoneTimer: Math.max(0, Math.round(this.safeZoneTimer)),
      // Squad & BR Matchmaking
      squadMembers: this.squadMembers,
      totalCombatants: this.totalCombatantsAlive,
      matchmakingPing: this.matchmakingPing,
      // Super Shield Barrier
      superShieldHp: this.superShieldHp,
      maxSuperShieldHp: this.maxSuperShieldHp,
      isSuperShieldActive: this.isSuperShieldActive,
      superShieldCooldownRemaining: Math.max(0, this.superShieldCooldownTimer),
      // Bleed
      pendingDamageBleed: Math.round(this.pendingDamageBleed),
      // Downed & Reviving
      isPlayerDowned: this.isPlayerDowned,
      downedBleedTimer: Math.max(0, Math.round(this.downedBleedTimer)),
      canReviveNear,
      isReviving: this.isRevivingTeammate,
      reviveProgress: this.reviveCastProgress,
      // Tactical Pings
      tacticalPingWaypoints: this.tacticalPingWaypoints,
    });
  }

  private onTeammateRevivePlayer() {
    if (!this.isPlayerDowned) return;
    this.isPlayerDowned = false;
    this.health = 100;
    this.armor = 50;
    this.pendingDamageBleed = 0;
    this.squadMembers[0].status = 'active';
    soundEngine.playHealSound();
  }

  private checkPlayerKnockdownOrDeath(reason: string) {
    const aliveTeammates = this.squadMembers.slice(1).filter(tm => tm.status === 'active');
    if (aliveTeammates.length > 0 && !this.isPlayerDowned) {
      this.isPlayerDowned = true;
      this.health = 0;
      this.downedBleedTimer = 30.0;
      this.squadMembers[0].status = 'downed';
      soundEngine.playHitMarker();
    } else if (!this.isPlayerDowned) {
      this.health = 0;
      this.triggerGameOver(false);
    }
  }

  private updatePlayerMovement(deltaTime: number) {
    if (this.isSliding) {
      this.slideTimer -= deltaTime;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.isCrouching = true; // Slide ends in crouch
      }
    }
    const moveVector = new THREE.Vector3();
    const isSprinting = (this.keys['shift'] || this.joystickInput.isSprinting) && !this.isCrouching && !this.isAiming;
    
    let baseSpeed = this.isSliding ? 14.0 : (this.isProne ? 1.5 : (this.isCrouching ? 3.5 : (isSprinting ? 11.0 : 7.0)));
    const speed = baseSpeed * this.hero.speedMultiplier * (this.isSkillActive && this.hero.id === 'kelly' ? 1.4 : 1.0);

    // Keyboard movement
    if (this.keys['w'] || this.keys['arrowup']) moveVector.z += 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveVector.z -= 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveVector.x += 1;
    if (this.keys['d'] || this.keys['arrowright']) moveVector.x -= 1;

    // Mobile Virtual Joystick movement
    if (Math.abs(this.joystickInput.x) > 0.05 || Math.abs(this.joystickInput.y) > 0.05) {
      moveVector.x += -this.joystickInput.x;
      moveVector.z += this.joystickInput.y;
    }

    if (moveVector.lengthSq() > 0) {
      if (moveVector.length() > 1) moveVector.normalize();
      // Rotate by player orientation
      const forward = new THREE.Vector3(Math.sin(this.playerRotationY), 0, Math.cos(this.playerRotationY));
      const right = new THREE.Vector3(Math.cos(this.playerRotationY), 0, -Math.sin(this.playerRotationY));

      this.playerVelocity.x = (forward.x * moveVector.z + right.x * moveVector.x) * speed;
      this.playerVelocity.z = (forward.z * moveVector.z + right.z * moveVector.x) * speed;
    } else {
      this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, 0, 0.2);
      this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, 0, 0.2);
    }

    // Jump / Gravity
    if (this.keys[' '] && this.isGrounded) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
      soundEngine.playJump();
    }

    if (!this.isGrounded) {
      this.playerVelocity.y -= 22 * deltaTime; // gravity
    }

    this.playerPos.x += this.playerVelocity.x * deltaTime;
    this.playerPos.z += this.playerVelocity.z * deltaTime;
    this.playerPos.y += this.playerVelocity.y * deltaTime;

    // Floor collision
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Mesh position & rotation
    this.playerWarrior.root.position.copy(this.playerPos);
    this.playerWarrior.root.rotation.y = this.playerRotationY;
    
    // Smoothly scale the mesh visually to represent stance
    let targetScaleY = 1.0;
    if (this.isProne) targetScaleY = 0.25;
    else if (this.isCrouching || this.isSliding) targetScaleY = 0.55;
    
    this.playerWarrior.root.scale.y = THREE.MathUtils.lerp(this.playerWarrior.root.scale.y, targetScaleY, 15 * deltaTime);
    // Lower position to keep it grounded while scaled
    this.playerWarrior.root.position.y = this.playerPos.y + (1.0 - this.playerWarrior.root.scale.y) * 0.1;

    // Crouch status
    // Removed direct crouch bind

    // Slash timer
    if (this.isSlashing) {
      this.slashTimer -= deltaTime;
      if (this.slashTimer <= 0) this.isSlashing = false;
    }

    const currentSpeed = new THREE.Vector2(this.playerVelocity.x, this.playerVelocity.z).length();
    this.playerWarrior.updateAnimation(
      deltaTime,
      currentSpeed,
      this.isAiming,
      this.isFiring,
      this.isCrouching,
      !this.isGrounded,
      this.isSlashing
    );
  }

  private updateSafeZone(deltaTime: number) {
    if (this.safeZoneTimer > 0) {
      this.safeZoneTimer -= deltaTime;
    } else {
      // Shrink zone
      this.safeZoneRadius = Math.max(12, this.safeZoneRadius - this.levelConfig.safeZoneShrinkSpeed * deltaTime * 12);
      this.safeZoneMesh.scale.set(
        this.safeZoneRadius / this.initialRadius,
        1,
        this.safeZoneRadius / this.initialRadius
      );
    }

    // Safe Zone electric damage
    const distToCenter = new THREE.Vector2(this.playerPos.x - this.safeZoneCenter.x, this.playerPos.z - this.safeZoneCenter.z).length();
    if (distToCenter > this.safeZoneRadius) {
      const stormDmg = deltaTime * (8 + this.levelConfig.levelNumber * 2.5);
      this.health -= stormDmg;
      if (this.health <= 0) {
        this.health = 0;
        this.triggerGameOver(false);
      }
    }
  }

  private updateWeapons(deltaTime: number) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }

    if (this.isReloading) {
      this.reloadTimer -= deltaTime;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const slot = this.inventorySlots[this.activeSlotIndex];
        if (slot) {
          const needed = slot.weapon.magazineSize - slot.currentAmmo;
          const transfer = Math.min(needed, slot.reserveAmmo);
          slot.currentAmmo += transfer;
          slot.reserveAmmo -= transfer;
        }
      }
    }

    // Auto shoot or held firing
    if (this.isFiring || this.autoShoot) {
      const slot = this.inventorySlots[this.activeSlotIndex];
      if (slot && this.shootCooldown <= 0 && !this.isReloading) {
        this.shootCooldown = 1 / slot.weapon.fireRate;
        this.performPlayerShoot();
      }
    }
  }

  private updateHeroSkill(deltaTime: number) {
    if (this.skillCooldownTimer > 0) {
      this.skillCooldownTimer -= deltaTime;
    }

    if (this.isSkillActive) {
      this.skillActiveTimer -= deltaTime;

      // Alok Healing Pulse
      if (this.hero.id === 'alok') {
        this.health = Math.min(this.maxHealth, this.health + deltaTime * 5);
      }

      if (this.skillActiveTimer <= 0) {
        this.isSkillActive = false;
        if (this.playerWarrior.auraMesh) {
          (this.playerWarrior.auraMesh.material as THREE.Material).opacity = 0;
        }
        if (this.playerWarrior.shieldMesh) {
          (this.playerWarrior.shieldMesh.material as THREE.Material).opacity = 0;
        }
      }
    }
  }

  private onBotShootAtPlayer(bot: BotEntity, aimTarget: THREE.Vector3) {
    if (this.health <= 0) return;

    // Spawn bot tracer
    this.spawnTracer(bot.position.clone().add(new THREE.Vector3(0, 1.2, 0)), aimTarget);

    // Enforcer AoE Mortar Explosive Attack
    if (bot.archetype.id === 'enforcer' || bot.weapon.isAoE) {
      soundEngine.playExplosion();
      this.spawnParticleBurst(aimTarget, 0xef4444);
      const distToBlast = aimTarget.distanceTo(this.playerPos);
      if (distToBlast < 4.5) {
        if (this.isSkillActive && this.hero.id === 'chrono') {
          soundEngine.playHitMarker();
          return;
        }
        const splashFalloff = 1 - distToBlast / 4.5;
        let aoeDmg = Math.round(bot.weapon.damage * Math.max(0.35, splashFalloff));
        this.applyDamageToPlayer(aoeDmg, bot.name, 'Plasma Mortar Blast');
      }
      return;
    }

    // Direct bullet / sniper shot check
    const distToAim = aimTarget.distanceTo(this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)));
    if (distToAim < 1.15) {
      // Chrono Shield deflection
      if (this.isSkillActive && this.hero.id === 'chrono') {
        soundEngine.playHitMarker();
        return;
      }

      let dmg = bot.weapon.damage * 0.75;
      if (this.isCrouching) dmg *= 0.8;
      this.applyDamageToPlayer(dmg, bot.name, bot.weapon.displayName);
    }
  }

  private onBotMeleeAttack(bot: BotEntity, damage: number) {
    if (this.health <= 0) return;

    if (this.isSkillActive && this.hero.id === 'chrono') {
      soundEngine.playHitMarker();
      return;
    }

    this.applyDamageToPlayer(damage, bot.name, 'Katana Blade Strike');
  }

  private applyDamageToPlayer(rawDamage: number, attackerName: string, weaponName: string) {
    this.timeSinceLastDamage = 0; // Reset auto-recharge delay

    let dmg = rawDamage;

    // 1. SUPER SHIELD BARRIER (1,200 HP, 85% Absorption, 15% EP Conversion)
    if (this.isSuperShieldActive && this.superShieldHp > 0) {
      const absorbed = dmg * 0.85;
      const remaining = dmg * 0.15;

      this.superShieldHp = Math.max(0, this.superShieldHp - absorbed);
      // 15% converted into EP
      this.ep = Math.min(100, this.ep + dmg * 0.15);
      soundEngine.playShieldHit();

      if (this.superShieldHp <= 0) {
        this.isSuperShieldActive = false;
        this.superShieldMesh.visible = false;
        this.superShieldCooldownTimer = 20.0;
        soundEngine.playShieldBreak();
      }
      dmg = remaining;
    }

    // 2. Standard Shield Absorption
    if (this.armor > 0 && dmg > 0) {
      if (this.armor >= dmg) {
        this.armor -= dmg;
        dmg = 0;
        soundEngine.playShieldHit();
      } else {
        dmg -= this.armor;
        this.armor = 0;
        soundEngine.playShieldBreak();
      }
    }

    // 3. Gradual Damage Bleed Decay (40% Instant / 60% Bleed Decay over 4s)
    if (dmg > 0) {
      const instantDmg = dmg * 0.40;
      const bleedDmg = dmg * 0.60;
      this.health = Math.max(0, this.health - instantDmg);
      this.pendingDamageBleed += bleedDmg;
    }

    soundEngine.playHitMarker();
    mobileHaptic.triggerImpact();
    this.spawnParticleBurst(this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xef4444);

    if (this.health <= 0) {
      this.checkPlayerKnockdownOrDeath(attackerName);
    }
  }

  private onBotDeployGloo(bot: BotEntity) {
    const wallMesh = createGlooWallMesh();
    const spawnDist = 2.2;
    const forwardX = Math.sin(bot.rotationY) * spawnDist;
    const forwardZ = Math.cos(bot.rotationY) * spawnDist;

    wallMesh.position.set(bot.position.x + forwardX, 0, bot.position.z + forwardZ);
    wallMesh.rotation.y = bot.rotationY;
    this.scene.add(wallMesh);

    this.glooWalls.push({
      mesh: wallMesh,
      data: {
        id: `bot_gloo_${Date.now()}`,
        position: { x: bot.position.x + forwardX, y: 0, z: bot.position.z + forwardZ },
        rotationY: bot.rotationY,
        hp: 350,
        maxHp: 350,
        createdTime: Date.now(),
      },
    });

    soundEngine.playGlooWallDeploy();
  }

  private updateAirdrops(deltaTime: number) {
    for (const ad of this.airdrops) {
      if (ad.falling) {
        ad.mesh.position.y -= deltaTime * 8;
        if (ad.mesh.position.y <= 0) {
          ad.mesh.position.y = 0;
          ad.falling = false;
          // Spawn loot on ground
          for (const item of ad.loot) {
            this.lootItems.push({
              mesh: createLootMesh(item.type, item.color),
              data: item,
            });
          }
        }
      }
    }
  }

  private checkLootPickups() {
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
      const dist = this.playerPos.distanceTo(item.mesh.position);
      if (dist < 2.5) {
        // Collect loot
        this.collectLoot(item.data);
        this.scene.remove(item.mesh);
        this.lootItems.splice(i, 1);
        soundEngine.playLootPickup();
      }
    }
  }

  private collectLoot(data: LootPickupItem) {
    if (data.type === 'medkit') {
      this.medkitsCount = Math.min(6, this.medkitsCount + 1);
    } else if (data.type === 'gloowall') {
      this.glooWallsCount = Math.min(8, this.glooWallsCount + 1);
    } else if (data.type === 'armor') {
      this.armor = this.maxArmor;
      soundEngine.playShieldRecharge();
    } else if (data.type === 'shield_battery') {
      this.armor = Math.min(this.maxArmor, this.armor + 50);
      soundEngine.playShieldRecharge();
    } else if (data.type === 'ep_drink') {
      this.ep = Math.min(100, this.ep + 50);
      soundEngine.playHealSound();
    } else if (data.type === 'ammo') {
      this.inventorySlots.forEach(s => (s.reserveAmmo += 45));
    } else if (data.type === 'weapon' && data.weaponId) {
      const newWep = WEAPONS[data.weaponId];
      if (newWep) {
        this.inventorySlots[this.activeSlotIndex] = {
          weapon: newWep,
          currentAmmo: newWep.magazineSize,
          reserveAmmo: newWep.magazineSize * 3,
        };
        this.updateEquippedWeaponMesh();
      }
    }
  }

  private updateTracersAndParticles(deltaTime: number) {
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const t = this.bulletTracers[i];
      t.life -= deltaTime;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        this.bulletTracers.splice(i, 1);
      }
    }

    for (let i = this.particleBursts.length - 1; i >= 0; i--) {
      const p = this.particleBursts[i];
      p.life -= deltaTime;
      const positions = p.points.geometry.attributes.position.array as Float32Array;

      for (let j = 0; j < p.velocities.length; j++) {
        positions[j * 3] += p.velocities[j].x * deltaTime;
        positions[j * 3 + 1] += p.velocities[j].y * deltaTime;
        positions[j * 3 + 2] += p.velocities[j].z * deltaTime;
        p.velocities[j].y -= 9.8 * deltaTime; // particle gravity
      }
      p.points.geometry.attributes.position.needsUpdate = true;

      if (p.life <= 0) {
        this.scene.remove(p.points);
        this.particleBursts.splice(i, 1);
      }
    }
  }

  public triggerEmote(emote: EmoteData) {
    if (this.health <= 0) return;

    // Trigger character model emote pose & animation
    this.playerWarrior.playEmote(emote.animationType, 2.8);

    // Audio cue
    soundEngine.playEmoteSound(emote.soundType);

    // Overhead 3D holographic billboard sprite
    this.createEmoteBillboard(emote, this.playerPos);

    // Dynamic themed particle burst
    const hexColor = parseInt(emote.particleColor.replace('#', '0x'), 16) || 0xfbbf24;
    this.spawnParticleBurst(this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)), hexColor);
    this.spawnParticleBurst(this.playerPos.clone().add(new THREE.Vector3(0, 2.2, 0)), 0xffffff);

    // Inform callback
    this.callbacks.onEmoteTriggered?.({
      id: `emote_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender: this.hero.name,
      emote,
      timestamp: Date.now(),
    });
  }

  private createEmoteBillboard(emote: EmoteData, position: THREE.Vector3) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear transparent
    ctx.clearRect(0, 0, 512, 256);

    // Subtle radial glow
    const radial = ctx.createRadialGradient(256, 128, 40, 256, 128, 240);
    radial.addColorStop(0, emote.particleColor ? `${emote.particleColor}55` : 'rgba(251, 191, 36, 0.35)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 512, 256);

    // Stylized rounded badge card
    ctx.fillStyle = 'rgba(12, 14, 24, 0.88)';
    ctx.strokeStyle = emote.particleColor || '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(36, 36, 440, 184, 32);
    ctx.fill();
    ctx.stroke();

    // Emote emoji
    ctx.font = 'bold 84px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emote.icon, 115, 128);

    // Emote title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(emote.name.toUpperCase(), 185, 108);

    // Category / Tag
    ctx.fillStyle = emote.particleColor || '#fbbf24';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`★ ${emote.category.toUpperCase()} EMOTE ★`, 185, 155);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.6, 1);
    sprite.position.set(position.x, position.y + 2.7, position.z);
    this.scene.add(sprite);

    this.activeEmoteBillboards.push({
      sprite,
      life: 2.8,
      maxLife: 2.8,
      yOffset: 2.7,
    });
  }

  private updateEmoteBillboards(deltaTime: number) {
    for (let i = this.activeEmoteBillboards.length - 1; i >= 0; i--) {
      const eb = this.activeEmoteBillboards[i];
      eb.life -= deltaTime;
      eb.yOffset += deltaTime * 0.45; // float upward smoothly
      eb.sprite.position.set(this.playerPos.x, this.playerPos.y + eb.yOffset, this.playerPos.z);

      const progress = 1 - (eb.life / eb.maxLife);
      if (progress > 0.65) {
        // Fade out
        const fade = eb.life / (eb.maxLife * 0.35);
        (eb.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, fade);
      }

      if (eb.life <= 0) {
        this.scene.remove(eb.sprite);
        if (eb.sprite.material.map) eb.sprite.material.map.dispose();
        eb.sprite.material.dispose();
        this.activeEmoteBillboards.splice(i, 1);
      }
    }
  }

  private updateCamera() {
    // Dynamic Third-Person Shoulder Cam
    const targetDist = this.isAiming ? 2.2 : 4.6;
    const targetHeight = this.isAiming ? 1.55 : (this.isProne ? 0.6 : (this.isCrouching || this.isSliding ? 1.3 : 2.0));
    const shoulderOffset = this.isAiming ? 0.65 : 0.75;

    const fovTarget = this.isAiming ? (this.getActiveWeapon().type === 'sniper' ? 24 : 45) : 65;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, fovTarget, 0.25);
    this.camera.updateProjectionMatrix();

    // Calculate camera target offset
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);

    const camX = this.playerPos.x - Math.sin(this.playerRotationY) * targetDist * cosPitch + Math.cos(this.playerRotationY) * shoulderOffset;
    const camZ = this.playerPos.z - Math.cos(this.playerRotationY) * targetDist * cosPitch - Math.sin(this.playerRotationY) * shoulderOffset;
    const camY = this.playerPos.y + targetHeight + targetDist * sinPitch;

    this.camera.position.lerp(new THREE.Vector3(camX, Math.max(0.4, camY), camZ), 0.35);

    // Look at point ahead of player
    const lookTarget = new THREE.Vector3(
      this.playerPos.x + Math.sin(this.playerRotationY) * 20,
      this.playerPos.y + 1.4 - this.cameraPitch * 10,
      this.playerPos.z + Math.cos(this.playerRotationY) * 20
    );
    this.camera.lookAt(lookTarget);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) this.composer.setSize(width, height);
  };

  public dispose() {
    this.isDisposed = true;
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    soundEngine.stopBattleMusic();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
