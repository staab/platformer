import {createStore} from 'redux';
import * as Konva from 'konva';

function mainReducer(state = {}, action) {
    if (typeof action.type === 'function') {
        return action.type(state);
    }

    return state;
}

;(function () {
    let store = createStore(mainReducer);

    let stage = new Konva.Stage({
        container: 'game-stage',
        width: 500,
        height: 500
    });

    let layer = new Konva.Layer();

    var circle = new Konva.Circle({
        x: stage.getWidth() / 2,
        y: stage.getHeight() / 2,
        radius: 70,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 4
    });

    // add the shape to the layer
    layer.add(circle);
    stage.add(layer);

    function main(tFrame) {
        let state = store.getState();

        window.requestAnimationFrame(main);
    }

    main();
}());