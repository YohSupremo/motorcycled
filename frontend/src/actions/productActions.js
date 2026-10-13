// Product Redux actions
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx

import axios from "axios";
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
  UPDATE_PRODUCT_REQUEST,
  UPDATE_PRODUCT_SUCCESS,
  UPDATE_PRODUCT_FAIL,
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_SUCCESS,
  DELETE_PRODUCT_FAIL,
  ARCHIVE_PRODUCT_REQUEST,
  ARCHIVE_PRODUCT_SUCCESS,
  ARCHIVE_PRODUCT_FAIL,
  GET_CATEGORIES_REQUEST,
  GET_CATEGORIES_SUCCESS,
  GET_CATEGORIES_FAIL,
  GET_BRANDS_REQUEST,
  GET_BRANDS_SUCCESS,
  GET_BRANDS_FAIL,
  CLEAR_ERRORS,
} from "../constants/productConstants.js";

const API = import.meta.env.VITE_API;

// ─── Admin: fetch all products ────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 92-109
export const getAdminProducts = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_PRODUCTS_REQUEST });
    const { data } = await axios.get(`${API}/admin/products`, {
      withCredentials: true,
    });
    dispatch({ type: ADMIN_PRODUCTS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: ADMIN_PRODUCTS_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Public: fetch storefront products ───────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 27-51
export const getProducts =
  (
    currentPage = 1,
    keyword = "",
    price = [0, 9999999],
    category = "",
    brand = "",
    onlyInstallment = false,
    ratings = 0,
    limit = 12,
  ) =>
  async (dispatch) => {
    try {
      dispatch({ type: ALL_PRODUCTS_REQUEST });
      let link = `${API}/products?page=${currentPage}&limit=${limit}&price[gte]=${price[0]}&price[lte]=${price[1]}`;
      if (keyword && keyword.trim() !== "") {
        link += `&keyword=${encodeURIComponent(keyword.trim())}`;
      }
      if (category && category !== "All") {
        link += `&category=${encodeURIComponent(category)}`;
      }
      if (brand && brand !== "All") {
        link += `&brand=${encodeURIComponent(brand)}`;
      }
      if (onlyInstallment) {
        link += `&onlyInstallment=true`;
      }
      if (ratings && ratings > 0) {
        link += `&ratings=${ratings}`;
      }
      const { data } = await axios.get(link);
      dispatch({ type: ALL_PRODUCTS_SUCCESS, payload: data });
    } catch (error) {
      dispatch({
        type: ALL_PRODUCTS_FAIL,
        payload: error.response?.data?.message || "Failed to load products",
      });
    }
  };

// ─── Public: fetch single product ────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 53-67
export const getProductDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_DETAILS_REQUEST });
    const { data } = await axios.get(`${API}/product/${id}`);
    dispatch({ type: PRODUCT_DETAILS_SUCCESS, payload: data.product });
  } catch (error) {
    dispatch({
      type: PRODUCT_DETAILS_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Admin: create product ────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 69-90
export const newProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: NEW_PRODUCT_REQUEST });
    const config = {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    };
    const { data } = await axios.post(`${API}/admin/product/new`, productData, config);
    dispatch({ type: NEW_PRODUCT_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: NEW_PRODUCT_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Admin: update product ────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 111-132
export const updateProduct = (id, productData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PRODUCT_REQUEST });
    const config = {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    };
    const { data } = await axios.put(`${API}/admin/product/${id}`, productData, config);
    dispatch({ type: UPDATE_PRODUCT_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: UPDATE_PRODUCT_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Admin: delete product ────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 134-152
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_PRODUCT_REQUEST });
    await axios.delete(`${API}/admin/product/${id}`, { withCredentials: true });
    dispatch({ type: DELETE_PRODUCT_SUCCESS });
  } catch (error) {
    dispatch({
      type: DELETE_PRODUCT_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Admin: toggle archive ────────────────────────────────────────────────────
// PDF §4.5: isArchived — archive instead of delete (PDF §1 Design Principles #5)
export const toggleArchiveProduct = (id) => async (dispatch) => {
  try {
    dispatch({ type: ARCHIVE_PRODUCT_REQUEST });
    const { data } = await axios.patch(
      `${API}/admin/product/${id}/archive`,
      {},
      { withCredentials: true },
    );
    dispatch({ type: ARCHIVE_PRODUCT_SUCCESS, payload: data.isArchived });
  } catch (error) {
    dispatch({
      type: ARCHIVE_PRODUCT_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Catalog: fetch categories & brands ──────────────────────────────────────
export const getCategories = () => async (dispatch) => {
  try {
    dispatch({ type: GET_CATEGORIES_REQUEST });
    const { data } = await axios.get(`${API}/categories`);
    dispatch({ type: GET_CATEGORIES_SUCCESS, payload: data.categories });
  } catch (error) {
    dispatch({
      type: GET_CATEGORIES_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

export const getBrands = () => async (dispatch) => {
  try {
    dispatch({ type: GET_BRANDS_REQUEST });
    const { data } = await axios.get(`${API}/brands`);
    dispatch({ type: GET_BRANDS_SUCCESS, payload: data.brands });
  } catch (error) {
    dispatch({
      type: GET_BRANDS_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Clear errors ─────────────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 176-181
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
};
