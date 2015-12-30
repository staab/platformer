import * as THREE from 'three.js';

// Animated Texture

function AnimatedTexture(texture, tilesX, tilesY, numTiles, opts) {
    let self = this;


    Object.assign(self, {
        texture,
        tilesX,
        tilesY,
        numTiles,
        duration: (numTiles / 12) * 1000,
        lastUpdate: 0,
        currentTile: 0,
        paused: true,
        stopAt: null
    }, opts);

    // Avoid side effects if texture is shared
    self.texture.clone();

    // how many images does this spritesheet contain?
    // usually equals tilesX * tilesY, but not necessarily,
    // if there at blank tiles at the bottom of the spritesheet.
    self.texture.wrapS = self.texture.wrapT = THREE.RepeatWrapping;
    self.texture.repeat.set(1 / self.tilesX, 1 / self.tilesY);
}

AnimatedTexture.prototype.update = function update(tFrame) {
    let self = this;

    if (self.paused || tFrame - self.lastUpdate < self.duration / self.numTiles) {
        return;
    }

    // Save our last update time to handle frame rate
    self.lastUpdate = tFrame;

    // Increment current tile
    self.currentTile += 1;

    // If we've reached the end of the loop, loop back
    if (self.currentTile === self.numTiles) {
        self.currentTile = 0;
    }

    // If we've reached the end of the animation, stop it
    if (self.currentTile === self.stopAt) {
        self.paused = true;
    }

    // Set spritesheet offsets
    self.texture.offset.x = (self.currentTile % self.tilesX) / self.tilesX;
    self.texture.offset.y = Math.floor(self.currentTile / self.tilesX) / self.tilesY;
};

AnimatedTexture.prototype.start = function start() {
    let self = this;

    self.paused = false;
};

AnimatedTexture.prototype.stop = function stop() {
    let self = this;

    self.paused = true;
};

// Animated Sprite

function AnimatedSprite(opts) {
    let self = this;
    let material = new THREE.SpriteMaterial({
        map: opts.animatedTexture.texture,
        transparent: true
    });
    let mesh = new THREE.Sprite(material);

    Object.assign(self, {
        mesh,
        scale: new THREE.Vector3(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0),
        motion: new THREE.Vector3(0, 0, 0)
    }, opts);

}

AnimatedSprite.prototype.update = function update(tFrame) {
    let self = this;

    // Adjust position based on movement
    self.position.add(self.motion);

    // Copy our canonical data to the mesh
    self.mesh.scale.copy(self.scale);
    self.mesh.position.copy(self.position);

    // Update the texture
    self.animatedTexture.update(tFrame);
};

AnimatedSprite.prototype.startMove = function startMove(vector) {
    let self = this;

    self.animatedTexture.start();
    self.motion.setX(vector.x);
    self.motion.setZ(vector.z);
};

AnimatedSprite.prototype.stopMove = function stopMove() {
    let self = this;

    self.animatedTexture.stop();
    self.motion.setX(0);
    self.motion.setZ(0);
};

AnimatedSprite.prototype.jump = function jump() {

};

export {AnimatedTexture, AnimatedSprite};