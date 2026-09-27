const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

// Add properties
code = code.replace(
  'private isCrouching: boolean = false;',
  'private isCrouching: boolean = false;\n  private isProne: boolean = false;\n  private isSliding: boolean = false;\n  private slideTimer: number = 0;'
);

// Update setInput
code = code.replace(
  "else if (k === 'g') this.deployGlooWall();",
  `else if (k === 'g') this.deployGlooWall();
      else if (k === 'z') {
        this.isProne = !this.isProne;
        if (this.isProne) { this.isCrouching = false; this.isSliding = false; }
      }
      else if (k === 'c') {
        this.isCrouching = !this.isCrouching;
        if (this.isCrouching) { this.isProne = false; this.isSliding = false; }
      }
      else if (k === 'v') {
        if (this.keys['shift'] && !this.isProne && !this.isCrouching && !this.isAiming) {
          this.isSliding = true;
          this.slideTimer = 0.8; // Slide lasts 0.8s
        }
      }`
);

// Remove the direct crouch assignment that might conflict
code = code.replace(
  "this.isCrouching = !!this.keys['c'];",
  "// Removed direct crouch bind"
);

// Update updatePlayerMovement
const oldMovementStart = 'private updatePlayerMovement(deltaTime: number) {';
const newMovementStart = `private updatePlayerMovement(deltaTime: number) {
    if (this.isSliding) {
      this.slideTimer -= deltaTime;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.isCrouching = true; // Slide ends in crouch
      }
    }`;
code = code.replace(oldMovementStart, newMovementStart);

code = code.replace(
  'let baseSpeed = this.isCrouching ? 3.5 : (isSprinting ? 11.0 : 7.0);',
  `let baseSpeed = this.isSliding ? 14.0 : (this.isProne ? 1.5 : (this.isCrouching ? 3.5 : (isSprinting ? 11.0 : 7.0)));`
);

// Update mesh stance scaling visually
const updateWarriorAnimation = `this.playerWarrior.update(
      deltaTime,
      this.playerVelocity.length(),
      this.isCrouching,
      !this.isGrounded,
      this.isSlashing
    );`;

const newWarriorAnimation = `this.playerWarrior.update(
      deltaTime,
      this.playerVelocity.length(),
      this.isCrouching,
      !this.isGrounded,
      this.isSlashing
    );
    
    // Smoothly scale the mesh visually to represent stance
    let targetScaleY = 1.0;
    if (this.isProne) targetScaleY = 0.25;
    else if (this.isCrouching || this.isSliding) targetScaleY = 0.55;
    
    this.playerWarrior.root.scale.y = THREE.MathUtils.lerp(this.playerWarrior.root.scale.y, targetScaleY, 15 * deltaTime);
    // Lower position to keep it grounded while scaled
    this.playerWarrior.root.position.y = this.playerPos.y + (1.0 - this.playerWarrior.root.scale.y) * 0.1;`;
    
code = code.replace(updateWarriorAnimation, newWarriorAnimation);

// Camera offsets
const camHeightStr = 'const targetHeight = this.isAiming ? 1.55 : 2.0;';
const newCamHeightStr = 'const targetHeight = this.isAiming ? 1.55 : (this.isProne ? 0.6 : (this.isCrouching || this.isSliding ? 1.3 : 2.0));';
code = code.replace(camHeightStr, newCamHeightStr);

// Hitbox modification based on stance
const checkHitStr = `// Headshot check (simple height heuristic)
      const hitY = intersection.point.y;
      const isHeadshot = hitY > bot.position.y + 1.4;`;
      
const newCheckHitStr = `// Hitbox multiplier logic
      const hitY = intersection.point.y;
      const relativeY = hitY - bot.position.y;
      let isHeadshot = false;
      let multiplier = 1.0;
      
      if (relativeY > 1.4) {
        isHeadshot = true;
        multiplier = 3.5;
      } else if (relativeY < 0.7) {
        multiplier = 0.7; // Limb/leg shot
      }`;
code = code.replace(checkHitStr, newCheckHitStr);

code = code.replace(
  'const dmg = wData.damage * (isHeadshot ? wData.headshotMultiplier : 1.0);',
  'const dmg = wData.damage * (isHeadshot ? 3.5 : multiplier);' // Explicit 3.5x
);

fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched GameWorld.ts");
