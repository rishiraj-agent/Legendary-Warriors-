import * as THREE from 'three';
import { AnimatedWarrior, createWarriorMesh } from './CharacterModel';
import { createWeaponMesh } from './WeaponModels';
import { BOT_NAMES, ENEMY_ARCHETYPES, WEAPONS } from '../data/gameData';
import { EnemyArchetype, LevelConfig, WeaponData } from '../types';
import { soundEngine } from '../audio/soundEngine';

export interface BotEntity {
  id: string;
  name: string;
  rankColor: string;
  archetype: EnemyArchetype;
  mesh: AnimatedWarrior;
  weaponMesh: THREE.Group;
  weapon: WeaponData;
  hp: number;
  maxHp: number;
  armor: number; // Shield value
  maxArmor: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  targetPos: THREE.Vector3 | null;
  targetEntityId: string | null;
  state: 'patrol' | 'chase' | 'attack' | 'take_cover' | 'flank' | 'revive_player' | 'dead';
  shootCooldown: number;
  reactionTimer: number;
  glooWallCount: number;
  hasUsedGloo: boolean;
  patrolTimer: number;
  patrolDirection: THREE.Vector3;
  strafeTimer: number;
  strafeDirection: number;
  accuracy: number;
  speed: number;
  isDead: boolean;
  slashCooldown: number;
  laserChargeTimer: number;
  headshotHitbox: THREE.Box3;
  bodyHitbox: THREE.Box3;
  // Squad mechanics
  isTeammate?: boolean;
  squadMemberIndex?: number; // 2, 3, 4
  squadId?: string;
  reviveChannelTimer?: number;
}

export class BotManager {
  public bots: BotEntity[] = [];
  public squadTeammates: BotEntity[] = [];
  public sosTargetPos: THREE.Vector3 | null = null;
  public sosActive: boolean = false;
  private scene: THREE.Scene;
  private levelConfig: LevelConfig;
  private nextBotId = 1;

  constructor(scene: THREE.Scene, levelConfig: LevelConfig) {
    this.scene = scene;
    this.levelConfig = levelConfig;
  }

  // Force squad bots to rescue downed player on SOS ping
  public triggerSquadSOS(playerPos: THREE.Vector3) {
    this.sosTargetPos = playerPos.clone();
    this.sosActive = true;

    // Find nearest living squad teammate to take primary rescue role
    let nearestBot: BotEntity | null = null;
    let minDistance = Infinity;

    for (const tm of this.squadTeammates) {
      if (tm.isDead) continue;
      const d = tm.position.distanceTo(playerPos);
      if (d < minDistance) {
        minDistance = d;
        nearestBot = tm;
      }
    }

    if (nearestBot) {
      nearestBot.state = 'revive_player';
      nearestBot.targetPos = playerPos.clone();
      nearestBot.reviveChannelTimer = 0;
    }

    // Order remaining living teammates to escort and cover
    for (const tm of this.squadTeammates) {
      if (tm.isDead || tm === nearestBot) continue;
      tm.targetPos = playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6));
    }
  }

  // Direct bot navigation path towards coordinates
  public navigateTo(bot: BotEntity, targetPos: THREE.Vector3, speedMultiplier: number = 1.5): THREE.Vector3 {
    const toTarget = new THREE.Vector3(targetPos.x - bot.position.x, 0, targetPos.z - bot.position.z);
    if (toTarget.lengthSq() > 0.01) {
      toTarget.normalize();
      bot.rotationY = Math.atan2(toTarget.x, toTarget.z);
      bot.mesh.root.rotation.y = bot.rotationY;
      return toTarget.multiplyScalar(bot.speed * speedMultiplier);
    }
    return new THREE.Vector3();
  }

  public spawnSquadTeammates(playerPos: THREE.Vector3) {
    const squadDefs = [
      { name: 'Ghost_Rider', color: '#22c55e', role: 'Marksman', weapon: WEAPONS.awm, offset: new THREE.Vector3(4, 0, 4), index: 2 },
      { name: 'Viper_Queen', color: '#eab308', role: 'Assault', weapon: WEAPONS.ak47, offset: new THREE.Vector3(-4, 0, 4), index: 3 },
      { name: 'Shadow_Operative', color: '#a855f7', role: 'Support', weapon: WEAPONS.mp40, offset: new THREE.Vector3(0, 0, -5), index: 4 },
    ];

    squadDefs.forEach(def => {
      const spawnX = playerPos.x + def.offset.x;
      const spawnZ = playerPos.z + def.offset.z;

      const archetype = ENEMY_ARCHETYPES.enforcer;
      const animatedMesh = createWarriorMesh(def.color, false, def.color);
      animatedMesh.root.position.set(spawnX, 0, spawnZ);

      const weaponMesh = createWeaponMesh(def.weapon);
      animatedMesh.weaponAnchor.add(weaponMesh);
      this.scene.add(animatedMesh.root);

      const teammate: BotEntity = {
        id: `squad_member_${def.index}`,
        name: `${def.name} [Squad #${def.index}]`,
        rankColor: def.color,
        archetype,
        mesh: animatedMesh,
        weaponMesh,
        weapon: def.weapon,
        hp: 200,
        maxHp: 200,
        armor: 100,
        maxArmor: 100,
        position: animatedMesh.root.position,
        velocity: new THREE.Vector3(),
        rotationY: 0,
        targetPos: null,
        targetEntityId: null,
        state: 'patrol',
        shootCooldown: 1.0,
        reactionTimer: 0.2,
        glooWallCount: 2,
        hasUsedGloo: false,
        patrolTimer: 2.0,
        patrolDirection: new THREE.Vector3(0, 0, 1),
        strafeTimer: 1.0,
        strafeDirection: 1,
        accuracy: 0.75,
        speed: 7.5,
        isDead: false,
        slashCooldown: 0,
        laserChargeTimer: 0,
        headshotHitbox: new THREE.Box3(),
        bodyHitbox: new THREE.Box3(),
        isTeammate: true,
        squadMemberIndex: def.index,
        squadId: 'squad_alpha',
        reviveChannelTimer: 0,
      };

      this.updateHitboxes(teammate);
      this.squadTeammates.push(teammate);
    });
  }

  public spawnBots(count: number, spawnRadius: number, mapBounds: number) {
    this.cleanup();

    const archetypeKeys = ['assassin', 'enforcer', 'marksman'] as const;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 22 + Math.random() * (spawnRadius - 28);
      const spawnX = Math.cos(angle) * dist;
      const spawnZ = Math.sin(angle) * dist;

      const botName = BOT_NAMES[i % BOT_NAMES.length] || `Warrior_${i + 1}`;
      
      // Distribute archetype evenly across enemy pool
      let archKey: string = archetypeKeys[i % archetypeKeys.length];
      let archetype = ENEMY_ARCHETYPES[archKey] || ENEMY_ARCHETYPES.assassin;

      // Spawn Boss for the last bot on level 3+
      if (this.levelConfig.levelNumber >= 3 && i === count - 1) {
        archetype = ENEMY_ARCHETYPES['boss'];
        archKey = 'boss';
      }

      // Assign weapon matching archetype or pool
      let weapon: WeaponData = WEAPONS[archetype.weaponId] || WEAPONS.ak47;
      if (archKey === 'marksman') {
        weapon = WEAPONS.awm;
      } else if (archKey === 'enforcer') {
        weapon = WEAPONS.plasma_launcher || WEAPONS.scar;
      } else if (archKey === 'assassin') {
        weapon = WEAPONS.katana;
      } else if (archKey === 'boss') {
        weapon = WEAPONS.plasma_launcher;
      }

      // Create 3D model with archetype features & overhead shield/health gauge
      const scaleMultiplier = archKey === 'boss' ? 1.5 : 1.0;
      const animatedMesh = createWarriorMesh(archetype.rankColor, true, archetype.rankColor, archetype);
      animatedMesh.root.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
      animatedMesh.root.position.set(spawnX, 0, spawnZ);

      const weaponMesh = createWeaponMesh(weapon);
      animatedMesh.weaponAnchor.add(weaponMesh);

      this.scene.add(animatedMesh.root);

      const baseHp = archetype.baseHp * this.levelConfig.botHpMultiplier;
      const baseArmor = archetype.baseShield * (this.levelConfig.levelNumber > 2 ? 1.2 : 1.0);

      const bot: BotEntity = {
        id: `bot_${this.nextBotId++}`,
        name: `${botName} [${archetype.name}]`,
        rankColor: archetype.rankColor,
        archetype,
        mesh: animatedMesh,
        weaponMesh,
        weapon,
        hp: baseHp,
        maxHp: baseHp,
        armor: baseArmor,
        maxArmor: baseArmor,
        position: animatedMesh.root.position,
        velocity: new THREE.Vector3(),
        rotationY: Math.random() * Math.PI * 2,
        targetPos: null,
        targetEntityId: null,
        state: 'patrol',
        shootCooldown: Math.random() * 1.2,
        reactionTimer: 0.2 + Math.random() * 0.3,
        glooWallCount: archKey === 'enforcer' ? 2 : (this.levelConfig.levelNumber >= 3 ? 1 : 0),
        hasUsedGloo: false,
        patrolTimer: Math.random() * 4,
        patrolDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        strafeTimer: Math.random() * 2,
        strafeDirection: Math.random() > 0.5 ? 1 : -1,
        accuracy: (archKey === 'marksman' ? 0.88 : (archKey === 'enforcer' ? 0.65 : 0.5)) * this.levelConfig.botAccuracyMultiplier,
        speed: archetype.speed * this.levelConfig.botSpeedMultiplier,
        isDead: false,
        slashCooldown: 0,
        laserChargeTimer: 0,
        headshotHitbox: new THREE.Box3(),
        bodyHitbox: new THREE.Box3(),
        isTeammate: false,
        squadId: `enemy_squad_${Math.floor(i / 4) + 1}`,
      };

      this.updateHitboxes(bot);
      this.bots.push(bot);
    }
  }

  public update(
    deltaTime: number,
    playerPos: THREE.Vector3,
    playerHp: number,
    safeZoneCenter: THREE.Vector3,
    safeZoneRadius: number,
    onBotFire: (bot: BotEntity, targetPos: THREE.Vector3) => void,
    onBotDeployGloo: (bot: BotEntity) => void,
    onBotMeleeAttack?: (bot: BotEntity, damage: number) => void,
    isPlayerDowned?: boolean,
    onTeammateRevivePlayer?: () => void,
    onTeammateDamageEnemy?: (enemy: BotEntity, damage: number) => void
  ) {
    // 1. UPDATE FRIENDLY SQUAD TEAMMATES
    for (let i = this.squadTeammates.length - 1; i >= 0; i--) {
      const tm = this.squadTeammates[i];
      if (tm.isDead) continue;

      // Safe zone damage for teammates
      const distToZoneCenter = new THREE.Vector2(tm.position.x - safeZoneCenter.x, tm.position.z - safeZoneCenter.z).length();
      if (distToZoneCenter > safeZoneRadius) {
        tm.hp -= deltaTime * 8;
        if (tm.hp <= 0) {
          tm.isDead = true;
          this.scene.remove(tm.mesh.root);
          continue;
        }
      }

      const distToPlayer = tm.position.distanceTo(playerPos);
      let moveDir = new THREE.Vector3();
      let isAiming = false;
      let isFiring = false;

      // Check if Player is Downed or SOS active -> Override combat and Rush to Revive
      if ((isPlayerDowned || this.sosActive) && (tm.state === 'revive_player' || distToPlayer < 40)) {
        tm.state = 'revive_player';
        if (distToPlayer > 2.0) {
          // Sprint navigation to player's coordinates
          moveDir = this.navigateTo(tm, playerPos, 1.65);
          isAiming = false;
        } else {
          // Within 2m proximity trigger: Channel 3.0s Revive Progress
          moveDir.set(0, 0, 0);
          tm.reviveChannelTimer = (tm.reviveChannelTimer || 0) + deltaTime;
          if (tm.reviveChannelTimer >= 3.0) {
            tm.reviveChannelTimer = 0;
            this.sosActive = false;
            if (onTeammateRevivePlayer) onTeammateRevivePlayer();
          }
        }
      } else {
        // Find nearest living enemy bot
        let nearestEnemy: BotEntity | null = null;
        let nearestDist = 45.0; // 45m engage range
        for (const enemy of this.bots) {
          if (enemy.isDead) continue;
          const d = tm.position.distanceTo(enemy.position);
          if (d < nearestDist) {
            nearestDist = d;
            nearestEnemy = enemy;
          }
        }

        if (nearestEnemy) {
          isAiming = true;
          const dx = nearestEnemy.position.x - tm.position.x;
          const dz = nearestEnemy.position.z - tm.position.z;
          tm.rotationY = Math.atan2(dx, dz);
          tm.mesh.root.rotation.y = tm.rotationY;

          // Strafe & Shoot enemy
          tm.shootCooldown -= deltaTime;
          if (tm.shootCooldown <= 0) {
            tm.shootCooldown = 0.4 + Math.random() * 0.4;
            isFiring = true;
            if (onTeammateDamageEnemy) {
              onTeammateDamageEnemy(nearestEnemy, tm.weapon.damage * 0.6);
            }
          }

          // Keep distance relative to player
          if (distToPlayer > 8.0) {
            const toPlayer = new THREE.Vector3(playerPos.x - tm.position.x, 0, playerPos.z - tm.position.z).normalize();
            moveDir.copy(toPlayer).multiplyScalar(tm.speed * 0.8);
          }
        } else {
          // Formation follow player
          const targetOffset = tm.squadMemberIndex === 2
            ? new THREE.Vector3(4, 0, 4)
            : tm.squadMemberIndex === 3
            ? new THREE.Vector3(-4, 0, 4)
            : new THREE.Vector3(0, 0, -5);
          const formationTarget = playerPos.clone().add(targetOffset);
          const distToFormation = tm.position.distanceTo(formationTarget);

          if (distToFormation > 2.0) {
            const toTarget = new THREE.Vector3(formationTarget.x - tm.position.x, 0, formationTarget.z - tm.position.z).normalize();
            moveDir.copy(toTarget).multiplyScalar(tm.speed * (distToFormation > 10 ? 1.3 : 0.9));
            tm.rotationY = Math.atan2(toTarget.x, toTarget.z);
            tm.mesh.root.rotation.y = tm.rotationY;
          }
        }
      }

      tm.position.x += moveDir.x * deltaTime;
      tm.position.z += moveDir.z * deltaTime;
      this.updateHitboxes(tm);
      tm.mesh.updateAnimation(deltaTime, moveDir.length(), isAiming, isFiring, false, false, false);
    }

    // 2. UPDATE ENEMY BOTS
    for (let i = this.bots.length - 1; i >= 0; i--) {
      const bot = this.bots[i];
      if (bot.isDead) continue;

      // Update 3D overhead Health & Shield gauge
      if (bot.mesh.overheadGauge) {
        bot.mesh.overheadGauge.update(
          bot.hp / bot.maxHp,
          bot.maxArmor > 0 ? bot.armor / bot.maxArmor : 0,
          playerPos
        );
      }

      // Safe zone check
      const distToZoneCenter = new THREE.Vector2(bot.position.x - safeZoneCenter.x, bot.position.z - safeZoneCenter.z).length();
      if (distToZoneCenter > safeZoneRadius) {
        bot.hp -= deltaTime * 8 * (1 + this.levelConfig.levelNumber * 0.5);
        if (bot.hp <= 0) {
          bot.isDead = true;
          this.scene.remove(bot.mesh.root);
          continue;
        }
      }

      const distToPlayer = bot.position.distanceTo(playerPos);
      const aggroDist = Math.max(bot.archetype.aggroRange, this.levelConfig.botAggroDistance);

      // State Transition based on Archetype
      if (playerHp > 0 && distToPlayer < aggroDist) {
        bot.targetPos = playerPos.clone();
        bot.targetEntityId = 'player';

        if (bot.archetype.id === 'assassin') {
          // Assassin rushes & flanks
          if (distToPlayer > 3.8) {
            bot.state = 'chase';
          } else {
            bot.state = 'attack';
          }
        } else if (bot.archetype.id === 'marksman') {
          // Marksman kites backwards if too close, otherwise takes position to snipe
          if (distToPlayer < 20) {
            bot.state = 'take_cover';
          } else {
            bot.state = 'attack';
          }
        } else {
          // Enforcer advances to medium range (15-25m) and launches heavy fire
          if (distToPlayer > 26) {
            bot.state = 'chase';
          } else {
            bot.state = 'attack';
          }
        }
      } else {
        bot.targetEntityId = null;
        bot.state = 'patrol';
      }

      // Execute Behaviors
      let moveDir = new THREE.Vector3();
      let isAiming = false;
      let isFiring = false;
      let isSlashing = false;

      if (bot.state === 'attack' && bot.targetPos) {
        isAiming = true;

        // Face player
        const dx = bot.targetPos.x - bot.position.x;
        const dz = bot.targetPos.z - bot.position.z;
        bot.rotationY = Math.atan2(dx, dz);
        bot.mesh.root.rotation.y = bot.rotationY;

        // 1. ASSASSIN MELEE RUSH BEHAVIOR
        if (bot.archetype.id === 'assassin') {
          // Circle/strafe rapidly around player
          const strafeAngle = bot.rotationY + Math.PI / 2 * bot.strafeDirection;
          const circleVec = new THREE.Vector3(Math.sin(strafeAngle), 0, Math.cos(strafeAngle)).multiplyScalar(bot.speed * 0.85);
          const forwardVec = new THREE.Vector3(Math.sin(bot.rotationY), 0, Math.cos(bot.rotationY)).multiplyScalar(bot.speed * 0.4);
          moveDir.add(circleVec).add(forwardVec);

          bot.strafeTimer -= deltaTime;
          if (bot.strafeTimer <= 0) {
            bot.strafeTimer = 0.6 + Math.random() * 0.8;
            bot.strafeDirection = Math.random() > 0.5 ? 1 : -1;
          }

          // Melee slash cooldown
          bot.slashCooldown -= deltaTime;
          if (distToPlayer <= 4.2 && bot.slashCooldown <= 0) {
            bot.slashCooldown = 0.8;
            isSlashing = true;
            soundEngine.playKatanaSlash();
            if (onBotMeleeAttack) {
              onBotMeleeAttack(bot, bot.weapon.damage);
            }
          }
        }

        // 2. ENFORCER AOE SUPPRESSION BEHAVIOR
        else if (bot.archetype.id === 'enforcer') {
          // Juggernaut slow tactical strafe
          bot.strafeTimer -= deltaTime;
          if (bot.strafeTimer <= 0) {
            bot.strafeTimer = 1.8 + Math.random() * 1.5;
            bot.strafeDirection = Math.random() > 0.5 ? 1 : -1;
          }

          const strafeVec = new THREE.Vector3(-Math.cos(bot.rotationY), 0, Math.sin(bot.rotationY))
            .multiplyScalar(bot.strafeDirection * bot.speed * 0.5);
          moveDir.add(strafeVec);

          // Deploy Gloo Wall when damaged
          if ((bot.hp < bot.maxHp * 0.5 || bot.armor <= 0) && bot.glooWallCount > 0 && !bot.hasUsedGloo) {
            bot.glooWallCount--;
            bot.hasUsedGloo = true;
            onBotDeployGloo(bot);
          }

          // Heavy rocket firing
          bot.shootCooldown -= deltaTime;
          if (bot.shootCooldown <= 0) {
            bot.shootCooldown = 1 / bot.weapon.fireRate + Math.random() * 0.4;
            isFiring = true;
            const spreadFactor = (1 - bot.accuracy) * 2.0;
            const aimTarget = playerPos.clone().add(
              new THREE.Vector3(
                (Math.random() - 0.5) * spreadFactor,
                0.8 + (Math.random() - 0.5) * spreadFactor * 0.5,
                (Math.random() - 0.5) * spreadFactor
              )
            );
            onBotFire(bot, aimTarget);
          }
        }

        // 3. MARKSMAN PRECISION SNIPER BEHAVIOR
        else if (bot.archetype.id === 'marksman') {
          // Laser charge & high precision sniper shot
          bot.laserChargeTimer += deltaTime;
          bot.shootCooldown -= deltaTime;

          if (bot.shootCooldown <= 0) {
            bot.shootCooldown = 2.4 / bot.weapon.fireRate;
            bot.laserChargeTimer = 0;
            isFiring = true;

            // Pinpoint accuracy shot aimed at head height
            const aimTarget = playerPos.clone().add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              1.45 + (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.5
            ));
            onBotFire(bot, aimTarget);
          }
        }
      } else if (bot.state === 'take_cover') {
        // Kite backwards away from player to re-establish long range
        const dx = bot.targetPos ? bot.targetPos.x - bot.position.x : 0;
        const dz = bot.targetPos ? bot.targetPos.z - bot.position.z : 0;
        bot.rotationY = Math.atan2(dx, dz);
        bot.mesh.root.rotation.y = bot.rotationY;

        // Move in reverse
        moveDir.set(-Math.sin(bot.rotationY), 0, -Math.cos(bot.rotationY)).multiplyScalar(bot.speed * 0.9);
      } else if (bot.state === 'chase' && bot.targetPos) {
        // Move towards player (Assassins do zig-zag dash)
        const dx = bot.targetPos.x - bot.position.x;
        const dz = bot.targetPos.z - bot.position.z;
        bot.rotationY = Math.atan2(dx, dz);
        bot.mesh.root.rotation.y = bot.rotationY;

        if (bot.archetype.id === 'assassin') {
          const zigZagOffset = Math.sin(Date.now() * 0.008) * 0.7;
          moveDir.set(
            Math.sin(bot.rotationY + zigZagOffset),
            0,
            Math.cos(bot.rotationY + zigZagOffset)
          ).multiplyScalar(bot.speed);
        } else {
          moveDir.set(Math.sin(bot.rotationY), 0, Math.cos(bot.rotationY)).multiplyScalar(bot.speed);
        }
      } else {
        // Patrol
        bot.patrolTimer -= deltaTime;
        if (bot.patrolTimer <= 0) {
          bot.patrolTimer = 2 + Math.random() * 4;
          bot.patrolDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        }

        if (distToZoneCenter > safeZoneRadius * 0.8) {
          const toCenter = new THREE.Vector3(safeZoneCenter.x - bot.position.x, 0, safeZoneCenter.z - bot.position.z).normalize();
          bot.patrolDirection.lerp(toCenter, 0.7);
        }

        bot.rotationY = Math.atan2(bot.patrolDirection.x, bot.patrolDirection.z);
        bot.mesh.root.rotation.y = bot.rotationY;
        moveDir.copy(bot.patrolDirection).multiplyScalar(bot.speed * 0.55);
      }

      // Apply movement
      bot.position.x += moveDir.x * deltaTime;
      bot.position.z += moveDir.z * deltaTime;

      this.updateHitboxes(bot);
      const currentSpeed = moveDir.length();
      bot.mesh.updateAnimation(deltaTime, currentSpeed, isAiming, isFiring, false, false, isSlashing);
    }
  }

  private updateHitboxes(bot: BotEntity) {
    const p = bot.position;
    // Head hitbox
    bot.headshotHitbox.set(
      new THREE.Vector3(p.x - 0.28, p.y + 1.45, p.z - 0.28),
      new THREE.Vector3(p.x + 0.28, p.y + 1.9, p.z + 0.28)
    );
    // Torso / Body hitbox
    bot.bodyHitbox.set(
      new THREE.Vector3(p.x - 0.45, p.y, p.z - 0.45),
      new THREE.Vector3(p.x + 0.45, p.y + 1.45, p.z + 0.45)
    );
  }

  public damageBot(
    bot: BotEntity,
    damage: number,
    isHeadshot: boolean
  ): { died: boolean; finalDamage: number; isShieldHit: boolean } {
    let actualDamage = damage;
    let isShieldHit = false;

    // Shield absorption first
    if (bot.armor > 0) {
      isShieldHit = true;
      if (bot.armor >= actualDamage) {
        bot.armor -= actualDamage;
        actualDamage = 0;
        soundEngine.playShieldHit();
      } else {
        actualDamage -= bot.armor;
        bot.armor = 0;
        soundEngine.playShieldBreak();
      }
    }

    if (actualDamage > 0) {
      bot.hp -= actualDamage;
    }

    if (bot.hp <= 0 && !bot.isDead) {
      bot.isDead = true;
      bot.state = 'dead';
      this.scene.remove(bot.mesh.root);
      return { died: true, finalDamage: damage, isShieldHit };
    }

    return { died: false, finalDamage: damage, isShieldHit };
  }

  public getAliveBotsCount(): number {
    return this.bots.filter(b => !b.isDead).length;
  }

  public cleanup() {
    this.bots.forEach(b => {
      this.scene.remove(b.mesh.root);
    });
    this.bots = [];

    this.squadTeammates.forEach(tm => {
      this.scene.remove(tm.mesh.root);
    });
    this.squadTeammates = [];
  }
}
