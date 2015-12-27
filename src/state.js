import {createStore} from 'redux';
import R from 'ramda';

const initialState = {};
const actionHandlers = {};

function mainReducer(state = initialState, action) {
    let fn = actionHandlers[action.type];

    if (fn) {
        return R.merge(state, fn(state, action));
    }

    return state;
}

export let store = createStore(mainReducer);