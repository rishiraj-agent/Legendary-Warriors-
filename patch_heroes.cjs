const fs = require('fs');
let code = fs.readFileSync('src/data/gameData.ts', 'utf8');

code = code.replace(
  "skillName: 'Drop the Beat',",
  "skillName: 'Healing Aura',"
).replace(
  "skillDescription: 'Creates a 5m aura that increases movement speed by 15% and restores 5 HP/s.',",
  "skillDescription: 'Creates a 5-meter radius movement speed aura (+15%) and restores +5 HP/sec for 10 seconds.',"
);

code = code.replace(
  "skillName: 'Time Turner',",
  "skillName: 'Shield Barrier',"
).replace(
  "skillDescription: 'Deploys an invulnerable energy shield dome that deflects enemy bullets.',",
  "skillDescription: 'Spawns a spherical force field absorbing 500 damage for 6 seconds.',"
);

fs.writeFileSync('src/data/gameData.ts', code);
console.log("Patched heroes");
