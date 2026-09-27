const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

// Add imports
const imports = `import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';`;

code = code.replace("import * as THREE from 'three';", "import * as THREE from 'three';\n" + imports);

// Add composer property
code = code.replace("private renderer: THREE.WebGLRenderer;", "private renderer: THREE.WebGLRenderer;\n  private composer: EffectComposer;");

// Initialize composer
const initRenderer = `this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);`;
    
const initComposer = `this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    
    // Setup Post Processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.6;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);`;
    
code = code.replace(initRenderer, initComposer);

// Replace renderer.render with composer.render
code = code.replace('this.renderer.render(this.scene, this.camera);', 'this.composer.render();');

// Resize composer
const resizeRenderer = `this.renderer.setSize(window.innerWidth, window.innerHeight);`;
const resizeComposer = `this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);`;
code = code.replace(resizeRenderer, resizeComposer);

fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched Bloom into GameWorld.ts");
