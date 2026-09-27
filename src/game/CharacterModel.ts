import * as THREE from 'three';
import { EnemyArchetype, HeroCharacter } from '../types';

export interface AnimatedWarrior {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  vest: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponAnchor: THREE.Group;
  auraMesh?: THREE.Mesh;
  shieldMesh?: THREE.Mesh;
  laserGuideMesh?: THREE.Line;
  overheadGauge?: {
    group: THREE.Group;
    shieldBar: THREE.Mesh;
    healthBar: THREE.Mesh;
    update: (hpRatio: number, shdRatio: number, cameraPos: THREE.Vector3) => void;
  };
  playEmote: (animationType: string, duration?: number) => void;
  updateAnimation: (
    deltaTime: number,
    speed: number,
    isAiming: boolean,
    isFiring: boolean,
    isCrouching: boolean,
    isJumping: boolean,
    isSlashing: boolean
  ) => void;
}

export function createWarriorMesh(
  heroOrColor: HeroCharacter | string,
  isBot: boolean = false,
  botRankColor: string = '#ef4444',
  enemyArchetype?: EnemyArchetype
): AnimatedWarrior {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const mainColor = typeof heroOrColor === 'string' ? heroOrColor : heroOrColor.primaryColor;
  const skinColor = 0xe0ac69;
  const pantsColor = isBot ? 0x27272a : 0x1e293b;
  const vestColor = isBot ? new THREE.Color(botRankColor).getHex() : 0x09090b;

  // Materials
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
  const vestMat = new THREE.MeshLambertMaterial({ color: vestColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
  const bootMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const accentMat = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.3,
    metalness: 0.6,
    emissive: mainColor,
    emissiveIntensity: isBot ? 0.2 : 0.25,
  });

  // Archetype Specific Proportions & Visuals
  const isAssassin = enemyArchetype?.id === 'assassin';
  const isEnforcer = enemyArchetype?.id === 'enforcer';
  const isMarksman = enemyArchetype?.id === 'marksman';

  const torsoScaleX = isEnforcer ? 1.35 : isAssassin ? 0.9 : 1.0;
  const torsoScaleY = isEnforcer ? 1.15 : 1.0;
  const torsoScaleZ = isEnforcer ? 1.4 : isAssassin ? 0.85 : 1.0;

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.55 * torsoScaleX, 0.65 * torsoScaleY, 0.32 * torsoScaleZ);
  const torso = new THREE.Mesh(torsoGeo, accentMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  body.add(torso);

  // Tactical Vest / Armor Plating
  const vestGeo = new THREE.BoxGeometry(0.6 * torsoScaleX, 0.52 * torsoScaleY, 0.38 * torsoScaleZ);
  const vest = new THREE.Mesh(vestGeo, vestMat);
  vest.position.y = 1.05;
  vest.castShadow = true;
  body.add(vest);

  // Enforcer: Heavy Shoulder Blast Pauldrons
  if (isEnforcer) {
    const pauldronGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
    const pauldronMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.2,
    });
    const leftPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    leftPauldron.position.set(-0.48, 1.38, 0);
    body.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    rightPauldron.position.set(0.48, 1.38, 0);
    body.add(rightPauldron);

    // Hazard Stripes on Chest
    const hazardGeo = new THREE.BoxGeometry(0.45, 0.12, 0.42);
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const hazard = new THREE.Mesh(hazardGeo, hazardMat);
    hazard.position.set(0, 1.1, 0);
    body.add(hazard);
  }

  // Assassin: Aerodynamic Cyber Fins & Scabbards
  if (isAssassin) {
    const finGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    const finMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0xa855f7,
      emissiveIntensity: 0.6,
    });
    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(-0.35, 1.35, -0.15);
    leftFin.rotation.x = -0.5;
    body.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, finMat);
    rightFin.position.set(0.35, 1.35, -0.15);
    rightFin.rotation.x = -0.5;
    body.add(rightFin);
  }

  // Marksman: Tactical Ghillie Cloak & Harness
  if (isMarksman) {
    const capeGeo = new THREE.BoxGeometry(0.58, 0.85, 0.05);
    const capeMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.9, -0.22);
    cape.rotation.x = 0.08;
    body.add(cape);
  }

  // Head
  const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.6;
  head.castShadow = true;
  body.add(head);

  // Tactical Helmet / Visor / Cap
  const helmetGeo = new THREE.BoxGeometry(0.4, 0.22, 0.4);
  const helmet = new THREE.Mesh(helmetGeo, vestMat);
  helmet.position.y = 0.14;
  head.add(helmet);

  let visorMat: THREE.Material;
  if (isAssassin) {
    // Twin Glowing Purple Cyber Optics
    visorMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const leftOptic = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), visorMat);
    leftOptic.position.set(-0.09, 0.03, 0.2);
    head.add(leftOptic);
    const rightOptic = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), visorMat);
    rightOptic.position.set(0.09, 0.03, 0.2);
    head.add(rightOptic);
  } else if (isMarksman) {
    // Green/Cyan Thermal Mono-eye Scope + Comm Antenna
    visorMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const monoEye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), visorMat);
    monoEye.rotation.x = Math.PI / 2;
    monoEye.position.set(0.08, 0.04, 0.22);
    head.add(monoEye);

    // Antenna
    const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6);
    const antMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(-0.16, 0.35, -0.1);
    head.add(antenna);
  } else {
    // Standard / Enforcer Heavy Visor
    visorMat = new THREE.MeshBasicMaterial({ color: isBot ? (isEnforcer ? 0xff2222 : 0xff5533) : 0x00f0ff });
    const visorGeo = new THREE.BoxGeometry(0.38, isEnforcer ? 0.12 : 0.08, 0.06);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, 0.2);
    head.add(visor);
  }

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38 * torsoScaleX, 1.3, 0);
  const lUpperGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
  const lUpper = new THREE.Mesh(lUpperGeo, accentMat);
  lUpper.position.y = -0.25;
  lUpper.castShadow = true;
  leftArm.add(lUpper);
  body.add(leftArm);

  // Right Arm (Weapon Holder)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.38 * torsoScaleX, 1.3, 0);
  const rUpperGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
  const rUpper = new THREE.Mesh(rUpperGeo, accentMat);
  rUpper.position.y = -0.25;
  rUpper.castShadow = true;
  rightArm.add(rUpper);
  body.add(rightArm);

  // Weapon Anchor point on right hand
  const weaponAnchor = new THREE.Group();
  weaponAnchor.position.set(0, -0.48, 0.15);
  weaponAnchor.rotation.x = -Math.PI / 2;
  rightArm.add(weaponAnchor);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16 * torsoScaleX, 0.72, 0);
  const lLegGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
  const lLeg = new THREE.Mesh(lLegGeo, pantsMat);
  lLeg.position.y = -0.35;
  lLeg.castShadow = true;
  leftLeg.add(lLeg);
  const lBootGeo = new THREE.BoxGeometry(0.22 * (isEnforcer ? 1.3 : 1), 0.2, 0.28 * (isEnforcer ? 1.3 : 1));
  const lBoot = new THREE.Mesh(lBootGeo, bootMat);
  lBoot.position.set(0, -0.65, 0.03);
  leftLeg.add(lBoot);
  body.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16 * torsoScaleX, 0.72, 0);
  const rLegGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
  const rLeg = new THREE.Mesh(rLegGeo, pantsMat);
  rLeg.position.y = -0.35;
  rLeg.castShadow = true;
  rightLeg.add(rLeg);
  const rBootGeo = new THREE.BoxGeometry(0.22 * (isEnforcer ? 1.3 : 1), 0.2, 0.28 * (isEnforcer ? 1.3 : 1));
  const rBoot = new THREE.Mesh(rBootGeo, bootMat);
  rBoot.position.set(0, -0.65, 0.03);
  rightLeg.add(rBoot);
  body.add(rightLeg);

  // Aura Mesh (for Alok skill)
  const auraGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 24);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.0,
    wireframe: true,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.y = 0.1;
  root.add(auraMesh);

  // Chrono Forcefield Dome
  const shieldGeo = new THREE.SphereGeometry(2.2, 16, 16);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.0,
    wireframe: true,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 1.0;
  root.add(shieldMesh);

  // Marksman Red/Cyan Laser Aiming Guide Beam
  let laserGuideMesh: THREE.Line | undefined;
  if (isMarksman) {
    const laserMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
    const laserPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 30)];
    const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
    laserGuideMesh = new THREE.Line(laserGeo, laserMat);
    laserGuideMesh.visible = false;
    weaponAnchor.add(laserGuideMesh);
  }

  // 3D Overhead Floating Health and Shield Gauge (for bots)
  let overheadGauge: AnimatedWarrior['overheadGauge'];
  if (isBot) {
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(0, 2.15, 0);

    // Frame Background
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.22), bgMat);
    gaugeGroup.add(bg);

    // Shield Bar (Blue - Top)
    const shdMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const shieldBar = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.07), shdMat);
    shieldBar.position.set(0, 0.045, 0.01);
    gaugeGroup.add(shieldBar);

    // Health Bar (Green/Red - Bottom)
    const hpMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const healthBar = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.09), hpMat);
    healthBar.position.set(0, -0.045, 0.01);
    gaugeGroup.add(healthBar);

    root.add(gaugeGroup);

    overheadGauge = {
      group: gaugeGroup,
      shieldBar,
      healthBar,
      update: (hpRatio: number, shdRatio: number, cameraPos: THREE.Vector3) => {
        // Face camera
        gaugeGroup.lookAt(cameraPos);

        const clampedShd = Math.max(0.001, Math.min(1, shdRatio));
        shieldBar.scale.x = clampedShd;
        shieldBar.position.x = (clampedShd - 1) * 0.6;
        shieldBar.visible = clampedShd > 0.01;

        const clampedHp = Math.max(0.001, Math.min(1, hpRatio));
        healthBar.scale.x = clampedHp;
        healthBar.position.x = (clampedHp - 1) * 0.6;
        (healthBar.material as THREE.MeshBasicMaterial).color.setHex(clampedHp > 0.35 ? 0x22c55e : 0xef4444);
      },
    };
  }

  let walkCycle = 0;
  let recoilOffset = 0;
  let slashAngle = 0;
  let activeEmote: string | null = null;
  let emoteTimer = 0;
  let emotePhase = 0;

  const playEmote = (animationType: string, duration: number = 2.8) => {
    activeEmote = animationType;
    emoteTimer = duration;
    emotePhase = 0;
  };

  const updateAnimation = (
    deltaTime: number,
    speed: number,
    isAiming: boolean,
    isFiring: boolean,
    isCrouching: boolean,
    isJumping: boolean,
    isSlashing: boolean
  ) => {
    // If player starts moving or firing, cancel emote
    if (speed > 0.5 || isAiming || isFiring || isSlashing || isJumping) {
      activeEmote = null;
      emoteTimer = 0;
    }

    if (emoteTimer > 0 && activeEmote) {
      emoteTimer -= deltaTime;
      emotePhase += deltaTime * 5;

      // Reset base posture
      body.position.y = THREE.MathUtils.lerp(body.position.y, 0, 0.2);
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.2);

      switch (activeEmote) {
        case 'cheer': {
          // Both arms high, fists pumping up in victory
          const pump = Math.sin(emotePhase * 2) * 0.3;
          rightArm.rotation.set(-Math.PI * 0.85 + pump, -0.3, 0.4);
          leftArm.rotation.set(-Math.PI * 0.85 + pump, 0.3, -0.4);
          torso.position.y = 1.05 + Math.abs(Math.sin(emotePhase * 2)) * 0.08;
          head.rotation.set(-0.25, Math.sin(emotePhase) * 0.15, 0);
          break;
        }
        case 'clap': {
          // Rapid combat applause
          const clap = Math.sin(emotePhase * 4) * 0.35;
          rightArm.rotation.set(-Math.PI * 0.45, -0.6 + clap, 0.2);
          leftArm.rotation.set(-Math.PI * 0.45, 0.6 - clap, -0.2);
          torso.position.y = 1.05 + Math.sin(emotePhase * 2) * 0.02;
          head.rotation.set(0.1, 0, 0);
          break;
        }
        case 'flex': {
          // Double bicep muscular flex
          rightArm.rotation.set(-Math.PI * 0.5, -0.8, 0.8);
          leftArm.rotation.set(-Math.PI * 0.5, 0.8, -0.8);
          torso.position.y = 1.07;
          torso.scale.set(1.08, 1.04, 1.08);
          head.rotation.set(-0.15, Math.sin(emotePhase) * 0.2, 0);
          break;
        }
        case 'wave': {
          // Right arm raised high waving side to side
          const wave = Math.sin(emotePhase * 3) * 0.45;
          rightArm.rotation.set(-Math.PI * 0.8, -0.2, 0.3 + wave);
          leftArm.rotation.set(-0.2, 0.1, -0.1);
          head.rotation.set(-0.1, 0.1, 0);
          break;
        }
        case 'laugh': {
          // Belly laugh bobbing
          const laugh = Math.sin(emotePhase * 4) * 0.12;
          rightArm.rotation.set(-0.3, -0.5, 0.3);
          leftArm.rotation.set(-0.3, 0.5, -0.3);
          torso.position.y = 1.05 + laugh;
          torso.rotation.x = laugh * 0.8;
          head.rotation.set(-0.3 + laugh, 0, 0);
          break;
        }
        case 'dab': {
          // Stylish battle dab
          rightArm.rotation.set(-Math.PI * 0.55, -0.9, 0.9);
          leftArm.rotation.set(-Math.PI * 0.8, 0.7, -0.7);
          head.rotation.set(0.4, 0.5, 0.3);
          torso.rotation.z = -0.15;
          break;
        }
        case 'heart': {
          // Hands together in front making a heart
          rightArm.rotation.set(-Math.PI * 0.45, -0.5, 0.4);
          leftArm.rotation.set(-Math.PI * 0.45, 0.5, -0.4);
          head.rotation.set(0.1, 0, 0);
          torso.position.y = 1.05 + Math.sin(emotePhase) * 0.02;
          break;
        }
        case 'roar': {
          // Dragon roar: chest forward, arms back wide
          const roar = Math.sin(emotePhase * 3) * 0.08;
          rightArm.rotation.set(0.4 + roar, -0.6, 0.5);
          leftArm.rotation.set(0.4 + roar, 0.6, -0.5);
          torso.rotation.x = -0.25;
          head.rotation.set(-0.5 + roar, 0, 0);
          break;
        }
        default:
          break;
      }
      return;
    }

    // Crouch adjustment
    const targetBodyY = isCrouching ? -0.35 : 0;
    body.position.y = THREE.MathUtils.lerp(body.position.y, targetBodyY, 0.2);
    torso.scale.set(1, 1, 1);
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);

    // Recoil recovery
    if (isFiring) {
      recoilOffset = 0.25;
    } else {
      recoilOffset = THREE.MathUtils.lerp(recoilOffset, 0, 0.25);
    }

    if (isSlashing) {
      slashAngle += deltaTime * 18;
      rightArm.rotation.x = -Math.PI / 2 + Math.sin(slashAngle) * 1.2;
      rightArm.rotation.y = Math.cos(slashAngle) * 0.8;
      leftArm.rotation.x = -0.3;
    } else if (isAiming) {
      // ADS two-hand grip forward
      rightArm.rotation.x = -Math.PI / 2 - recoilOffset * 0.5;
      rightArm.rotation.y = -0.25;
      rightArm.rotation.z = 0.1;

      leftArm.rotation.x = -Math.PI / 2 + 0.1;
      leftArm.rotation.y = 0.45;
      leftArm.rotation.z = -0.15;
    } else {
      // Standard hip weapon hold
      rightArm.rotation.x = -Math.PI / 3.2 - recoilOffset;
      rightArm.rotation.y = -0.15;
      rightArm.rotation.z = 0;

      leftArm.rotation.x = -Math.PI / 4;
      leftArm.rotation.y = 0.3;
      leftArm.rotation.z = 0;
    }

    // Walking / Running leg animations
    if (speed > 0.1 && !isJumping) {
      walkCycle += deltaTime * speed * 4.5;
      const legAngle = Math.sin(walkCycle) * 0.65;
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;

      if (!isAiming && !isSlashing) {
        leftArm.rotation.x = -Math.PI / 4 + Math.sin(walkCycle) * 0.4;
      }
    } else if (isJumping) {
      leftLeg.rotation.x = 0.5;
      rightLeg.rotation.x = -0.3;
      body.position.y += 0.1;
    } else {
      // Idle breathing
      walkCycle += deltaTime * 2;
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.2);
      torso.position.y = 1.05 + Math.sin(walkCycle) * 0.015;
    }
  };

  return {
    root,
    body,
    head,
    torso,
    vest,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponAnchor,
    auraMesh,
    shieldMesh,
    laserGuideMesh,
    overheadGauge,
    playEmote,
    updateAnimation,
  };
}
