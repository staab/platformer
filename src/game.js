import * as Easel from 'jspm_packages/github/CreateJS/EaselJS@0.8.2';
import * as R from 'ramda';

function createSprite(config) {
    return new Easel.Sprite(new Easel.SpriteSheet(config));
}

function Character(initData) {
    var self = this;

    Object.assign(self, {
        initData,
        sprite: createSprite(initData)
    });
}

function Game(elementId) {
    var self = this;

    Object.assign(self, {
        stage: new Easel.Stage(elementId),
        characters: {
            iotfire: new Character({
                images: ['/src/assets/sprites/iotfire.png'],
                framerate: 12,
                frames: {width: 160, height: 120, count: 38, regX: 0, regY: 0},
                animations: {panic: [0, 37]}
            }),
            cauliflower: new Character({
                images: ['/src/assets/sprites/cauliflower.png'],
                framerate: 12,
                frames: {width: 300, height: 300, count: 42, regX: 0, regY: 0},
                animations: {
                    start: [0, 15],
                    walk: [16, 32],
                    stop: [33, 41]
                }
            })
        }
    });

    let times = 0;

    Easel.Ticker.addEventListener('tick', self.onTick.bind(self));

    self.stage.addChild(self.characters.cauliflower.sprite);

    self.characters.cauliflower.sprite.gotoAndPlay("start");

    self.characters.cauliflower.sprite.addEventListener('click', function (evt) {
        times += 1;
        self.characters.cauliflower.sprite.x = 0;
        self.characters.cauliflower.sprite.gotoAndPlay("start");

    });

    self.characters.cauliflower.sprite.addEventListener('tick', function (evt){
        let character = self.characters.cauliflower,
            sprite = character.sprite,
            anims = character.initData.animations,
            animsKeys = R.keys(anims),
            currentAnimIndex = R.findIndex(R.equals(sprite.currentAnimation), animsKeys),
            nextAnimIndex = currentAnimIndex + 1,
            nextAnim = animsKeys[nextAnimIndex];

        if (sprite.paused) {
            return;
        }

        sprite.x = (times * 320) + Math.max(Math.min(sprite.currentFrame, 37), 5)  * 10;

        if (sprite.currentFrame === anims[sprite.currentAnimation][1]) {
            if (nextAnimIndex >= animsKeys.length) {
                sprite.stop();
                // sprite.gotoAndStop(animsKeys[0]);
            } else {
                sprite.gotoAndPlay(nextAnim);
            }
        }
    });
}

Game.prototype.onTick = function onTick(evt) {
    var self = this;

    self.stage.update(evt);
};

export {Game};