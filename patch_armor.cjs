const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

const targetStr = `    // Shield absorbs incoming damage first
    if (this.armor > 0) {
      if (this.armor >= dmg) {
        this.armor -= dmg;
        dmg = 0;
        soundEngine.playShieldHit();
      } else {
        dmg -= this.armor;
        this.armor = 0;
        soundEngine.playShieldHit();
      }
    }`;
    
const newStr = `    // Armor damage reduction (Kevlar style - absorbs 50% damage if armor durability exists)
    if (this.armor > 0) {
      const absorbed = dmg * 0.5;
      if (this.armor >= absorbed) {
        this.armor -= absorbed;
        dmg -= absorbed;
      } else {
        dmg -= this.armor;
        this.armor = 0;
      }
      soundEngine.playShieldHit();
    }`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched Armor logic");
