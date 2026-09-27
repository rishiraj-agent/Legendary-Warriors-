const fs = require('fs');
let code = fs.readFileSync('src/game/GameWorld.ts', 'utf8');

code = code.replace(
  "this.renderer.setSize(width, height);",
  "this.renderer.setSize(width, height);\n    if (this.composer) this.composer.setSize(width, height);"
);

fs.writeFileSync('src/game/GameWorld.ts', code);
console.log("Patched composer resize");
