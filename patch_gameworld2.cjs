const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

const oldDmgLine = 'let dmg = isHeadshot ? weapon.damage * weapon.headshotMultiplier : weapon.damage;';
const newDmgLine = `// Limb hit approximation (bottom 25% of body box)
      const isLimb = !isHeadshot && (hitPoint.y - hitBot.position.y) < 0.6;
      let multiplier = isHeadshot ? 3.5 : (isLimb ? 0.7 : 1.0);
      let dmg = weapon.damage * multiplier;`;

code = code.replace(oldDmgLine, newDmgLine);
fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched dmg multipliers");
