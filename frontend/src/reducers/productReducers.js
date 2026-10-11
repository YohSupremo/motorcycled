// Product Redux reducers
// Reference: itcp318-s3a-2026/frontend/src/reducers/productReducers.jsx

import {
  ADMIN_PRODUCTS_REQUEST,
  ADMIN_PRODUCTS_SUCCESS,
  ADMIN_PRODUCTS_FAIL,
  ALL_PRODUCTS_REQUEST,
  ALL_PRODUCTS_SUCCESS,
  ALL_PRODUCTS_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
  NEW_PRODUCT_REQUEST,
  NEW_PRODUCT_SUCCESS,
  NEW_PRODUCT_FAIL,
  NEW_PRODUCT_RESET,
  UPDATE_PRODUCT_REQUEST,
  UPDATE_PRODUCT_SUCCESS,
  UPDATE_PRODUCT_FAIL,
  UPDATE_PRODUCT_RESET,
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_SUCCESS,
  DELETE_PRODUCT_FAIL,
  DELETE_PRODUCT_RESET,
  ARCHIVE_PRODUCT_REQUEST,
  ARCHIVE_PRODUCT_SUCCESS,
  ARCHIVE_PRODUCT_FAIL,
  ARCHIVE_PRODUCT_RESET,
  GET_CATEGORIES_REQUEST,
  GET_CATEGORIES_SUCCESS,
  GET_CATEGORIES_FAIL,
  GET_BRANDS_REQUEST,
  GET_BRANDS_SUCCESS,
  GET_BRANDS_FAIL,
  CLEAR_ERRORS,
} from "../constants/productConstants.js";

// ─── Admin / public products list ─────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/reducers/productReducers.jsx
export const productsReducer = (
  state = { loading: false, products: [], error: null },
  action,
) => {
  switch (action.type) {
    case ADMIN_PRODUCTS_REQUEST:
    case ALL_PRODUCTS_REQUEST:
      return { ...state, loading: true };

    case ADMIN_PRODUCTS_SUCCESS:
    case ALL_PRODUCTS_SUCCESS:
      return {
        loading: false,
        products: action.payload.products,
        productsCount: action.payload.productsCount,
        resPerPage: action.payload.resPerPage,
        filteredProductsCount: action.payload.filteredProductsCount,
        error: null,
      };

    case ADMIN_PRODUCTS_FAIL:
    case ALL_PRODUCTS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Single product details ────────────────────────────────────────────────────
export const productDetailsReducer = (
  state = { loading: false, product: {}, error: null },
  action,
) => {
  switch (action.type) {
    case PRODUCT_DETAILS_REQUEST:
      return { ...state, loading: true };

    case PRODUCT_DETAILS_SUCCESS:
      return { loading: false, product: action.payload, error: null };

    case PRODUCT_DETAILS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── New product ──────────────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/reducers/productReducers.jsx (newProduct reducer)
export const newProductReducer = (
  state = { loading: false, success: false, product: {}, error: null },
  action,
) => {
  switch (action.type) {
    case NEW_PRODUCT_REQUEST:
      return { ...state, loading: true };

    case NEW_PRODUCT_SUCCESS:
      return { loading: false, success: true, product: action.payload.product, error: null };

    case NEW_PRODUCT_FAIL:
      return { ...state, loading: false, error: action.payload };

    case NEW_PRODUCT_RESET:
      return { ...state, success: false };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Update / Delete / Archive product ───────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/reducers/productReducers.jsx (product reducer)
export const productReducer = (
  state = { loading: false, isDeleted: false, isUpdated: false, isArchived: null, error: null },
  action,
) => {
  switch (action.type) {
    case UPDATE_PRODUCT_REQUEST:
    case DELETE_PRODUCT_REQUEST:
    case ARCHIVE_PRODUCT_REQUEST:
      return { ...state, loading: true };

    case UPDATE_PRODUCT_SUCCESS:
      return { ...state, loading: false, isUpdated: true };

    case DELETE_PRODUCT_SUCCESS:
      return { ...state, loading: false, isDeleted: true };

    case ARCHIVE_PRODUCT_SUCCESS:
      return { ...state, loading: false, isArchived: action.payload };

    case UPDATE_PRODUCT_FAIL:
    case DELETE_PRODUCT_FAIL:
    case ARCHIVE_PRODUCT_FAIL:
      return { ...state, loading: false, error: action.payload };

    case UPDATE_PRODUCT_RESET:
      return { ...state, isUpdated: false };

    case DELETE_PRODUCT_RESET:
      return { ...state, isDeleted: false };

    case ARCHIVE_PRODUCT_RESET:
      return { ...state, isArchived: null };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Catalog: Categories & Brands ─────────────────────────────────────────────
export const catalogReducer = (
  state = { loadingCategories: false, categories: [], loadingBrands: false, brands: [], error: null },
  action,
) => {
  switch (action.type) {
    case GET_CATEGORIES_REQUEST:
      return { ...state, loadingCategories: true };
    case GET_CATEGORIES_SUCCESS:
      return { ...state, loadingCategories: false, categories: action.payload };
    case GET_CATEGORIES_FAIL:
      return { ...state, loadingCategories: false, error: action.payload };

    case GET_BRANDS_REQUEST:
      return { ...state, loadingBrands: true };
    case GET_BRANDS_SUCCESS:
      return { ...state, loadingBrands: false, brands: action.payload };
    case GET_BRANDS_FAIL:
      return { ...state, loadingBrands: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};
