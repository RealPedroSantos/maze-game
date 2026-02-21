import Phaser from 'phaser';

import BootScene from './game/scenes/BootScene';
import MenuScene from './game/scenes/MenuScene';
import PlayingScene from './game/scenes/PlayingScene';
import GameOverScene from './game/scenes/GameOverScene';
import RankingScene from './game/scenes/RankingScene';
import './ui/styles.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'app',
  scene: [BootScene, MenuScene, PlayingScene, GameOverScene, RankingScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
};

new Phaser.Game(config);
