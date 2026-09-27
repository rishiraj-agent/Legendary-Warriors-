import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GameWorld } from './game/GameWorld';
import { HUD, HUDStats } from './components/HUD';
import { Minimap } from './components/Minimap';
import { VictoryDefeatModal } from './components/VictoryDefeatModal';
import { LevelSelect } from './components/LevelSelect';
import { HeroSelect } from './components/HeroSelect';
import { MainMenu } from './components/MainMenu';
import { ControlsGuide } from './components/ControlsGuide';
import { SettingsModal } from './components/SettingsModal';
import { WeaponsArmoryModal } from './components/WeaponsArmoryModal';
import { GunsmithModal } from './components/GunsmithModal';
import { StoreModal } from './components/StoreModal';
import { MissionsModal } from './components/MissionsModal';
import { EventsModal } from './components/EventsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StarterPackModal } from './components/StarterPackModal';
import { LegendPassModal } from './components/LegendPassModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { ProfileModal } from './components/ProfileModal';
import { GuildModal } from './components/GuildModal';
import { ChatModal } from './components/ChatModal';
import { CurrencyModal } from './components/CurrencyModal';
import { EmoteWheel } from './components/EmoteWheel';
import { Meshy3DStudioModal } from './components/Meshy3DStudioModal';
import { HEROES, LEVELS, INITIAL_USER_PROFILE, DEFAULT_WEAPON_ATTACHMENTS } from './data/gameData';
import {
  ActiveEmoteEvent,
  DamageNumber,
  GameSettings,
  HeroCharacter,
  KillFeedItem,
  LevelConfig,
  PlayerStats,
  UserProfileData,
  WeaponAttachments,
  WeaponInventorySlot,
} from './types';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  // Game Setup
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [isVictory, setIsVictory] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [unlockedLevelMax, setUnlockedLevelMax] = useState<number>(() => {
    const saved = localStorage.getItem('lw_unlocked_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [selectedHero, setSelectedHero] = useState<HeroCharacter>(HEROES.alok);

  // Gunsmith Attachments
  const [customAttachments, setCustomAttachments] = useState<Record<string, WeaponAttachments>>(() => {
    const saved = localStorage.getItem('lw_gunsmith_attachments');
    return saved ? JSON.parse(saved) : DEFAULT_WEAPON_ATTACHMENTS;
  });

  // User Profile & Economy State
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    const saved = localStorage.getItem('lw_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  const updateUserProfile = useCallback((updates: Partial<UserProfileData>) => {
    setUserProfile(prev => {
      const nextProfile = { ...prev, ...updates };
      // Check for level up
      if (nextProfile.xp >= nextProfile.xpToNext) {
        nextProfile.level += 1;
        nextProfile.xp = nextProfile.xp - nextProfile.xpToNext;
        nextProfile.xpToNext = Math.round(nextProfile.xpToNext * 1.3);
      }
      localStorage.setItem('lw_user_profile', JSON.stringify(nextProfile));
      return nextProfile;
    });
  }, []);

  // Modals Visibility
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showHeroSelect, setShowHeroSelect] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showArmory, setShowArmory] = useState(false);
  const [showGunsmith, setShowGunsmith] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [showLegendPass, setShowLegendPass] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCurrencyVault, setShowCurrencyVault] = useState(false);
  const [showMeshy3DStudio, setShowMeshy3DStudio] = useState(false);
  const [isEmoteWheelOpen, setIsEmoteWheelOpen] = useState(false);
  const [activeEmoteBanner, setActiveEmoteBanner] = useState<ActiveEmoteEvent | null>(null);
  const emoteBannerTimeoutRef = useRef<number | null>(null);
  const isTHeldRef = useRef(false);
  const isEmoteWheelOpenRef = useRef(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundVolume: 0.7,
    musicVolume: 0.35,
    mouseSensitivity: 0.0025,
    invertY: false,
    autoShoot: false,
    aimAssist: true,
    crosshairStyle: 'classic',
    graphicsQuality: 'high',
    fpsCap: 60,
    shadows: 'high',
    antiAliasing: 'taa',
    redDotSensitivity: 0.002,
    scope2xSensitivity: 0.0018,
    scope4xSensitivity: 0.0015,
    sniperSensitivity: 0.001,
    freeLookSensitivity: 0.003,
    voiceChat: true,
    spatialAudio: true,
    dragToAim: false,
    autoPickup: true,
    quickWeaponSwitch: true,
    // Android Mobile & Gyro Defaults
    gyroscopeMode: 'scope_only',
    gyroPitchSensitivity: 0.0035,
    gyroRollSensitivity: 0.0035,
    hapticFeedback: true,
    hapticIntensity: 'medium',
    scopeZoomMultiplier: 4,
    leftFireButtonEnabled: true,
    floatingJoystickEnabled: true,
  });

  // Active Game State
  const [hudStats, setHudStats] = useState<HUDStats>({
    health: 200,
    maxHealth: 200,
    armor: 100,
    maxArmor: 100,
    ep: 100,
    activeSlotIndex: 0,
    slots: [],
    glooWalls: 3,
    medkits: 3,
    aliveCount: 1,
    kills: 0,
    headshots: 0,
    isAiming: false,
    isReloading: false,
    reloadProgress: 0,
    skillCooldownRemaining: 0,
    isSkillActive: false,
    safeZoneRadius: 80,
    safeZoneTimer: 60,
    totalCombatants: 100,
    matchmakingPing: 28,
    superShieldHp: 1200,
    maxSuperShieldHp: 1200,
    isSuperShieldActive: false,
    superShieldCooldownRemaining: 0,
    pendingDamageBleed: 0,
    isPlayerDowned: false,
    downedBleedTimer: 30,
    canReviveNear: false,
    isReviving: false,
    reviveProgress: 0,
    tacticalPingWaypoints: [],
  });

  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [crosshairHit, setCrosshairHit] = useState<{ active: boolean; isHeadshot: boolean }>({
    active: false,
    isHeadshot: false,
  });
  const [finalStats, setFinalStats] = useState<PlayerStats>({
    kills: 0,
    headshots: 0,
    damageDealt: 0,
    shotsFired: 0,
    shotsHit: 0,
    survivalTimeSeconds: 0,
    glooWallsUsed: 0,
    medkitsUsed: 0,
  });

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameWorldRef = useRef<GameWorld | null>(null);

  // Initialize Game World when starting a match
  const startGame = useCallback((level: LevelConfig, hero: HeroCharacter) => {
    if (gameWorldRef.current) {
      gameWorldRef.current.dispose();
      gameWorldRef.current = null;
    }

    setDamageNumbers([]);
    setKillFeed([]);
    setGameState('playing');
    setShowLevelSelect(false);
    setShowHeroSelect(false);

    // Timeout to ensure DOM container is rendered
    setTimeout(() => {
      if (!containerRef.current) return;

      const world = new GameWorld(containerRef.current, level, hero, {
        onStatsUpdate: stats => {
          setHudStats(stats);
        },
        onDamageNumber: dmg => {
          setDamageNumbers(prev => [...prev.slice(-6), dmg]);
          setTimeout(() => {
            setDamageNumbers(prev => prev.filter(d => d.id !== dmg.id));
          }, 700);
        },
        onKillFeed: kill => {
          setKillFeed(prev => [...prev.slice(-4), kill]);
        },
        onCrosshairHit: isHeadshot => {
          setCrosshairHit({ active: true, isHeadshot });
          setTimeout(() => {
            setCrosshairHit(prev => (prev.active ? { ...prev, active: false } : prev));
          }, 180);
        },
        onEmoteTriggered: event => {
          setActiveEmoteBanner(event);
          if (emoteBannerTimeoutRef.current) clearTimeout(emoteBannerTimeoutRef.current);
          emoteBannerTimeoutRef.current = window.setTimeout(() => {
            setActiveEmoteBanner(null);
          }, 3500);
        },
        onGameOver: (victory, stats) => {
          setIsVictory(victory);
          setFinalStats(stats);
          setGameState('gameover');

          // Calculate combat rewards
          const earnedCoins = (victory ? 1500 : 400) + (stats.kills * 150) + Math.round(stats.damageDealt * 0.1);
          const earnedDiamonds = victory ? 15 : (stats.kills >= 3 ? 5 : 0);
          const earnedXp = (victory ? 450 : 150) + (stats.kills * 50);

          updateUserProfile({
            coins: userProfile.coins + earnedCoins,
            diamonds: userProfile.diamonds + earnedDiamonds,
            xp: userProfile.xp + earnedXp,
            matchesPlayed: userProfile.matchesPlayed + 1,
            victories: userProfile.victories + (victory ? 1 : 0),
            totalKills: userProfile.totalKills + stats.kills,
            headshots: userProfile.headshots + stats.headshots,
            damageDealt: userProfile.damageDealt + stats.damageDealt,
            glooWallsPlaced: userProfile.glooWallsPlaced + (stats.glooWallsUsed || 0),
          });

          if (victory) {
            const nextLvl = level.levelNumber + 1;
            setUnlockedLevelMax(prev => {
              const updated = Math.max(prev, nextLvl);
              localStorage.setItem('lw_unlocked_level', updated.toString());
              return updated;
            });
          }
        },
      });

      world.mouseSensitivity = settings.mouseSensitivity;
      world.autoShoot = settings.autoShoot;
      gameWorldRef.current = world;
    }, 50);
  }, [settings, userProfile, updateUserProfile]);

  // Clean up world on unmount
  useEffect(() => {
    return () => {
      if (gameWorldRef.current) {
        gameWorldRef.current.dispose();
        gameWorldRef.current = null;
      }
    };
  }, []);

  // Update game world settings
  useEffect(() => {
    soundEngine.setVolumes(settings.soundVolume, settings.musicVolume);
    if (gameWorldRef.current) {
      gameWorldRef.current.mouseSensitivity = settings.mouseSensitivity;
      gameWorldRef.current.autoShoot = settings.autoShoot;
    }
  }, [settings]);

  // Keyboard & Mouse Listeners
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        gameWorldRef.current?.setInput(key, true);
      } else if (['c', 'z', 'v'].includes(key)) {
        gameWorldRef.current?.setInput(key, true);
      } else if (key === 'r') {
        gameWorldRef.current?.reloadActiveWeapon();
      } else if (key === 'g') {
        gameWorldRef.current?.deployGlooWall();
      } else if (key === 'f') {
        gameWorldRef.current?.reviveNearestTeammate();
      } else if (key === 'e') {
        gameWorldRef.current?.activateSuperShield();
      } else if (key === 'h') {
        gameWorldRef.current?.useMedkit();
      } else if (key === 'p') {
        gameWorldRef.current?.triggerTacticalPing();
      } else if (key === 'b') {
        setShowGunsmith(prev => !prev);
      } else if (key === 'q') {
        gameWorldRef.current?.activateHeroSkill();
      } else if (key === 't') {
        if (!isTHeldRef.current && !isEmoteWheelOpenRef.current) {
          isTHeldRef.current = true;
          isEmoteWheelOpenRef.current = true;
          setIsEmoteWheelOpen(true);
          if (document.pointerLockElement) {
            document.exitPointerLock?.();
          }
        }
      } else if (key === '1') {
        gameWorldRef.current?.switchWeapon(0);
      } else if (key === '2') {
        gameWorldRef.current?.switchWeapon(1);
      } else if (key === '3') {
        gameWorldRef.current?.switchWeapon(2);
      } else if (key === '4') {
        gameWorldRef.current?.switchWeapon(3);
      } else if (key === 'shift') {
        gameWorldRef.current?.setInput('shift', true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'c'].includes(key)) {
        gameWorldRef.current?.setInput(key, false);
      } else if (key === 'shift') {
        gameWorldRef.current?.setInput('shift', false);
      } else if (key === 't') {
        isTHeldRef.current = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // If clicking HUD controls, don't trigger canvas fire
      if ((e.target as HTMLElement)?.closest('button')) return;

      if (e.button === 0) {
        // Left click: Fire
        gameWorldRef.current?.setFiring(true);
      } else if (e.button === 2) {
        // Right click: Aim Down Sights
        gameWorldRef.current?.setAiming(true);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        gameWorldRef.current?.setFiring(false);
      } else if (e.button === 2) {
        gameWorldRef.current?.setAiming(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Check if pointer locked or mouse dragging
      if (document.pointerLockElement === containerRef.current || e.buttons === 1 || e.buttons === 2) {
        gameWorldRef.current?.onMouseMove(e.movementX, e.movementY);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Mobile DeviceOrientation Gyroscope Integration
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (settings.gyroscopeMode === 'disabled') return;
      if (!e.gamma && !e.beta) return;

      const rollRate = (e.gamma || 0) * (settings.gyroRollSensitivity || 0.0035) * 0.05;
      const pitchRate = (e.beta || 0) * (settings.gyroPitchSensitivity || 0.0035) * 0.05;

      gameWorldRef.current?.applyGyroscopeDelta(pitchRate, -rollRate, settings.gyroscopeMode);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [gameState, settings.gyroscopeMode, settings.gyroRollSensitivity, settings.gyroPitchSensitivity]);

  // Request Pointer Lock on canvas click
  const handleCanvasClick = () => {
    if (gameState === 'playing' && containerRef.current && document.pointerLockElement !== containerRef.current) {
      containerRef.current.requestPointerLock?.();
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0a0f12] text-[#e0e6ed] overflow-hidden select-none font-sans">
      {/* High Density Radial Tactical Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a0f12] via-transparent to-[#0a0f12] pointer-events-none" />

      {/* 3D Game World Render Viewport */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* In-Game Active HUD Overlay */}
      {gameState === 'playing' && (
        <>
          <HUD
            stats={hudStats}
            hero={selectedHero}
            levelConfig={currentLevel}
            damageNumbers={damageNumbers}
            killFeed={killFeed}
            crosshairHit={crosshairHit}
            onSwitchWeapon={index => gameWorldRef.current?.switchWeapon(index)}
            onReload={() => gameWorldRef.current?.reloadActiveWeapon()}
            onDeployGlooWall={() => gameWorldRef.current?.deployGlooWall()}
            onUseMedkit={() => gameWorldRef.current?.useMedkit()}
            onActivateSkill={() => gameWorldRef.current?.activateHeroSkill()}
            onActivateSuperShield={() => gameWorldRef.current?.activateSuperShield()}
            onTriggerPing={() => gameWorldRef.current?.triggerTacticalPing()}
            onReviveTeammate={() => gameWorldRef.current?.reviveNearestTeammate()}
            onOpenGunsmith={() => setShowGunsmith(true)}
            onAimToggle={aiming => gameWorldRef.current?.setAiming(aiming)}
            onFireStart={() => gameWorldRef.current?.setFiring(true)}
            onFireEnd={() => gameWorldRef.current?.setFiring(false)}
            onJump={() => gameWorldRef.current?.triggerJump()}
            onCrouchToggle={() => gameWorldRef.current?.toggleCrouch()}
            onProneToggle={() => gameWorldRef.current?.toggleProne()}
            onSlide={() => gameWorldRef.current?.triggerSlide()}
            onTouchLook={(dx, dy) => gameWorldRef.current?.onMouseMove(dx, dy)}
            onJoystickMove={(dx, dy, isSprinting) => gameWorldRef.current?.setJoystickInput(dx, dy, isSprinting)}
            leftFireButtonEnabled={settings.leftFireButtonEnabled ?? true}
            onOpenSettings={() => setShowSettings(true)}
            onOpenGuide={() => setShowGuide(true)}
            onOpenLevelSelect={() => setShowLevelSelect(true)}
            onOpenEmoteWheel={() => {
              if (document.pointerLockElement) {
                document.exitPointerLock?.();
              }
              isEmoteWheelOpenRef.current = true;
              setIsEmoteWheelOpen(true);
            }}
            activeEmoteBanner={activeEmoteBanner}
          />

          {/* Minimap in Top Left corner */}
          <div className="absolute top-4 left-4 md:left-6 pointer-events-none z-20">
            <Minimap
              playerPos={gameWorldRef.current?.playerPos || new THREE.Vector3()}
              playerRotationY={0}
              safeZoneRadius={hudStats.safeZoneRadius}
              initialRadius={currentLevel.initialSafeZoneRadius}
              bots={gameWorldRef.current?.botManager?.bots || []}
            />
          </div>
        </>
      )}

      {/* Main Menu Lobby Screen */}
      {gameState === 'menu' && (
        <MainMenu
          currentLevel={currentLevel}
          selectedHero={selectedHero}
          userProfile={userProfile}
          onStartGame={() => startGame(currentLevel, selectedHero)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGuide={() => setShowGuide(true)}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenHeroSelect={() => setShowHeroSelect(true)}
          onOpenWeapons={() => setShowArmory(true)}
          onOpenStore={() => setShowStore(true)}
          onOpenMissions={() => setShowMissions(true)}
          onOpenEvents={() => setShowEvents(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenStarterPack={() => setShowStarterPack(true)}
          onOpenLegendPass={() => setShowLegendPass(true)}
          onOpenDailyRewards={() => setShowDailyRewards(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenGuild={() => setShowGuild(true)}
          onOpenChat={() => setShowChat(true)}
          onOpenTopUp={() => setShowCurrencyVault(true)}
          onOpen3DStudio={() => setShowMeshy3DStudio(true)}
        />
      )}

      {/* Victory / Defeat AAA Post-Match Scoreboard Modal */}
      {gameState === 'gameover' && (
        <VictoryDefeatModal
          isVictory={isVictory}
          stats={finalStats}
          levelConfig={currentLevel}
          userProfile={userProfile}
          selectedHero={selectedHero}
          onNextLevel={() => {
            const nextLvl = LEVELS.find(l => l.levelNumber === currentLevel.levelNumber + 1) || currentLevel;
            setCurrentLevel(nextLvl);
            startGame(nextLvl, selectedHero);
          }}
          onRestart={() => startGame(currentLevel, selectedHero)}
          onSelectLevel={() => {
            setGameState('menu');
            setShowLevelSelect(true);
          }}
          onOpenLegendPass={() => {
            setGameState('menu');
            setShowLegendPass(true);
          }}
          onOpenEvents={() => {
            setGameState('menu');
            setShowEvents(true);
          }}
        />
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <LevelSelect
          currentLevel={currentLevel.levelNumber}
          unlockedLevelMax={unlockedLevelMax}
          onSelectLevel={lvl => {
            setCurrentLevel(lvl);
            setShowLevelSelect(false);
            if (gameState === 'playing') {
              startGame(lvl, selectedHero);
            }
          }}
          onClose={() => setShowLevelSelect(false)}
          onOpen3DStudio={() => {
            setShowLevelSelect(false);
            setShowMeshy3DStudio(true);
          }}
        />
      )}

      {/* Hero Select Modal */}
      {showHeroSelect && (
        <HeroSelect
          currentHeroId={selectedHero.id}
          onSelectHero={hero => {
            setSelectedHero(hero);
            setShowHeroSelect(false);
            if (gameState === 'playing') {
              startGame(currentLevel, hero);
            }
          }}
          onClose={() => setShowHeroSelect(false)}
          onOpen3DStudio={() => {
            setShowHeroSelect(false);
            setShowMeshy3DStudio(true);
          }}
        />
      )}

      {/* Weapons & Armory Modal */}
      {showArmory && (
        <WeaponsArmoryModal
          onClose={() => setShowArmory(false)}
          onOpen3DStudio={() => {
            setShowArmory(false);
            setShowMeshy3DStudio(true);
          }}
        />
      )}

      {/* Gunsmith Attachments & Upgrades Modal */}
      {showGunsmith && (
        <GunsmithModal
          onClose={() => setShowGunsmith(false)}
          userProfile={userProfile}
          onUpdateProfile={updateUserProfile}
          customAttachments={customAttachments}
          onUpdateAttachments={updated => {
            setCustomAttachments(updated);
            if (gameWorldRef.current) {
              gameWorldRef.current.customAttachments = updated;
            }
          }}
          onOpen3DStudio={() => {
            setShowGunsmith(false);
            setShowMeshy3DStudio(true);
          }}
        />
      )}

      {/* Meshy 3D Studio Modal */}
      {showMeshy3DStudio && (
        <Meshy3DStudioModal
          onClose={() => setShowMeshy3DStudio(false)}
          initialCategory="all"
          onEquipItem={(category, itemId) => {
            if (category === 'character') {
              const h = Object.values(HEROES).find(hero => hero.id === itemId);
              if (h) setSelectedHero(h);
            }
          }}
        />
      )}

      {/* Tactical Store Modal */}
      {showStore && (
        <StoreModal
          userProfile={userProfile}
          onClose={() => setShowStore(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Missions & Bounties Modal */}
      {showMissions && (
        <MissionsModal
          userProfile={userProfile}
          onClose={() => setShowMissions(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Seasonal Events Modal */}
      {showEvents && (
        <EventsModal
          userProfile={userProfile}
          onClose={() => setShowEvents(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Ranked Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          userProfile={userProfile}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Starter Pack Modal */}
      {showStarterPack && (
        <StarterPackModal
          userProfile={userProfile}
          onClose={() => setShowStarterPack(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Legend Pass Modal */}
      {showLegendPass && (
        <LegendPassModal
          userProfile={userProfile}
          onClose={() => setShowLegendPass(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Daily Login Rewards Modal */}
      {showDailyRewards && (
        <DailyRewardsModal
          userProfile={userProfile}
          onClose={() => setShowDailyRewards(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Career Profile Modal */}
      {showProfile && (
        <ProfileModal
          userProfile={userProfile}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Guild Headquarters Modal */}
      {showGuild && (
        <GuildModal
          userProfile={userProfile}
          onClose={() => setShowGuild(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Tactical Comms Chat Modal */}
      {showChat && (
        <ChatModal
          userProfile={userProfile}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Currency Top-up & Airdrop Modal */}
      {showCurrencyVault && (
        <CurrencyModal
          userProfile={userProfile}
          onClose={() => setShowCurrencyVault(false)}
          onUpdateProfile={updateUserProfile}
        />
      )}

      {/* Controls & Skills Guide Modal */}
      {showGuide && <ControlsGuide onClose={() => setShowGuide(false)} />}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Tactical Emote Wheel Overlay */}
      <EmoteWheel
        isOpen={isEmoteWheelOpen && gameState === 'playing'}
        onClose={() => {
          setIsEmoteWheelOpen(false);
          isEmoteWheelOpenRef.current = false;
          isTHeldRef.current = false;
        }}
        onSelectEmote={emote => {
          gameWorldRef.current?.triggerEmote(emote);
        }}
        isHoldKeyMode={isTHeldRef.current}
      />
    </div>
  );
}
