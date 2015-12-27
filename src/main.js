import {store} from './state.js';
import {Game} from './game.js';


;(function () {
    let game = new Game(document.getElementById('game-stage'));

    (function mainLoop(tFrame) {
        let state = store.getState();

        window.requestAnimationFrame(mainLoop);
    }());
}());