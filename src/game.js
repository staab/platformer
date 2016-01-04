"use strict";

import * as THREE from 'three.js';
import * as R from 'ramda';
import * as Physijs from 'chandlerprall/Physijs';
import {AnimatedTexture, AnimatedSprite} from './graphics/animation.js';

// Gotta make three really global for physijs
window.THREE = THREE;

// Configure Physijs
Physijs.scripts.worker = '/jspm_packages/github/chandlerprall/Physijs@master/physijs_worker.js';
Physijs.scripts.ammo = '/jspm_packages/npm/ammo.js@0.0.8/ammo.js';

const textureLoader = new THREE.TextureLoader();

const geometries = {
    cube: new THREE.BoxGeometry(1, 1, 1)
};

const materials = {
    normal: new THREE.MeshNormalMaterial({color: 0x00ff00}),
    basic: new THREE.MeshBasicMaterial({color: 0x00ff00})
};

const textures = {
    cauliflower: textureLoader.load('/src/assets/sprites/cauliflower.png')
};


const keyCodes = {
    37: 'player-left',
    38: 'player-jump',
    39: 'player-right',
    40: 'player-down',
    65: 'orbit-left',
    83: 'orbit-right'
};

// High-level utility functions

function getKeyByValue(obj, value) {
    return R.keys(obj).filter(key => obj[key] === value)[0];
}

function getElementDimensions(element) {
    return [element.offsetWidth, element.offsetHeight];
}

function createOrthographicCamera(width, height, factor) {
    return new THREE.OrthographicCamera(
        width / -factor,
        width / factor,
        height / factor,
        height / -factor,
        -factor, factor
    );
}

function createRenderer(width, height) {
    var renderer = new THREE.WebGLRenderer({alpha: true});

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

function buildMap(x, y, z) {
    let elements = [];
    let elementsMap = {};

    function isAboveBlock(curX, curY, curZ) {
        return curY === 0 || elementsMap[curY - 1][curX][curZ];
    }

    for (let curY = 0; curY <= y; curY += 1) {
        elementsMap[curY] = {};

        for (let curX = -x/2; curX <= x/2; curX += 1) {
            elementsMap[curY][curX] = {};

            for (let curZ = -z/2; curZ <= z/2; curZ += 1) {
                elementsMap[curY][curX][curZ] = false;

                // If it has a block below it randomly add one -
                // make it more likely at lower levels.
                if (isAboveBlock(curX, curY, curZ) && Math.random(y) * y > curY + 2 + y/2) {
                    elementsMap[curY][curX][curZ] = true;
                    elements.push(createCube(new THREE.Vector3(curX, curY, curZ)));
                }
            }
        }
    }

    return elements;
}

// =========================
// Game

// Constructor

function Game(element, eventEmitter, opts = {}) {
    var self = this,
        [width, height] = getElementDimensions(element),
        scopeFactor = 50;

    Object.assign(self, {
        element,
        eventEmitter,
        // Basics
        scene: new Physijs.Scene(),
        renderer: createRenderer(width, height),
        groundSize: 20,
        // Camera
        scopeFactor: scopeFactor,
        camera: createOrthographicCamera(width, height, scopeFactor),
        cameraY: 3,
        cameraAngle: {y: 0},
        cameraTargetAngle: {y: 0},
        cameraRange: scopeFactor / 5,
        cameraOrbitSpeed: 0,
        // Data
        sprites: [],
        player: null
    }, opts);

    // Put the camera a bit lower
    self.camera.position.y = self.cameraY;

    // Add the canvas element
    self.element.appendChild(self.renderer.domElement);

    // Set up initial state and event handlers
    self.init();
}

// Setup/teardown methods

Game.prototype.init = function init() {
    let self = this;

    // Add ground
    {
        let geometry = new THREE.BoxGeometry(self.groundSize, 6, self.groundSize);

        // Put the pivot of the geometry at the top
        geometry.translate(0, -3.5, 0);

        // Add the mesh
        self.scene.add(new THREE.Mesh(geometry, materials.normal));
    }

    // Add terrain
    // R.forEach(element => self.scene.add(element), buildMap(self.groundSize - 1, 10, self.groundSize - 1));

    // Add player
    {
        self.player = new AnimatedSprite({
            animatedTexture: new AnimatedTexture(textures.cauliflower, 42, 1, 42, {stopAt: 0}),
            scale: new THREE.Vector3(3, 3, 3),
            position: new THREE.Vector3(0, 0.8, 9.5)
        });

        self.sprites.push(self.player);
        self.scene.add(self.player.mesh);
    }

    self.resize();
    self.render();

    self.setEventListeners('addEventListener');
};

Game.prototype.destroy = function destroy() {
    var self = this;

    self.setEventListeners('removeEventListener');
    self.element.removeChild(self.renderer.domElement);
};

Game.prototype.setEventListeners = function setEventListeners(method) {
    var self = this;

    self.eventEmitter[method]('keydown', self.keydown.bind(self));
    self.eventEmitter[method]('keyup', self.keyup.bind(self));
    self.eventEmitter[method]('resize', self.resize.bind(self));
    self.eventEmitter[method]('visibilitychange', self.resize.bind(self));
};

Game.prototype.resize = function resize() {
    let self = this;
    let [width, height] = getElementDimensions(self.element);

    // Renderer
    self.renderer.setSize(width, height);

    // Camera
    self.camera.left = width / -self.scopeFactor;
    self.camera.right = width / self.scopeFactor;
    self.camera.top = height / self.scopeFactor;
    self.camera.bottom = height / -self.scopeFactor;
    self.camera.updateProjectionMatrix();
};

// Event listeners

Game.prototype.keydown = function keydown(evt) {
    let self = this;
    let action = keyCodes[evt.keyCode];

    if (!action) {
        return;
    }

    // Move the sprite left or right
    if (R.contains(action, ['player-left', 'player-right'])) {
        let negation = action === 'player-right' ? -1 : 1;
        let camPos = R.pick(['x', 'z'], self.camera.position);
        let axis = getKeyByValue(camPos, Math.min.apply(null, R.values(camPos)));
        let direction = new THREE.Vector3();

        // Set the axis to the delta
        direction['set' + axis.toUpperCase()](negation * 0.1);

        // Start the movement
        self.player.startMove(direction);
    }

    if (action === 'player-jump') {
        self.player.jump();
    }
};

Game.prototype.keyup = function keyup(evt) {
    let self = this;
    let action = keyCodes[evt.keyCode];

    if (!action) {
        return;
    }

    if (R.contains('orbit-', action)) {
        self.orbit(action.replace('orbit-', ''));
    }

    if (R.contains(action, ['player-left', 'player-right'])) {
        self.player.stopMove();
    }
};

// Rendering

Game.prototype.render = function render(tFrame) {
    var self = this;

    // Get next frame as early as possible
    window.requestAnimationFrame(self.render.bind(self));

    // Orbit the camera
    self._orbitStep(tFrame);

    // Update sprite texture and position
    self._updateSprites(tFrame);

    // Render all the objects
    self.renderer.render(self.scene, self.camera);
};


Game.prototype._orbitStep = function _orbitStep(tFrame) {
    var self = this;

    if (self.cameraOrbitSpeed === 0) {
        // Not doing anything right now
    } else if (Math.abs(Math.abs(self.cameraTargetAngle.y) - Math.abs(self.cameraAngle.y)) < 0.001) {
        // We're done if the current and target angles match.
        // All the abs stuff is so that regardless of whether either is negative,
        // we're still checking how close they are. This misses the edge case of
        // when they're the same number but opposite signs.

        // No need to inflate numbers super high due to repeated rotations
        self.cameraTargetAngle.y = self.cameraTargetAngle.y % (2 * Math.PI);
        self.cameraAngle.y = self.cameraTargetAngle.y;

        // Stop orbiting
        self.cameraOrbitSpeed = 0;
    } else {
        self.cameraAngle.y = self.cameraAngle.y + self.cameraOrbitSpeed;
    }

    self.camera.position.x = Math.cos(self.cameraAngle.y) * self.cameraRange;
    self.camera.position.z = Math.sin(self.cameraAngle.y) * self.cameraRange;
    self.camera.lookAt(new THREE.Vector3(0, self.cameraY, 0));
};

Game.prototype._updateSprites = function _updateSprites(tFrame) {
    let self = this;

    R.forEach(sprite => sprite.update(tFrame), self.sprites);
};

Game.prototype._placeSprite = function _placeSprite(sprite) {
    let self = this;
    let dim = self.camera.position.x ? 'x' : 'z';
    let sign = self.camera.position[dim] / Math.abs(self.camera.position[dim]);

    sprite.position[dim] = sign * 9.5;
};

// Public methods

Game.prototype.orbit = function orbit(direction) {
    var self = this,
        baseSpeed = Math.PI/30, // 6 degrees
        angleDelta = Math.PI/2; // 90 degrees

    // Validate direction
    console.assert(R.contains(direction, ['left', 'right']));

    // Reverse the direction if we're going left
    if (direction === 'left') {
        self.cameraOrbitSpeed = -baseSpeed;
        self.cameraTargetAngle.y -= angleDelta;
    } else {
        self.cameraOrbitSpeed = baseSpeed;
        self.cameraTargetAngle.y += angleDelta;
    }
};

Game.prototype.movePlayer = function movePlayer() {

};

export {Game};