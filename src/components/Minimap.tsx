import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BotEntity } from '../game/BotAI';

interface MinimapProps {
  playerPos: THREE.Vector3;
  playerRotationY: number;
  safeZoneRadius: number;
  initialRadius: number;
  bots: BotEntity[];
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPos,
  playerRotationY,
  safeZoneRadius,
  initialRadius,
  bots,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const mapScale = (size * 0.44) / (initialRadius * 1.1);

    ctx.clearRect(0, 0, size, size);

    // Dark tactical radar background
    ctx.fillStyle = 'rgba(10, 15, 18, 0.92)';
    ctx.fillRect(0, 0, size, size);

    // Tactical Radar grid lines & concentric rings
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach(r => {
      ctx.beginPath();
      ctx.arc(center, center, (center - 4) * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radar Crosshairs
    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, size);
    ctx.moveTo(0, center);
    ctx.lineTo(size, center);
    ctx.stroke();

    // Draw Safe Zone Circle
    const safeZoneScreenRadius = safeZoneRadius * mapScale;
    ctx.beginPath();
    ctx.arc(center, center, safeZoneScreenRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.fill();

    // Draw Enemy Bots (Red markers)
    bots.forEach(bot => {
      if (bot.isDead) return;
      const relX = (bot.position.x - playerPos.x) * mapScale;
      const relZ = (bot.position.z - playerPos.z) * mapScale;

      const screenX = center + relX;
      const screenY = center + relZ;

      const distFromCenter = Math.hypot(relX, relZ);
      if (distFromCenter < center - 4) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, bot.state === 'attack' ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = bot.state === 'attack' ? '#ef4444' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    // Draw Player Indicator (White triangle)
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(-playerRotationY + Math.PI);

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }, [playerPos, playerRotationY, safeZoneRadius, initialRadius, bots]);

  const zoneRatio = Math.round((safeZoneRadius / initialRadius) * 100);

  return (
    <div className="flex flex-col items-end gap-1.5 pointer-events-none">
      {/* Tactical Radar Box */}
      <div className="w-36 h-36 md:w-40 md:h-40 bg-black/85 border-2 border-white/10 rounded-lg relative overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Repeating diagonal military hatch texture overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(45deg, #22c55e, #22c55e 1px, transparent 1px, transparent 10px)',
          }}
        ></div>

        <canvas ref={canvasRef} width={160} height={160} className="w-full h-full relative z-10" />

        <div className="absolute top-1.5 left-2 z-20 text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider">
          SECTOR 7G
        </div>
        <div className="absolute bottom-1.5 right-2 z-20 text-[8px] text-green-400 uppercase font-mono font-bold">
          GRID LINKED
        </div>
      </div>

      {/* Epoch Zone Shrink Stability Meter */}
      <div className="flex flex-col gap-0.5 w-36 md:w-40 bg-black/75 p-1.5 border border-white/10 rounded">
        <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${zoneRatio}%` }}></div>
        </div>
        <div className="flex justify-between text-[8px] font-mono font-bold">
          <span className="text-blue-400 uppercase">ZONE EPOCH</span>
          <span className="text-slate-200">{zoneRatio}%</span>
        </div>
      </div>
    </div>
  );
};
