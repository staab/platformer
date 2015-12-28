import * as THREE from 'three.js';
import * as R from 'ramda';
import {AnimatedTexture, AnimatedSprite} from './graphics/animation.js';

const textureLoader = new THREE.TextureLoader();

const geometries = {
    cube: new THREE.BoxGeometry(1, 1, 1),
    ground: new THREE.BoxGeometry(20, 6, 20)
};

const materials = {
    normal: new THREE.MeshNormalMaterial({color: 0x00ff00}),
    basic: new THREE.MeshBasicMaterial({color: 0x00ff00})
};

const textures = {
    cauliflower: textureLoader.load('/src/assets/sprites/cauliflower.png')
};

// High-level utility functions

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

function createSprite(texture, scale) {
    let material = new THREE.SpriteMaterial({map: texture, transparent: true});
    let sprite = new THREE.Sprite(material);

    sprite.scale.set(scale, scale, scale);

    return sprite;
}

// =========================
// Game

// Constructor

function Game(element, eventEmitter) {
    var self = this,
        [width, height] = getElementDimensions(element),
        scopeFactor = 50;

    Object.assign(self, {
        element,
        eventEmitter,
        scene: new THREE.Scene(),
        scopeFactor: scopeFactor,
        camera: createOrthographicCamera(width, height, scopeFactor),
        renderer: createRenderer(width, height),
        cameraY: 3,
        cameraAngle: {y: 0},
        cameraTargetAngle: {y: 0},
        cameraRange: scopeFactor / 5,
        cameraOrbitSpeed: 0,
        listeners: {
            'keyup': self.keyup.bind(self),
            'resize': self.resize.bind(self),
            'render': self.render.bind(self)
        },
        sprites: []
    });

    // Put the camera a bit lower
    self.camera.position.y = self.cameraY;

    // Add the canvas element
    self.element.appendChild(self.renderer.domElement);

    // Set up initial state and event handlers
    self.init();
}

// Setup/teardown methods

Game.prototype.init = function init() {
    var self = this,
        ground = new THREE.Mesh(geometries.ground, materials.normal);

    ground.position.y = -3.5;
    self.scene.add(ground);

    self.scene.add(createCube(new THREE.Vector3(0, 0, 0)));
    self.scene.add(createCube(new THREE.Vector3(1, 0, 0)));
    self.scene.add(createCube(new THREE.Vector3(0, 0, 1)));
    self.scene.add(createCube(new THREE.Vector3(-2, 0, 1)));
    self.scene.add(createCube(new THREE.Vector3(0, 0, -3)));
    self.scene.add(createCube(new THREE.Vector3(0, 1, -3)));

    let cSprite = new AnimatedSprite(
        new AnimatedTexture(textures.cauliflower, 42, 1, 42, {stopAt: 0}),
        {scale: 3}
    );
    cSprite.mesh.position.set(0, 0.8, 9.5);
    cSprite.animatedTexture.start();
    self.sprites.push(cSprite);
    self.scene.add(cSprite.mesh);

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

    self.eventEmitter[method]('keyup', self.listeners.keyup);
    self.eventEmitter[method]('resize', self.listeners.resize);
    self.eventEmitter[method]('visibilitychange', self.listeners.resize);
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

Game.prototype.keyup = function keyup(evt) {
    var self = this;

    if (!R.contains(evt.keyCode, [37, 39])) {
        return;
    }

    self.orbit(evt.keyCode === 37 ? 'left' : 'right');
};

// Rendering

Game.prototype.render = function render(tFrame) {
    var self = this;

    window.requestAnimationFrame(self.render.bind(self));

    self.renderer.render(self.scene, self.camera);
    self._orbitStep(tFrame);

    // Update animated textures
    R.forEach(function updateSprite(sprite) {
        sprite.update(tFrame);
    }, self.sprites);
};


Game.prototype._orbitStep = function _orbitStep(tFrame) {
    var self = this;

    // We're done if the current and target angles match.
    // All the abs stuff is so that regardless of whether either is negative,
    // we're still checking how close they are. This misses the edge case of
    // when they're the same number but opposite signs.
    if (Math.abs(Math.abs(self.cameraTargetAngle.y) - Math.abs(self.cameraAngle.y)) < 0.001) {
        // No need to inflate numbers super high due to repeated rotations
        self.cameraTargetAngle.y = self.cameraTargetAngle.y % (2 * Math.PI);
        self.cameraAngle.y = self.cameraTargetAngle.y;

        self.cameraOrbitSpeed = 0;
        self._placeSprites();
    } else {
        self.cameraAngle.y = self.cameraAngle.y + self.cameraOrbitSpeed;
    }

    self.camera.position.x = Math.cos(self.cameraAngle.y) * self.cameraRange;
    self.camera.position.z = Math.sin(self.cameraAngle.y) * self.cameraRange;
    self.camera.lookAt(new THREE.Vector3(0, self.cameraY, 0));
};

Game.prototype._placeSprites = function _placeSprites() {
    // Put sprites close to camera
};

// Public methods

Game.prototype.orbit = function orbit(direction) {
    var self = this,
        baseSpeed = Math.PI/90, // 2 degrees
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

export {Game};