import { createStore, applyMiddleware, combineReducers } from "redux";
import { thunk } from "redux-thunk";
import { authReducer } from "./reducers/userReducers";
import { profileReducer } from "./reducers/profileReducer";
import {
  productsReducer,
  newProductReducer,
  productReducer,
  productDetailsReducer,
  catalogReducer,
} from "./reducers/productReducers";

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  // Product reducers — Reference: itcp318-s3a-2026/frontend/src/store.js
  products: productsReducer,
  newProduct: newProductReducer,
  product: productReducer,
  productDetails: productDetailsReducer,
  catalog: catalogReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
