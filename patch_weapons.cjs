const fs = require('fs');
let code = fs.readFileSync('src/data/gameData.ts', 'utf8');

// Replace desert_eagle
code = code.replace(
  "ammoType: 'HG Ammo',\n  },",
  "ammoType: 'HG Ammo',\n    effectiveRange: 35,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 25, multiplier: 0.9}, {distance: 50, multiplier: 0.6}, {distance: 100, multiplier: 0.3}],\n  },"
);

// Replace katana
code = code.replace(
  "ammoType: 'Melee',\n  },",
  "ammoType: 'Melee',\n    effectiveRange: 4.8,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 4.8, multiplier: 1.0}, {distance: 5.0, multiplier: 0.0}],\n  },"
);

// Replace mp40
code = code.replace(
  "ammoType: 'SMG Ammo',\n  },",
  "ammoType: 'SMG Ammo',\n    effectiveRange: 20,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 15, multiplier: 1.0}, {distance: 30, multiplier: 0.7}, {distance: 50, multiplier: 0.4}],\n  },"
);

// Replace ak47
code = code.replace(
  "ammoType: 'AR Ammo',\n  },",
  "ammoType: 'AR Ammo',\n    effectiveRange: 60,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 40, multiplier: 1.0}, {distance: 70, multiplier: 0.8}, {distance: 100, multiplier: 0.5}],\n  },"
);

// Replace scar
code = code.replace(
  "description: 'Extremely accurate and stable assault rifle with rapid recoil recovery.',\n    ammoType: 'AR Ammo',\n  },",
  "description: 'Extremely accurate and stable assault rifle with rapid recoil recovery.',\n    ammoType: 'AR Ammo',\n    effectiveRange: 65,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 50, multiplier: 1.0}, {distance: 80, multiplier: 0.85}, {distance: 120, multiplier: 0.6}],\n  },"
);

// Replace m1887
code = code.replace(
  "ammoType: 'SG Ammo',\n  },",
  "ammoType: 'SG Ammo',\n    effectiveRange: 8,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 5, multiplier: 0.9}, {distance: 12, multiplier: 0.4}, {distance: 25, multiplier: 0.1}],\n  },"
);

// Replace awm
code = code.replace(
  "ammoType: 'Sniper Ammo',\n  },",
  "ammoType: 'Sniper Ammo',\n    effectiveRange: 150,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 80, multiplier: 1.0}, {distance: 150, multiplier: 0.95}, {distance: 300, multiplier: 0.8}],\n  },"
);

// Replace plasma_launcher
code = code.replace(
  "aoeRadius: 6.5,\n  },",
  "aoeRadius: 6.5,\n    effectiveRange: 60,\n    damageFalloff: [{distance: 0, multiplier: 1.0}, {distance: 40, multiplier: 1.0}, {distance: 80, multiplier: 0.7}, {distance: 120, multiplier: 0.5}],\n  },"
);

fs.writeFileSync('src/data/gameData.ts', code);
console.log("Patched weapons!");
