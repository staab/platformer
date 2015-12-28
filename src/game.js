import * as THREE from 'three.js';
import * as R from 'ramda';

var geometries = {
    cube: new THREE.BoxGeometry(1, 1, 1)
};

var materials = {
    normal: new THREE.MeshNormalMaterial({color: 0x00ff00})
};

// High-level utility functions

function getElementDimensions(element) {
    return [window.innerWidth, window.innerHeight];
}

function createPerspectiveCamera(width, height) {
    return new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
}

function createOrthographicCamera(width, height) {
    return new THREE.OrthographicCamera(width / -100, width / 100, height / 100, height / -100, 1, 1000);
}

function createRenderer(width, height) {
    var renderer = new THREE.WebGLRenderer();

    renderer.setSize(width, height);

    return renderer;
}

// Object construction

function createCube(position) {
    var cube = new THREE.Mesh(
        geometries.cube,
        materials.normal
    );

    cube.position.x = position.x;
    cube.position.y = position.y;
    cube.position.z = position.z;

    return cube;
}

// Game

function Game(element) {
    var self = this,
        [width, height] = getElementDimensions(element);

    Object.assign(self, {
        scene: new THREE.Scene(),
        camera: createOrthographicCamera(width, height),
        renderer: createRenderer(width, height),
        cameraAngle: 0,
        cameraTargetAngle: 0,
        cameraRange: 5,
        cameraOrbitSpeed: 0
    });

    element.appendChild(self.renderer.domElement);

    self.scene.add(createCube(new THREE.Vector3(0, 0, 0)));
    self.scene.add(createCube(new THREE.Vector3(1, 0, 0)));
    self.scene.add(createCube(new THREE.Vector3(0, 0, 1)));
    self.scene.add(createCube(new THREE.Vector3(-2, 0, 1)));
    self.scene.add(createCube(new THREE.Vector3(0, 0, -3)));

    self.render();

    window.addEventListener('keyup', function (evt) {
        if (!R.contains(evt.keyCode, [37, 39])) {
            return;
        }

        self.orbit(evt.keyCode === 37 ? 'left' : 'right');
    });
}

Game.prototype.render = function render() {
    var self = this;

    window.requestAnimationFrame(self.render.bind(self));

    self.renderer.render(self.scene, self.camera);
    self.orbitStep();
};


Game.prototype.orbitStep = function orbitStep() {
    var self = this;

    // We're done if the current and target angles match.
    // All the abs stuff is so that regardless of whether either is negative,
    // we're still checking how close they are. This misses the edge case of
    // when they're the same number but opposite signs.
    if (Math.abs(Math.abs(self.cameraTargetAngle) - Math.abs(self.cameraAngle)) < 0.001) {
        self.cameraAngle = self.cameraTargetAngle;
        self.cameraOrbitSpeed = 0;
    } else {
        self.cameraAngle = self.cameraAngle + self.cameraOrbitSpeed;
    }

    self.camera.position.x = Math.cos(self.cameraAngle) * self.cameraRange;
    self.camera.position.z = Math.sin(self.cameraAngle) * self.cameraRange;
    self.camera.lookAt(new THREE.Vector3(0, 0, 0));
};

Game.prototype.orbit = function orbit(direction) {
    var self = this,
        baseSpeed = Math.PI/90, // 2 degrees
        angleDelta = Math.PI/2; // 90 degrees


    // Validate direction
    console.assert(R.contains(direction, ['left', 'right']));

    // Reverse the direction if we're going left
    if (direction === 'left') {
        self.cameraOrbitSpeed = -baseSpeed;
        self.cameraTargetAngle -= angleDelta;
    } else {
        self.cameraOrbitSpeed = baseSpeed;
        self.cameraTargetAngle += angleDelta;
    }
};

export {Game};
























// function createSprite(config) {
//     return new Easel.Sprite(new Easel.SpriteSheet(config));
// }

// function Character(initData) {
//     var self = this;

//     Object.assign(self, {
//         initData,
//         sprite: createSprite(initData)
//     });
// }

// function Game(element) {
//     var self = this;

//     Object.assign(self, {
//         stage: new Easel.Stage(element),
//         characters: {
//             iotfire: new Character({
//                 images: ['/src/assets/sprites/iotfire.png'],
//                 framerate: 12,
//                 frames: {width: 160, height: 120, count: 38, regX: 0, regY: 0},
//                 animations: {panic: [0, 37]}
//             }),
//             cauliflower: new Character({
//                 images: ['/src/assets/sprites/cauliflower.png'],
//                 framerate: 12,
//                 frames: {width: 300, height: 300, count: 42, regX: 0, regY: 0},
//                 animations: {
//                     start: [0, 15],
//                     walk: [16, 32],
//                     stop: [33, 41]
//                 }
//             })
//         }
//     });

//     let times = 0;

//     Easel.Ticker.addEventListener('tick', self.onTick.bind(self));

//     self.stage.addChild(self.characters.cauliflower.sprite);

//     self.characters.cauliflower.sprite.gotoAndPlay("start");

//     self.characters.cauliflower.sprite.addEventListener('click', function (evt) {
//         times += 1;
//         self.characters.cauliflower.sprite.x = 0;
//         self.characters.cauliflower.sprite.gotoAndPlay("start");

//     });

//     self.characters.cauliflower.sprite.addEventListener('tick', function (evt){
//         let character = self.characters.cauliflower,
//             sprite = character.sprite,
//             anims = character.initData.animations,
//             animsKeys = R.keys(anims),
//             currentAnimIndex = R.findIndex(R.equals(sprite.currentAnimation), animsKeys),
//             nextAnimIndex = currentAnimIndex + 1,
//             nextAnim = animsKeys[nextAnimIndex];

//         if (sprite.paused) {
//             return;
//         }

//         sprite.x = (times * 320) + Math.max(Math.min(sprite.currentFrame, 37), 5)  * 10;

//         if (sprite.currentFrame === anims[sprite.currentAnimation][1]) {
//             if (nextAnimIndex >= animsKeys.length) {
//                 sprite.stop();
//                 // sprite.gotoAndStop(animsKeys[0]);
//             } else {
//                 sprite.gotoAndPlay(nextAnim);
//             }
//         }
//     });
// }

// Game.prototype.onTick = function onTick(evt) {
//     var self = this;

//     self.stage.update(evt);
// };

// export {Game};