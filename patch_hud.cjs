const fs = require('fs');
let code = fs.readFileSync('src/components/HUD.tsx', 'utf8');

const weaponTooltipComponent = `
const WeaponTooltip: React.FC<{ slot: WeaponInventorySlot, isPrimary?: boolean }> = ({ slot, isPrimary }) => {
  if (!slot || !slot.weapon) return null;
  const { weapon } = slot;
  
  return (
    <div className={\`absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/90 border border-white/20 p-3 w-48 shadow-2xl backdrop-blur-md \${isPrimary ? 'right-[105%] top-0' : 'bottom-[110%] left-1/2 -translate-x-1/2'}\`}>
      <div className="text-xs font-black text-yellow-500 uppercase truncate">{weapon.displayName}</div>
      <div className="text-[9px] text-slate-400 uppercase mb-2">{weapon.type}</div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="text-[8px] text-slate-500 uppercase">Damage</div>
          <div className="text-[10px] text-white font-bold">{weapon.damage} <span className="text-red-400 text-[8px]">(x{weapon.headshotMultiplier})</span></div>
        </div>
        <div>
          <div className="text-[8px] text-slate-500 uppercase">Effective</div>
          <div className="text-[10px] text-white font-bold">{weapon.effectiveRange || weapon.range}m</div>
        </div>
      </div>

      {weapon.damageFalloff && weapon.damageFalloff.length > 0 && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <div className="text-[8px] text-slate-500 uppercase mb-1">Damage Falloff</div>
          <div className="h-8 bg-slate-900 border border-white/10 relative flex items-end">
            {weapon.damageFalloff.map((pt, idx, arr) => {
              if (idx === 0) return null;
              const prev = arr[idx - 1];
              const maxDist = arr[arr.length - 1].distance;
              
              const left = (prev.distance / maxDist) * 100;
              const width = ((pt.distance - prev.distance) / maxDist) * 100;
              
              // Draw SVG line or simple div
              return (
                <div 
                  key={idx}
                  className="absolute bottom-0 border-t-2 border-yellow-500 opacity-80"
                  style={{
                    left: \`\${left}%\`,
                    width: \`\${width}%\`,
                    height: \`\${Math.max(1, pt.multiplier * 100)}%\`,
                    borderTopColor: pt.multiplier > 0.8 ? '#eab308' : pt.multiplier > 0.4 ? '#f97316' : '#ef4444',
                    transition: 'all 0.3s'
                  }}
                />
              );
            })}
            
            {/* Range markers */}
            <div className="absolute -bottom-3 left-0 text-[6px] text-slate-500">0m</div>
            <div className="absolute -bottom-3 right-0 text-[6px] text-slate-500">{weapon.damageFalloff[weapon.damageFalloff.length - 1].distance}m</div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

code = code.replace("interface HUDProps", weaponTooltipComponent + "\ninterface HUDProps");

const primaryWeaponReplace = `<div className="border border-white/20 bg-black/40 p-2 mb-2 cursor-pointer hover:bg-white/5 transition flex justify-between items-end relative overflow-visible group">`;
code = code.replace(`<div className="border border-white/20 bg-black/40 p-2 mb-2 cursor-pointer hover:bg-white/5 transition flex justify-between items-end relative overflow-hidden group">`, primaryWeaponReplace);

const primaryWeaponTooltip = `{activeSlot && <WeaponTooltip slot={activeSlot} isPrimary={true} />}`;
code = code.replace(`<div className="absolute top-0 right-0 p-1">`, primaryWeaponTooltip + `\n              <div className="absolute top-0 right-0 p-1">`);

const secondaryWeaponReplace = `<div 
                    key={index}
                    onClick={() => onSwitchWeapon(index)}
                    className="border border-white/10 bg-black/40 p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition h-14 relative overflow-visible group"
                  >`;
code = code.replace(`<div \n                    key={index}\n                    onClick={() => onSwitchWeapon(index)}\n                    className="border border-white/10 bg-black/40 p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition h-14"\n                  >`, secondaryWeaponReplace);

const secondaryWeaponTooltip = `<WeaponTooltip slot={slot} />\n                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate w-full text-center">`;
code = code.replace(`<span className="text-[9px] font-bold text-slate-400 uppercase truncate w-full text-center">`, secondaryWeaponTooltip);

fs.writeFileSync('src/components/HUD.tsx', code);
console.log("Patched HUD with WeaponTooltip");
