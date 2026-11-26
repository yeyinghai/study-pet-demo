/* 知识群岛 v0.2 —— 启动 */
(function () {
  'use strict';
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: UI.W, height: UI.H,
    backgroundColor: '#2f86c4',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    render: { antialias: true, roundPixels: false },
    scene: [Scenes.Boot, Scenes.Title, Scenes.Hatch, Scenes.MapScene, GameScenes.Battle, GameScenes.Shoot, GameScenes.Fish, Scenes.MapUI, HUDScene, TransScene]
  };
  G.game = new Phaser.Game(config);
  window.addEventListener('pointerdown', () => SFX.init(), { once: false });
  window.addEventListener('keydown', () => SFX.init());
})();
