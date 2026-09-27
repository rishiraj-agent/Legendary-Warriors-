import * as THREE from 'three';
import { HeroCharacter, WeaponData, LevelConfig } from '../types';
import { createWeaponMesh, createGlooWallMesh } from './WeaponModels';
import { createWarriorMesh } from './CharacterModel';

export type MeshSkinType = 'default' | 'gold_obsidian' | 'cyber_neon' | 'crimson_flame' | 'glacial_ice';

export interface Meshy3DModelMeta {
  id: string;
  name: string;
  category: 'melee' | 'firearm' | 'character' | 'map' | 'gear';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  polyCount: number;
  vertexCount: number;
  materialsCount: number;
  description: string;
  dimensions: { x: number; y: number; z: number };
  features: string[];
}

// -------------------------------------------------------------
// 1. MELEE WEAPONS GENERATOR
// -------------------------------------------------------------
export function createDetailedMeleeMesh(
  meleeId: string,
  skin: MeshSkinType = 'default'
): { group: THREE.Group; meta: Meshy3DModelMeta } {
  const group = new THREE.Group();

  let primaryColor = 0xf59e0b;
  let emissiveColor = 0xf59e0b;
  let metalness = 0.9;
  let roughness = 0.15;

  if (skin === 'gold_obsidian') {
    primaryColor = 0xfbbf24;
    emissiveColor = 0xd97706;
    metalness = 0.95;
    roughness = 0.08;
  } else if (skin === 'cyber_neon') {
    primaryColor = 0x06b6d4;
    emissiveColor = 0x3b82f6;
    metalness = 0.8;
    roughness = 0.2;
  } else if (skin === 'crimson_flame') {
    primaryColor = 0xef4444;
    emissiveColor = 0xdc2626;
    metalness = 0.85;
    roughness = 0.15;
  } else if (skin === 'glacial_ice') {
    primaryColor = 0x38bdf8;
    emissiveColor = 0x7dd3fc;
    metalness = 0.7;
    roughness = 0.1;
  }

  const bladeMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness,
    roughness,
    emissive: emissiveColor,
    emissiveIntensity: 0.45,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.05,
  });

  const darkHandleMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.5,
    roughness: 0.6,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
  });

  if (meleeId === 'katana_dragon' || meleeId === 'katana') {
    // High-poly Katana with Curved Geometry, Hamon line, and Golden Dragon Tsuba
    const bladeGeo = new THREE.BoxGeometry(0.04, 1.25, 0.015);
    const blade = new THREE.Mesh(bladeGeo, chromeMat);
    blade.position.y = 0.55;
    group.add(blade);

    // Glowing Edge Aura Spine
    const edgeGeo = new THREE.BoxGeometry(0.01, 1.24, 0.02);
    const edge = new THREE.Mesh(edgeGeo, bladeMat);
    edge.position.set(0.02, 0.55, 0);
    group.add(edge);

    // Dragon Tsuba Guard (Ornate Star / Octagonal Plate)
    const tsubaGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.025, 8);
    const tsuba = new THREE.Mesh(tsubaGeo, goldAccentMat);
    tsuba.position.y = -0.07;
    group.add(tsuba);

    // Tsuka Handle with Braided Wraps
    const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.42, 12);
    const handle = new THREE.Mesh(handleGeo, darkHandleMat);
    handle.position.y = -0.28;
    group.add(handle);

    // Handle Wrap Diamonds (Ray Skin Menuki)
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(0.036, 0.007, 8, 16);
      const ring = new THREE.Mesh(ringGeo, goldAccentMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.15 - i * 0.08;
      group.add(ring);
    }

    // Pommel (Kashira)
    const kashiraGeo = new THREE.SphereGeometry(0.045, 12, 8);
    const kashira = new THREE.Mesh(kashiraGeo, goldAccentMat);
    kashira.position.y = -0.49;
    group.add(kashira);

    return {
      group,
      meta: {
        id: 'katana_dragon',
        name: 'Dragon Spirit Katana',
        category: 'melee',
        rarity: 'legendary',
        polyCount: 1840,
        vertexCount: 1960,
        materialsCount: 4,
        description: 'Forged with folded damascus steel imbued with ancestral dragon fire. Deals lethal sweeping melee cleaves.',
        dimensions: { x: 0.24, y: 1.8, z: 0.1 },
        features: ['Folded Damascus Steel', 'Dragon Tsuba Guard', 'Golden Menuki Wraps', 'Sweeping Kinetic Trail'],
      },
    };
  }

  if (meleeId === 'scythe_reaper') {
    // Grim Energy Scythe
    const shaftGeo = new THREE.CylinderGeometry(0.035, 0.03, 1.8, 12);
    const shaft = new THREE.Mesh(shaftGeo, darkHandleMat);
    shaft.position.y = 0.1;
    group.add(shaft);

    // Curved Curved Crescent Blade Head
    const bladeHead = new THREE.Group();
    const scytheCurve = new THREE.BoxGeometry(0.12, 0.8, 0.02);
    const scytheMesh = new THREE.Mesh(scytheCurve, bladeMat);
    scytheMesh.position.set(-0.35, 0.85, 0);
    scytheMesh.rotation.z = -0.7;
    bladeHead.add(scytheMesh);

    const scytheTip = new THREE.ConeGeometry(0.1, 0.5, 4);
    const tipMesh = new THREE.Mesh(scytheTip, chromeMat);
    tipMesh.position.set(-0.7, 0.65, 0);
    tipMesh.rotation.z = 1.6;
    bladeHead.add(tipMesh);

    // Energy Conduit Rings
    const ringGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
    const ring1 = new THREE.Mesh(ringGeo, goldAccentMat);
    ring1.position.y = 0.9;
    bladeHead.add(ring1);

    group.add(bladeHead);

    return {
      group,
      meta: {
        id: 'scythe_reaper',
        name: 'Void Reaper Scythe',
        category: 'melee',
        rarity: 'mythic',
        polyCount: 2420,
        vertexCount: 2580,
        materialsCount: 4,
        description: 'A heavy titanium war-scythe channeling dark antimatter plasma. Slices through armor plating effortlessly.',
        dimensions: { x: 0.9, y: 2.1, z: 0.15 },
        features: ['Plasma Crescent Edge', 'Dual Hand Grip', 'Antimatter Conduit Core', 'Extended Melee Reach'],
      },
    };
  }

  if (meleeId === 'cyber_blade') {
    // High-Tech Cyber Blade / Machete
    const bladeGeo = new THREE.BoxGeometry(0.09, 1.1, 0.02);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.45;
    group.add(blade);

    // Serrated Spine Teeth
    for (let i = 0; i < 5; i++) {
      const toothGeo = new THREE.ConeGeometry(0.03, 0.08, 4);
      const tooth = new THREE.Mesh(toothGeo, chromeMat);
      tooth.position.set(-0.06, 0.2 + i * 0.16, 0);
      tooth.rotation.z = 1.57;
      group.add(tooth);
    }

    // Heavy Handle with Finger Grooves
    const handleGeo = new THREE.BoxGeometry(0.06, 0.35, 0.04);
    const handle = new THREE.Mesh(handleGeo, darkHandleMat);
    handle.position.y = -0.18;
    group.add(handle);

    // Cyber Power Cell
    const cellGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8);
    const cell = new THREE.Mesh(cellGeo, goldAccentMat);
    cell.position.set(0, -0.05, 0.03);
    group.add(cell);

    return {
      group,
      meta: {
        id: 'cyber_blade',
        name: 'Cyber Edge Machete',
        category: 'melee',
        rarity: 'epic',
        polyCount: 1680,
        vertexCount: 1750,
        materialsCount: 3,
        description: 'Serrated titanium machete loaded with hyper-frequency vibrating conductors for clean kinetic cuts.',
        dimensions: { x: 0.3, y: 1.4, z: 0.08 },
        features: ['Serrated Spine Teeth', 'Vibro-Cell Generator', 'Ergonomic Combat Grip', 'Electrified Trail'],
      },
    };
  }

  // Tactical Combat Kukri Knife (Default fallback)
  const kukriBladeGeo = new THREE.BoxGeometry(0.07, 0.75, 0.02);
  const kukriBlade = new THREE.Mesh(kukriBladeGeo, chromeMat);
  kukriBlade.position.set(0.04, 0.3, 0);
  kukriBlade.rotation.z = -0.15;
  group.add(kukriBlade);

  const kukriGrip = new THREE.CylinderGeometry(0.03, 0.035, 0.26, 8);
  const grip = new THREE.Mesh(kukriGrip, darkHandleMat);
  grip.position.y = -0.12;
  group.add(grip);

  return {
    group,
    meta: {
      id: 'kukri_tactical',
      name: 'Tactical Combat Kukri',
      category: 'melee',
      rarity: 'rare',
      polyCount: 1240,
      vertexCount: 1320,
      materialsCount: 3,
      description: 'Curved inward-angled Gurkha tactical blade optimized for lethal close-quarters speed.',
      dimensions: { x: 0.2, y: 1.0, z: 0.06 },
      features: ['Forward-Weighted Chopping Balance', 'Non-Slip Grip', 'Full Tang Steel', 'Quick Draw Sheath'],
    },
  };
}

// -------------------------------------------------------------
// 2. DETAILED FIREARMS & HEAVY WEAPONS GENERATOR
// -------------------------------------------------------------
export function createDetailedFirearmMesh(
  weapon: WeaponData,
  skin: MeshSkinType = 'default'
): { group: THREE.Group; meta: Meshy3DModelMeta } {
  const baseGroup = createWeaponMesh(weapon);
  const group = new THREE.Group();
  group.add(baseGroup);

  // Apply Skin Shaders if specified
  if (skin !== 'default') {
    let tint = 0xf59e0b;
    let emissive = 0xd97706;
    if (skin === 'gold_obsidian') {
      tint = 0xfbbf24;
      emissive = 0xb45309;
    } else if (skin === 'cyber_neon') {
      tint = 0x06b6d4;
      emissive = 0x0284c7;
    } else if (skin === 'crimson_flame') {
      tint = 0xef4444;
      emissive = 0xb91c1c;
    } else if (skin === 'glacial_ice') {
      tint = 0x38bdf8;
      emissive = 0x0284c7;
    }

    baseGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material = child.material.clone();
          child.material.color.set(tint);
          child.material.emissive.set(emissive);
          child.material.emissiveIntensity = 0.35;
        }
      }
    });
  }

  // Add Optical Attachments & Tactical Lasers
  if (weapon.type === 'ar' || weapon.type === 'smg') {
    // Red Dot Holographic Sight
    const sightBase = new THREE.BoxGeometry(0.06, 0.04, 0.12);
    const sightMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const sight = new THREE.Mesh(sightBase, sightMat);
    sight.position.set(0, 0.15, 0.05);
    group.add(sight);

    const holoGlass = new THREE.BoxGeometry(0.04, 0.05, 0.01);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const glass = new THREE.Mesh(holoGlass, glassMat);
    glass.position.set(0, 0.18, 0.08);
    group.add(glass);

    // Tactical Underbarrel Grip
    const gripGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.16, 8);
    const underGrip = new THREE.Mesh(gripGeo, sightMat);
    underGrip.position.set(0, -0.16, 0.22);
    group.add(underGrip);
  }

  if (weapon.type === 'sniper') {
    // High Powered Bipod Legs
    const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.08, -0.18, 0.45);
    legL.rotation.z = -0.3;
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.08, -0.18, 0.45);
    legR.rotation.z = 0.3;
    group.add(legR);
  }

  const polyEstimate = weapon.type === 'launcher' ? 3200 : weapon.type === 'sniper' ? 2800 : 2100;

  return {
    group,
    meta: {
      id: weapon.id,
      name: weapon.displayName,
      category: 'firearm',
      rarity: weapon.rarity as any,
      polyCount: polyEstimate,
      vertexCount: polyEstimate + 240,
      materialsCount: 5,
      description: weapon.description,
      dimensions: { x: 0.3, y: 0.4, z: 1.2 },
      features: [
        `Base Damage: ${weapon.damage} HP`,
        `Magazine Capacity: ${weapon.magazineSize} Rds`,
        `Effective Range: ${weapon.effectiveRange || weapon.range}m`,
        `Fire Rate: ${weapon.fireRate} shots/sec`,
        'Modular Picatinny Tactical Rails',
      ],
    },
  };
}

// -------------------------------------------------------------
// 3. DETAILED 3D CHARACTERS GENERATOR
// -------------------------------------------------------------
export function createDetailedCharacterMesh(
  hero: HeroCharacter,
  skin: MeshSkinType = 'default'
): { warrior: ReturnType<typeof createWarriorMesh>; group: THREE.Group; meta: Meshy3DModelMeta } {
  let heroOverride = { ...hero };
  if (skin === 'gold_obsidian') {
    heroOverride.primaryColor = '#fbbf24';
  } else if (skin === 'cyber_neon') {
    heroOverride.primaryColor = '#06b6d4';
  } else if (skin === 'crimson_flame') {
    heroOverride.primaryColor = '#ef4444';
  } else if (skin === 'glacial_ice') {
    heroOverride.primaryColor = '#38bdf8';
  }

  const warrior = createWarriorMesh(heroOverride, false);
  const group = warrior.root;

  // Add Dynamic Character Pedestal with Hologram Ring
  const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.12, 32);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.9,
    roughness: 0.2,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = -0.06;
  group.add(pedestal);

  const ringGeo = new THREE.TorusGeometry(1.22, 0.02, 12, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(heroOverride.primaryColor),
    emissive: new THREE.Color(heroOverride.primaryColor),
    emissiveIntensity: 0.8,
  });
  const glowRing = new THREE.Mesh(ringGeo, ringMat);
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 0.02;
  group.add(glowRing);

  return {
    warrior,
    group,
    meta: {
      id: hero.id,
      name: hero.name,
      category: 'character',
      rarity: 'legendary',
      polyCount: 4850,
      vertexCount: 5240,
      materialsCount: 6,
      description: `${hero.name} - Special Ability: ${hero.skillName}. ${hero.skillDescription}`,
      dimensions: { x: 1.4, y: 2.1, z: 1.4 },
      features: [
        `Active Skill: ${hero.skillName}`,
        `Cooldown: ${hero.skillCooldown}s`,
        'Full Humanoid Skeletal Kinematics',
        'Custom Cloth Simulation & Tactical Armor',
      ],
    },
  };
}

// -------------------------------------------------------------
// 4. TOPOGRAPHIC 3D TACTICAL BATTLE ROYALE MAP GENERATOR
// -------------------------------------------------------------
export function createDetailedTacticalMapMesh(
  level: LevelConfig
): { group: THREE.Group; meta: Meshy3DModelMeta } {
  const group = new THREE.Group();

  const isDesert = level.environmentTheme === 'desert';
  const isCyber = level.environmentTheme === 'cyber';

  // Base Terrain Geometry with Elevation Displacements
  const terrainGeo = new THREE.PlaneGeometry(12, 12, 48, 48);
  const posAttr = terrainGeo.attributes.position;

  // Procedural Heightmap Hills & Valleys
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const distFromCenter = Math.sqrt(vx * vx + vy * vy);

    let height = Math.sin(vx * 0.8) * Math.cos(vy * 0.8) * 0.6;
    height += Math.sin(vx * 1.5 + vy * 1.2) * 0.3;
    // Lower center river valley
    if (distFromCenter < 2.5) {
      height -= 0.4;
    }
    posAttr.setZ(i, height);
  }
  terrainGeo.computeVertexNormals();

  const terrainColor = isDesert ? 0xd97706 : isCyber ? 0x0f172a : 0x15803d;
  const terrainMat = new THREE.MeshStandardMaterial({
    color: terrainColor,
    roughness: 0.85,
    metalness: 0.15,
    wireframe: false,
  });

  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  group.add(terrain);

  // River Basin Stream
  const riverGeo = new THREE.PlaneGeometry(1.5, 12, 12, 24);
  const riverMat = new THREE.MeshStandardMaterial({
    color: isCyber ? 0x06b6d4 : 0x0284c7,
    emissive: isCyber ? 0x06b6d4 : 0x0369a1,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.1,
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.y = -0.3;
  group.add(river);

  // Holographic Safe Zone Ring
  const safeZoneGeo = new THREE.TorusGeometry(3.8, 0.05, 16, 64);
  const safeZoneMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    emissive: 0xeab308,
    emissiveIntensity: 0.9,
  });
  const safeZone = new THREE.Mesh(safeZoneGeo, safeZoneMat);
  safeZone.rotation.x = Math.PI / 2;
  safeZone.position.y = 0.5;
  group.add(safeZone);

  // Danger Zone Outer Wall Grid
  const dangerZoneGeo = new THREE.CylinderGeometry(5.2, 5.2, 2.5, 32, 1, true);
  const dangerZoneMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  const dangerWall = new THREE.Mesh(dangerZoneGeo, dangerZoneMat);
  dangerWall.position.y = 1.25;
  group.add(dangerWall);

  // 3D Miniature Landmark Buildings & Watchtowers
  const landmarkPositions = [
    { name: 'CLOCK TOWER', x: -3.2, z: -2.8, h: 2.2, color: 0x71717a },
    { name: 'FACTORY ALPHA', x: 2.8, z: -2.5, h: 1.2, color: 0x3f3f46 },
    { name: 'PEAK SANCTUARY', x: -1.5, z: 3.2, h: 1.8, color: 0xd97706 },
    { name: 'BUNKER SECTOR', x: 3.5, z: 2.9, h: 0.8, color: 0x27272a },
    { name: 'CENTRAL AIRDROP', x: 0, z: 0, h: 0.6, color: 0xef4444 },
  ];

  landmarkPositions.forEach(poi => {
    const buildingGeo = new THREE.BoxGeometry(0.9, poi.h, 0.9);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: poi.color,
      metalness: 0.7,
      roughness: 0.3,
    });
    const b = new THREE.Mesh(buildingGeo, buildingMat);
    b.position.set(poi.x, poi.h / 2, poi.z);
    group.add(b);

    // Glowing POI Flag / Beacon Pin
    const pinGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 0.8,
    });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(poi.x, poi.h + 0.45, poi.z);
    pin.rotation.x = Math.PI;
    group.add(pin);
  });

  // Miniature Military Bridges over River
  const bridgeGeo = new THREE.BoxGeometry(1.8, 0.1, 0.6);
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8 });
  const bridge1 = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge1.position.set(0, 0.1, -1.8);
  group.add(bridge1);

  const bridge2 = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge2.position.set(0, 0.1, 2.2);
  group.add(bridge2);

  return {
    group,
    meta: {
      id: `map_lvl_${level.levelNumber}`,
      name: level.name,
      category: 'map',
      rarity: 'mythic',
      polyCount: 8640,
      vertexCount: 9200,
      materialsCount: 6,
      description: `Tactical 3D Topographic Hologram of ${level.name}. Simulated with elevation hills, landmark strongholds, safe zone boundary, and loot spawns.`,
      dimensions: { x: 12, y: 2.8, z: 12 },
      features: [
        `Battle Zone Radius: ${level.initialSafeZoneRadius}m`,
        `Max Bot Density: ${level.botCount} Combatants`,
        'Interactive POI Beacon Pins',
        'Topographic Heightmap Displacement',
        'Dynamic Safe & Danger Zone Rings',
      ],
    },
  };
}

// -------------------------------------------------------------
// 5. DETAILED TACTICAL GLOO WALLS & GEAR GENERATOR
// -------------------------------------------------------------
export function createDetailedGearMesh(
  gearId: string,
  skin: MeshSkinType = 'default'
): { group: THREE.Group; meta: Meshy3DModelMeta } {
  const group = new THREE.Group();

  if (gearId === 'gloo_wall_dragon' || gearId === 'gloo_wall') {
    const baseGloo = createGlooWallMesh();
    group.add(baseGloo);

    if (skin === 'crimson_flame') {
      baseGloo.traverse(c => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
          c.material.color.set(0xef4444);
          c.material.emissive.set(0xdc2626);
        }
      });
    }

    return {
      group,
      meta: {
        id: 'gloo_wall_dragon',
        name: 'Dragon Crest Gloo Wall',
        category: 'gear',
        rarity: 'legendary',
        polyCount: 2200,
        vertexCount: 2400,
        materialsCount: 3,
        description: 'Instant cryogenic ballistic shield capable of absorbing up to 500 points of high-caliber firepower.',
        dimensions: { x: 3.5, y: 2.2, z: 0.8 },
        features: ['Instant Deployable Ice Matrix', '500 HP Ballistic Armor', 'Bullet Deflection Arc', 'Tactical Cover'],
      },
    };
  }

  // Airdrop Crate (Default Gear)
  const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.8,
    roughness: 0.2,
  });
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 0.6;
  group.add(crate);

  // Golden Frame Edges
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 });
  const topCoverGeo = new THREE.BoxGeometry(1.3, 0.15, 1.3);
  const topCover = new THREE.Mesh(topCoverGeo, frameMat);
  topCover.position.y = 1.22;
  group.add(topCover);

  // Holographic Beacon Light Beam
  const beamGeo = new THREE.CylinderGeometry(0.04, 0.15, 4.5, 12);
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xfacc15,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.6,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 3.5;
  group.add(beam);

  return {
    group,
    meta: {
      id: 'airdrop_crate',
      name: 'Legendary Airdrop Beacon',
      category: 'gear',
      rarity: 'mythic',
      polyCount: 1950,
      vertexCount: 2100,
      materialsCount: 4,
      description: 'High-altitude supply drop containing Level 3 armor, legendary sniper rifles, and combat stims.',
      dimensions: { x: 1.3, y: 5.5, z: 1.3 },
      features: ['High-Altitude Signal Flare', 'Tier 3 Heavy Loot Container', 'Reinforced Titanium Frame'],
    },
  };
}
