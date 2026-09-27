const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

const targetStr = 'this.playerWarrior.root.rotation.y = this.playerRotationY;';
const newStr = `this.playerWarrior.root.rotation.y = this.playerRotationY;
    
    // Smoothly scale the mesh visually to represent stance
    let targetScaleY = 1.0;
    if (this.isProne) targetScaleY = 0.25;
    else if (this.isCrouching || this.isSliding) targetScaleY = 0.55;
    
    this.playerWarrior.root.scale.y = THREE.MathUtils.lerp(this.playerWarrior.root.scale.y, targetScaleY, 15 * deltaTime);
    // Lower position to keep it grounded while scaled
    this.playerWarrior.root.position.y = this.playerPos.y + (1.0 - this.playerWarrior.root.scale.y) * 0.1;`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched mesh scale");
