const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

const oldDmgLine = 'let dmg = weapon.damage * multiplier;';
const newDmgLine = `
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
      
      let dmg = weapon.damage * multiplier * falloffMultiplier;`;

code = code.replace(oldDmgLine, newDmgLine);
fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched gameWorld dmg calculation");
