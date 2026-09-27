import * as THREE from 'three';
import { WeaponData } from '../types';

export function createWeaponMesh(weapon: WeaponData): THREE.Group {
  const group = new THREE.Group();

  const primaryColor = new THREE.Color(weapon.color);
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.4,
    metalness: 0.8,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.2,
    metalness: 0.7,
    emissive: primaryColor,
    emissiveIntensity: 0.2,
  });
  const woodStockMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.7,
  });

  if (weapon.type === 'katana') {
    // Katana Blade
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.9, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
      emissive: primaryColor,
      emissiveIntensity: 0.3,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.45;
    group.add(blade);

    // Guard (Tsuba)
    const guardGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12);
    const guard = new THREE.Mesh(guardGeo, accentMat);
    guard.rotation.x = Math.PI / 2;
    group.add(guard);

    // Handle (Tsuka)
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x09090b });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.15;
    group.add(handle);

    group.scale.set(0.9, 0.9, 0.9);
    return group;
  }

  if (weapon.type === 'sniper') {
    // AWM Long Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
    const barrel = new THREE.Mesh(barrelGeo, darkMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.55;
    group.add(barrel);

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.16, 0.75);
    const body = new THREE.Mesh(bodyGeo, accentMat);
    body.position.z = 0.1;
    group.add(body);

    // Sniper Scope
    const scopeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.38, 12);
    const scope = new THREE.Mesh(scopeGeo, darkMetalMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.15, 0.1);
    group.add(scope);

    // Stock
    const stockGeo = new THREE.BoxGeometry(0.1, 0.18, 0.35);
    const stock = new THREE.Mesh(stockGeo, darkMetalMat);
    stock.position.z = -0.32;
    group.add(stock);

    // Magazine
    const magGeo = new THREE.BoxGeometry(0.08, 0.2, 0.12);
    const mag = new THREE.Mesh(magGeo, darkMetalMat);
    mag.position.set(0, -0.15, 0.05);
    group.add(mag);

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  if (weapon.type === 'shotgun') {
    // M1887 Double Barrel
    const barrel1Geo = new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8);
    const barrel1 = new THREE.Mesh(barrel1Geo, darkMetalMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.03, 0.04, 0.3);
    group.add(barrel1);

    const barrel2 = new THREE.Mesh(barrel1Geo, darkMetalMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.03, 0.04, 0.3);
    group.add(barrel2);

    // Receiver
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.14, 0.4);
    const body = new THREE.Mesh(bodyGeo, accentMat);
    group.add(body);

    // Wood Grip/Stock
    const stockGeo = new THREE.BoxGeometry(0.09, 0.16, 0.28);
    const stock = new THREE.Mesh(stockGeo, woodStockMat);
    stock.position.set(0, -0.06, -0.22);
    stock.rotation.x = 0.2;
    group.add(stock);

    group.scale.set(0.9, 0.9, 0.9);
    return group;
  }

  if (weapon.type === 'smg') {
    // MP40 Compact Body
    const bodyGeo = new THREE.BoxGeometry(0.09, 0.12, 0.48);
    const body = new THREE.Mesh(bodyGeo, accentMat);
    group.add(body);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8);
    const barrel = new THREE.Mesh(barrelGeo, darkMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.35;
    group.add(barrel);

    // Long Curved Mag
    const magGeo = new THREE.BoxGeometry(0.06, 0.28, 0.08);
    const mag = new THREE.Mesh(magGeo, darkMetalMat);
    mag.position.set(0, -0.16, 0.08);
    mag.rotation.x = 0.15;
    group.add(mag);

    // Folding Stock
    const stockGeo = new THREE.BoxGeometry(0.06, 0.04, 0.24);
    const stock = new THREE.Mesh(stockGeo, darkMetalMat);
    stock.position.z = -0.26;
    group.add(stock);

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  if (weapon.type === 'pistol') {
    // Tactical Desert Falcon Handgun
    const slideGeo = new THREE.BoxGeometry(0.08, 0.09, 0.35);
    const slide = new THREE.Mesh(slideGeo, accentMat);
    slide.position.set(0, 0.05, 0.08);
    group.add(slide);

    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const barrel = new THREE.Mesh(barrelGeo, darkMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, 0.24);
    group.add(barrel);

    const gripGeo = new THREE.BoxGeometry(0.07, 0.2, 0.1);
    const grip = new THREE.Mesh(gripGeo, darkMetalMat);
    grip.position.set(0, -0.07, -0.02);
    grip.rotation.x = 0.2;
    group.add(grip);

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  if (weapon.type === 'launcher') {
    // Heavy Futuristic Plasma Annihilator
    const tubeGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.85, 12);
    const tube = new THREE.Mesh(tubeGeo, darkMetalMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.z = 0.25;
    group.add(tube);

    const coreGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.35, 12);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.8,
      metalness: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.1;
    group.add(core);

    const muzzleGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.15, 12);
    const muzzle = new THREE.Mesh(muzzleGeo, accentMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.z = 0.72;
    group.add(muzzle);

    const handleGeo = new THREE.BoxGeometry(0.08, 0.22, 0.12);
    const handle = new THREE.Mesh(handleGeo, darkMetalMat);
    handle.position.set(0, -0.16, 0.0);
    group.add(handle);

    const stockGeo = new THREE.BoxGeometry(0.12, 0.2, 0.3);
    const stock = new THREE.Mesh(stockGeo, accentMat);
    stock.position.z = -0.32;
    group.add(stock);

    group.scale.set(0.9, 0.9, 0.9);
    return group;
  }

  // Assault Rifle (AK47 / SCAR)
  const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8);
  const barrel = new THREE.Mesh(barrelGeo, darkMetalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.4;
  group.add(barrel);

  const bodyGeo = new THREE.BoxGeometry(0.1, 0.15, 0.55);
  const body = new THREE.Mesh(bodyGeo, accentMat);
  group.add(body);

  // Curved Magazine
  const magGeo = new THREE.BoxGeometry(0.07, 0.24, 0.1);
  const mag = new THREE.Mesh(magGeo, weapon.id === 'ak47' ? woodStockMat : darkMetalMat);
  mag.position.set(0, -0.16, 0.1);
  mag.rotation.x = 0.3;
  group.add(mag);

  // Stock
  const stockGeo = new THREE.BoxGeometry(0.08, 0.14, 0.28);
  const stock = new THREE.Mesh(stockGeo, weapon.id === 'ak47' ? woodStockMat : accentMat);
  stock.position.z = -0.32;
  group.add(stock);

  // Sight
  const sightGeo = new THREE.BoxGeometry(0.04, 0.06, 0.18);
  const sight = new THREE.Mesh(sightGeo, darkMetalMat);
  sight.position.set(0, 0.1, 0.05);
  group.add(sight);

  group.scale.set(0.85, 0.85, 0.85);
  return group;
}

// Gloo Wall Mesh (Iconic Free Fire deployable ice shield)
export function createGlooWallMesh(): THREE.Group {
  const group = new THREE.Group();

  // Curved icy shield wall
  const curveSegments = 7;
  const wallWidth = 4.2;
  const wallHeight = 2.4;
  const wallDepth = 0.45;

  const iceMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.4,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0e7490,
    metalness: 0.8,
    roughness: 0.2,
  });

  for (let i = 0; i < curveSegments; i++) {
    const angle = ((i - curveSegments / 2) / curveSegments) * (Math.PI / 3);
    const segGeo = new THREE.BoxGeometry(wallWidth / curveSegments + 0.05, wallHeight, wallDepth);
    const seg = new THREE.Mesh(segGeo, iceMat);

    seg.position.x = Math.sin(angle) * 3.2;
    seg.position.z = Math.cos(angle) * 3.2 - 3.2;
    seg.position.y = wallHeight / 2;
    seg.rotation.y = angle;
    seg.castShadow = true;
    seg.receiveShadow = true;
    group.add(seg);
  }

  // Heavy Metal Base / Anchor
  const baseGeo = new THREE.BoxGeometry(4.4, 0.3, 0.9);
  const base = new THREE.Mesh(baseGeo, frameMat);
  base.position.y = 0.15;
  group.add(base);

  return group;
}

// Airdrop Supply Crate Mesh with Red Smoke Flare Beacon
export function createAirdropMesh(): THREE.Group {
  const group = new THREE.Group();

  // Crate Box
  const crateGeo = new THREE.BoxGeometry(2.0, 2.0, 2.0);
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Free Fire Red Crate
    metalness: 0.6,
    roughness: 0.4,
  });
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.y = 1.0;
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);

  // Top Yellow Tarpaulin
  const tarpGeo = new THREE.BoxGeometry(2.1, 0.35, 2.1);
  const tarpMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.8,
  });
  const tarp = new THREE.Mesh(tarpGeo, tarpMat);
  tarp.position.y = 2.05;
  group.add(tarp);

  // Parachute Straps
  const strapMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  [-0.9, 0.9].forEach(x => {
    [-0.9, 0.9].forEach(z => {
      const strapGeo = new THREE.CylinderGeometry(0.03, 0.03, 3.5);
      const strap = new THREE.Mesh(strapGeo, strapMat);
      strap.position.set(x * 0.5, 3.2, z * 0.5);
      strap.rotation.z = (x * Math.PI) / 12;
      strap.rotation.x = (z * Math.PI) / 12;
      group.add(strap);
    });
  });

  // Parachute Canopy
  const canopyGeo = new THREE.SphereGeometry(3.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    side: THREE.DoubleSide,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 4.8;
  group.add(canopy);

  // Glowing Airdrop Flare Beacon
  const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 25, 8);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.45,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 13.5;
  group.add(beacon);

  return group;
}

// 3D Floating Loot Pickup Object
export function createLootMesh(type: string, colorHex: string): THREE.Group {
  const group = new THREE.Group();

  let itemMesh: THREE.Mesh;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.5,
    roughness: 0.3,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.35,
  });

  if (type === 'medkit') {
    // Green Cross Medkit Box
    const boxGeo = new THREE.BoxGeometry(0.7, 0.45, 0.5);
    itemMesh = new THREE.Mesh(boxGeo, mat);
    const crossGeo = new THREE.BoxGeometry(0.4, 0.12, 0.52);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cross1 = new THREE.Mesh(crossGeo, crossMat);
    const cross2 = new THREE.Mesh(crossGeo, crossMat);
    cross2.rotation.y = Math.PI / 2;
    itemMesh.add(cross1);
    itemMesh.add(cross2);
  } else if (type === 'shield_battery' || type === 'armor') {
    // Glowing Blue Shield Cell / Battery
    const cellGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 12);
    itemMesh = new THREE.Mesh(cellGeo, mat);
    const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.12;
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -0.12;
    itemMesh.add(ring1);
    itemMesh.add(ring2);
  } else if (type === 'ep_drink') {
    // Glowing Yellow Energy Drink Canister
    const canGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.55, 12);
    itemMesh = new THREE.Mesh(canGeo, mat);
    const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    const capMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.3;
    itemMesh.add(cap);
  } else if (type === 'gloowall') {
    // Cyan Ice Capsule
    const capGeo = new THREE.CapsuleGeometry(0.25, 0.4, 8, 12);
    itemMesh = new THREE.Mesh(capGeo, mat);
  } else {
    // Ammo Box / Weapon Tactical Crate
    const ammoGeo = new THREE.BoxGeometry(0.65, 0.32, 0.45);
    itemMesh = new THREE.Mesh(ammoGeo, mat);
    const stripeGeo = new THREE.BoxGeometry(0.67, 0.08, 0.47);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    itemMesh.add(stripe);
  }

  itemMesh.position.y = 0.5;
  itemMesh.castShadow = true;
  group.add(itemMesh);

  // Glowing Ground Pedestal Light
  const ringGeo = new THREE.RingGeometry(0.4, 0.7, 16);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  return group;
}
