const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

const targetStr = "container.appendChild(this.renderer.domElement);";
const newStr = `container.appendChild(this.renderer.domElement);

    // Setup Post Processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.6;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched composer initialization");
