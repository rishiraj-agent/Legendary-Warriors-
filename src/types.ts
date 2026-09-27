export type HeroCharacterId = 'alok' | 'chrono' | 'kelly' | 'hayato';

export interface HeroCharacter {
  id: HeroCharacterId;
  name: string;
  title: string;
  description: string;
  skillName: string;
  skillDescription: string;
  skillCooldown: number; // in seconds
  skillDuration: number; // in seconds
  skillIcon: string;
  primaryColor: string;
  glowColor: string;
  baseHp: number;
  speedMultiplier: number;
}

export type HeroConfig = HeroCharacter;

export type EnemyArchetypeId = 'assassin' | 'enforcer' | 'marksman' | 'boss';

export interface EnemyArchetype {
  id: EnemyArchetypeId;
  name: string;
  title: string;
  description: string;
  attackStyle: 'melee_rush' | 'aoe_heavy' | 'precision_range';
  behaviorType: 'seek_and_flank' | 'suppress_and_fortify' | 'cover_and_snipe';
  baseHp: number;
  baseShield: number;
  speed: number;
  rankColor: string;
  glowColor: string;
  weaponId: string;
  aggroRange: number;
}

export type WeaponType = 'ar' | 'shotgun' | 'sniper' | 'smg' | 'katana' | 'pistol' | 'launcher';

export interface WeaponData {
  id: string;
  name: string;
  type: WeaponType;
  displayName: string;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // shots per second
  range: number;
  spread: number;
  magazineSize: number;
  reloadTime: number; // seconds
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  ammoType: string;
  isAoE?: boolean;
  aoeRadius?: number;
  effectiveRange?: number;
  damageFalloff?: { distance: number; multiplier: number }[];
}

export interface WeaponInventorySlot {
  weapon: WeaponData;
  currentAmmo: number;
  reserveAmmo: number;
}

export interface LevelConfig {
  levelNumber: number;
  name: string;
  subtitle: string;
  environmentTheme: 'training' | 'desert' | 'bunker' | 'factory' | 'cyber' | 'volcano' | 'legendary';
  botCount: number;
  botHpMultiplier: number;
  botAccuracyMultiplier: number;
  botSpeedMultiplier: number;
  botAggroDistance: number;
  safeZoneShrinkSpeed: number;
  initialSafeZoneRadius: number;
  targetKills: number;
  lootDensity: number;
  unlockedHero?: HeroCharacterId;
  rewardExp: number;
}

export type MuzzleAttachment = 'none' | 'compensator' | 'tactical_silencer' | 'flash_hider';
export type OpticsAttachment = 'iron_sights' | 'red_dot' | 'scope_2x' | 'scope_4x' | 'scope_8x_thermal';
export type MagazineAttachment = 'standard_mag' | 'extended_mag_lvl3' | 'drum_mag' | 'quick_reload_mag';
export type UnderbarrelAttachment = 'none' | 'angled_foregrip' | 'laser_sight';
export type StockAttachment = 'standard_stock' | 'carbon_fiber_stock' | 'dragon_animated_skin';

export interface WeaponAttachments {
  muzzle: MuzzleAttachment;
  optics: OpticsAttachment;
  magazine: MagazineAttachment;
  underbarrel: UnderbarrelAttachment;
  stock: StockAttachment;
  chipLevel: 1 | 2 | 3 | 4 | 5;
}

export interface SquadMember {
  id: string;
  name: string;
  isUser: boolean;
  avatar: string;
  color: string;
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  shieldHp: number;
  maxShieldHp: number;
  isSuperShieldActive: boolean;
  status: 'active' | 'downed' | 'reviving' | 'eliminated';
  downedHp: number;
  bleedTimer: number;
  reviveProgress: number; // 0 to 1
  kills: number;
  position: { x: number; y: number; z: number };
  isSpeaking?: boolean;
  voiceIntensity?: number;
  activeVoiceLine?: string;
}

export interface TacticalPingWaypoint {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  label: string;
  sender: string;
  distance?: number;
  timestamp: number;
}

export interface DamageNumber {
  id: string;
  damage: number;
  isHeadshot: boolean;
  isShieldHit?: boolean;
  isSuperShieldAbsorb?: boolean;
  isBleedDecay?: boolean;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  time: number;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  weaponName: string;
  isHeadshot: boolean;
  isPlayerKiller: boolean;
  timestamp: number;
}

export type LootType = 'weapon' | 'ammo' | 'medkit' | 'gloowall' | 'armor' | 'shield_battery' | 'ep_drink';

export interface LootPickupItem {
  id: string;
  type: LootType;
  weaponId?: string;
  name: string;
  amount?: number;
  position: { x: number; y: number; z: number };
  color: string;
  collected?: boolean;
}

export interface GlooWallObject {
  id: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  hp: number;
  maxHp: number;
  createdTime: number;
}

export interface PlayerStats {
  kills: number;
  headshots: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  survivalTimeSeconds: number;
  glooWallsUsed: number;
  medkitsUsed: number;
  shieldsRecharged?: number;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
  autoShoot: boolean;
  aimAssist: boolean;
  crosshairStyle: 'classic' | 'dot' | 'tactical';
  graphicsQuality: 'high' | 'medium' | 'low' | 'ultra';
  fpsCap: 30 | 60 | 120 | 'uncapped';
  shadows: 'low' | 'high' | 'cinematic';
  antiAliasing: 'none' | 'fxaa' | 'taa';
  redDotSensitivity: number;
  scope2xSensitivity: number;
  scope4xSensitivity: number;
  sniperSensitivity: number;
  freeLookSensitivity: number;
  voiceChat: boolean;
  spatialAudio: boolean;
  dragToAim: boolean;
  autoPickup: boolean;
  quickWeaponSwitch: boolean;
  // Android Gyroscope & Mobile Touch Controls
  gyroscopeMode: 'disabled' | 'scope_only' | 'always_on';
  gyroPitchSensitivity: number;
  gyroRollSensitivity: number;
  hapticFeedback: boolean;
  hapticIntensity: 'soft' | 'medium' | 'heavy';
  scopeZoomMultiplier: 2 | 4 | 8;
  leftFireButtonEnabled: boolean;
  floatingJoystickEnabled: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  category: 'weapon_skin' | 'outfit' | 'gloowall_skin' | 'bundle' | 'crate';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  priceCoins?: number;
  priceDiamonds?: number;
  description: string;
  previewColor: string;
  bonusStat?: string;
  iconName: string;
  weaponTargetId?: string;
}

export interface MissionItem {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'achievement';
  currentProgress: number;
  targetProgress: number;
  rewardCoins: number;
  rewardDiamonds: number;
  rewardExp: number;
  isClaimed: boolean;
  icon: string;
}

export interface GameEvent {
  id: string;
  title: string;
  tagline: string;
  endsInDays: number;
  bannerColor: string;
  icon: string;
  description: string;
  milestones: {
    scoreNeeded: number;
    rewardLabel: string;
    isClaimed: boolean;
  }[];
  currentScore: number;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  tier: 'Grandmaster' | 'Heroic' | 'Master' | 'Diamond' | 'Platinum' | 'Gold';
  score: number;
  kills: number;
  winRate: string;
  kdRatio: number;
  isCurrentUser?: boolean;
}

export interface EmoteData {
  id: string;
  name: string;
  icon: string;
  category: 'celebration' | 'taunt' | 'tactical' | 'fun';
  description: string;
  animationType: 'cheer' | 'clap' | 'flex' | 'wave' | 'laugh' | 'dab' | 'heart' | 'roar';
  particleColor: string;
  soundType: 'booyah' | 'applause' | 'flex' | 'wave' | 'laugh' | 'dab' | 'heart' | 'roar';
}

export interface ActiveEmoteEvent {
  id: string;
  sender: string;
  emote: EmoteData;
  timestamp: number;
}

export interface UserProfileData {
  playerName: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  diamonds: number;
  tier: string;
  matchesPlayed: number;
  victories: number;
  totalKills: number;
  headshots: number;
  damageDealt: number;
  glooWallsPlaced: number;
  ownedSkins: string[];
  equippedWeaponSkins: Record<string, string>;
  dailyRewardsClaimedDays: number[];
  lastDailyClaimTimestamp?: number;
  passTier: number;
  isElitePassUnlocked: boolean;
}

