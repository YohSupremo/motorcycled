import { createStore, applyMiddleware, combineReducers } from "redux";
import { thunk } from "redux-thunk";
import { authReducer } from "./reducers/userReducers";
import { profileReducer } from "./reducers/profileReducer";
const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
