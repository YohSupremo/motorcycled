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
  CREATE_CATEGORY_REQUEST,
  CREATE_CATEGORY_SUCCESS,
  CREATE_CATEGORY_FAIL,
  CREATE_CATEGORY_RESET,
  UPDATE_CATEGORY_REQUEST,
  UPDATE_CATEGORY_SUCCESS,
  UPDATE_CATEGORY_FAIL,
  UPDATE_CATEGORY_RESET,
  DELETE_CATEGORY_REQUEST,
  DELETE_CATEGORY_SUCCESS,
  DELETE_CATEGORY_FAIL,
  DELETE_CATEGORY_RESET,
  RESTORE_CATEGORY_REQUEST,
  RESTORE_CATEGORY_SUCCESS,
  RESTORE_CATEGORY_FAIL,
  RESTORE_CATEGORY_RESET,
  CREATE_BRAND_REQUEST,
  CREATE_BRAND_SUCCESS,
  CREATE_BRAND_FAIL,
  CREATE_BRAND_RESET,
  UPDATE_BRAND_REQUEST,
  UPDATE_BRAND_SUCCESS,
  UPDATE_BRAND_FAIL,
  UPDATE_BRAND_RESET,
  DELETE_BRAND_REQUEST,
  DELETE_BRAND_SUCCESS,
  DELETE_BRAND_FAIL,
  DELETE_BRAND_RESET,
  RESTORE_BRAND_REQUEST,
  RESTORE_BRAND_SUCCESS,
  RESTORE_BRAND_FAIL,
  RESTORE_BRAND_RESET,
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
  state = { loading: false, isDeleted: false, isUpdated: false, isArchived: null, message: null, error: null },
  action,
) => {
  switch (action.type) {
    case UPDATE_PRODUCT_REQUEST:
    case DELETE_PRODUCT_REQUEST:
    case ARCHIVE_PRODUCT_REQUEST:
      return { ...state, loading: true };

    case UPDATE_PRODUCT_SUCCESS:
      return { ...state, loading: false, isUpdated: true, message: action.payload?.message || action.payload };

    case DELETE_PRODUCT_SUCCESS:
      return {
        ...state,
        loading: false,
        isDeleted: true,
        message: typeof action.payload === "string" ? action.payload : action.payload?.message,
      };

    case ARCHIVE_PRODUCT_SUCCESS:
      return {
        ...state,
        loading: false,
        isArchived: typeof action.payload === "object" ? action.payload.isArchived : action.payload,
        message: action.payload?.message,
      };

    case UPDATE_PRODUCT_FAIL:
    case DELETE_PRODUCT_FAIL:
    case ARCHIVE_PRODUCT_FAIL:
      return { ...state, loading: false, error: action.payload };

    case UPDATE_PRODUCT_RESET:
      return { ...state, isUpdated: false, message: null };

    case DELETE_PRODUCT_RESET:
      return { ...state, isDeleted: false, message: null };

    case ARCHIVE_PRODUCT_RESET:
      return { ...state, isArchived: null, message: null };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Catalog: Categories & Brands (with full CRUD support) ────────────────────
export const catalogReducer = (
  state = {
    loadingCategories: false,
    categories: [],
    loadingBrands: false,
    brands: [],
    actionLoading: false,
    isCategoryCreated: false,
    isCategoryUpdated: false,
    isCategoryDeleted: false,
    isCategoryRestored: false,
    isBrandCreated: false,
    isBrandUpdated: false,
    isBrandDeleted: false,
    isBrandRestored: false,
    error: null,
  },
  action,
) => {
  switch (action.type) {
    // Categories Fetch
    case GET_CATEGORIES_REQUEST:
      return { ...state, loadingCategories: true };
    case GET_CATEGORIES_SUCCESS:
      return { ...state, loadingCategories: false, categories: action.payload };
    case GET_CATEGORIES_FAIL:
      return { ...state, loadingCategories: false, error: action.payload };

    // Brands Fetch
    case GET_BRANDS_REQUEST:
      return { ...state, loadingBrands: true };
    case GET_BRANDS_SUCCESS:
      return { ...state, loadingBrands: false, brands: action.payload };
    case GET_BRANDS_FAIL:
      return { ...state, loadingBrands: false, error: action.payload };

    // Category & Brand CRUD Requests
    case CREATE_CATEGORY_REQUEST:
    case UPDATE_CATEGORY_REQUEST:
    case DELETE_CATEGORY_REQUEST:
    case RESTORE_CATEGORY_REQUEST:
    case CREATE_BRAND_REQUEST:
    case UPDATE_BRAND_REQUEST:
    case DELETE_BRAND_REQUEST:
    case RESTORE_BRAND_REQUEST:
      return { ...state, actionLoading: true, error: null };

    // Category Success
    case CREATE_CATEGORY_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isCategoryCreated: true,
        categories: [...state.categories, action.payload],
      };
    case UPDATE_CATEGORY_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isCategoryUpdated: true,
        categories: state.categories.map((c) =>
          c._id === action.payload._id ? action.payload : c,
        ),
      };
    case DELETE_CATEGORY_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isCategoryDeleted: true,
        categories: state.categories.filter((c) => c._id !== action.payload),
      };
    case RESTORE_CATEGORY_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isCategoryRestored: true,
        categories: state.categories.map((c) =>
          c._id === action.payload._id ? { ...c, isArchived: false } : c,
        ),
      };

    // Category Reset
    case CREATE_CATEGORY_RESET:
      return { ...state, isCategoryCreated: false };
    case UPDATE_CATEGORY_RESET:
      return { ...state, isCategoryUpdated: false };
    case DELETE_CATEGORY_RESET:
      return { ...state, isCategoryDeleted: false };
    case RESTORE_CATEGORY_RESET:
      return { ...state, isCategoryRestored: false };

    // Brand Success
    case CREATE_BRAND_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isBrandCreated: true,
        brands: [...state.brands, action.payload],
      };
    case UPDATE_BRAND_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isBrandUpdated: true,
        brands: state.brands.map((b) =>
          b._id === action.payload._id ? action.payload : b,
        ),
      };
    case DELETE_BRAND_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isBrandDeleted: true,
        brands: state.brands.filter((b) => b._id !== action.payload),
      };
    case RESTORE_BRAND_SUCCESS:
      return {
        ...state,
        actionLoading: false,
        isBrandRestored: true,
        brands: state.brands.map((b) =>
          b._id === action.payload._id ? { ...b, isArchived: false } : b,
        ),
      };

    // Brand Reset
    case CREATE_BRAND_RESET:
      return { ...state, isBrandCreated: false };
    case UPDATE_BRAND_RESET:
      return { ...state, isBrandUpdated: false };
    case DELETE_BRAND_RESET:
      return { ...state, isBrandDeleted: false };
    case RESTORE_BRAND_RESET:
      return { ...state, isBrandRestored: false };

    // Fails
    case CREATE_CATEGORY_FAIL:
    case UPDATE_CATEGORY_FAIL:
    case DELETE_CATEGORY_FAIL:
    case RESTORE_CATEGORY_FAIL:
    case CREATE_BRAND_FAIL:
    case UPDATE_BRAND_FAIL:
    case DELETE_BRAND_FAIL:
    case RESTORE_BRAND_FAIL:
      return { ...state, actionLoading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

