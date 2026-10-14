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
  CREATE_CATEGORY_REQUEST,
  CREATE_CATEGORY_SUCCESS,
  CREATE_CATEGORY_FAIL,
  UPDATE_CATEGORY_REQUEST,
  UPDATE_CATEGORY_SUCCESS,
  UPDATE_CATEGORY_FAIL,
  DELETE_CATEGORY_REQUEST,
  DELETE_CATEGORY_SUCCESS,
  DELETE_CATEGORY_FAIL,
  RESTORE_CATEGORY_REQUEST,
  RESTORE_CATEGORY_SUCCESS,
  RESTORE_CATEGORY_FAIL,
  CREATE_BRAND_REQUEST,
  CREATE_BRAND_SUCCESS,
  CREATE_BRAND_FAIL,
  UPDATE_BRAND_REQUEST,
  UPDATE_BRAND_SUCCESS,
  UPDATE_BRAND_FAIL,
  DELETE_BRAND_REQUEST,
  DELETE_BRAND_SUCCESS,
  DELETE_BRAND_FAIL,
  RESTORE_BRAND_REQUEST,
  RESTORE_BRAND_SUCCESS,
  RESTORE_BRAND_FAIL,
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
    const { data } = await axios.delete(`${API}/admin/product/${id}`, { withCredentials: true });
    dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: DELETE_PRODUCT_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Admin: bulk soft-delete products ─────────────────────────────────────────
export const bulkDeleteProducts = (productIds) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_PRODUCT_REQUEST });
    const { data } = await axios.post(
      `${API}/admin/products/bulk-delete`,
      { productIds },
      { withCredentials: true }
    );
    dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: data });
    return { success: true, count: data.count, message: data.message };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to bulk delete products";
    dispatch({
      type: DELETE_PRODUCT_FAIL,
      payload: message,
    });
    return { success: false, message };
  }
};

// ─── Admin: bulk restore products ─────────────────────────────────────────────
export const bulkRestoreProducts = (productIds) => async (dispatch) => {
  try {
    dispatch({ type: ARCHIVE_PRODUCT_REQUEST });
    const { data } = await axios.post(
      `${API}/admin/products/bulk-restore`,
      { productIds },
      { withCredentials: true }
    );
    dispatch({
      type: ARCHIVE_PRODUCT_SUCCESS,
      payload: { isArchived: false, message: data.message },
    });
    return { success: true, count: data.count, message: data.message };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to bulk restore products";
    dispatch({
      type: ARCHIVE_PRODUCT_FAIL,
      payload: message,
    });
    return { success: false, message };
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
export const getCategories = (params = {}) => async (dispatch) => {
  try {
    dispatch({ type: GET_CATEGORIES_REQUEST });
    const { data } = await axios.get(`${API}/categories`, { params });
    dispatch({ type: GET_CATEGORIES_SUCCESS, payload: data.categories });
  } catch (error) {
    dispatch({
      type: GET_CATEGORIES_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

export const getBrands = (params = {}) => async (dispatch) => {
  try {
    dispatch({ type: GET_BRANDS_REQUEST });
    const { data } = await axios.get(`${API}/brands`, { params });
    dispatch({ type: GET_BRANDS_SUCCESS, payload: data.brands });
  } catch (error) {
    dispatch({
      type: GET_BRANDS_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// ─── Category CRUD actions ───────────────────────────────────────────────────
export const createCategory = (categoryData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_CATEGORY_REQUEST });
    const { data } = await axios.post(`${API}/admin/category/new`, categoryData, {
      withCredentials: true,
    });
    dispatch({ type: CREATE_CATEGORY_SUCCESS, payload: data.category });
  } catch (error) {
    dispatch({
      type: CREATE_CATEGORY_FAIL,
      payload: error.response?.data?.message || "Failed to create category",
    });
  }
};

export const updateCategory = (id, categoryData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_CATEGORY_REQUEST });
    const { data } = await axios.put(`${API}/admin/category/${id}`, categoryData, {
      withCredentials: true,
    });
    dispatch({ type: UPDATE_CATEGORY_SUCCESS, payload: data.category });
  } catch (error) {
    dispatch({
      type: UPDATE_CATEGORY_FAIL,
      payload: error.response?.data?.message || "Failed to update category",
    });
  }
};

export const deleteCategory = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_CATEGORY_REQUEST });
    const { data } = await axios.delete(`${API}/admin/category/${id}`, {
      withCredentials: true,
    });
    dispatch({ type: DELETE_CATEGORY_SUCCESS, payload: id });
    return { success: true, data };
  } catch (error) {
    const isConflict = error.response?.status === 409;
    const message = error.response?.data?.message || "Failed to delete category";
    dispatch({
      type: DELETE_CATEGORY_FAIL,
      payload: message,
    });
    if (isConflict) {
      return {
        conflict: true,
        productCount: error.response.data.productCount,
        products: error.response.data.products || [],
        message,
      };
    }
    return { success: false, message };
  }
};

export const reassignCategoryAndDelete = (id, targetCategoryId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_CATEGORY_REQUEST });
    const { data } = await axios.post(
      `${API}/admin/category/${id}/reassign`,
      { targetCategoryId },
      { withCredentials: true },
    );
    dispatch({ type: DELETE_CATEGORY_SUCCESS, payload: id });
    return { success: true, data };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to reassign and delete category";
    dispatch({
      type: DELETE_CATEGORY_FAIL,
      payload: message,
    });
    return { success: false, message };
  }
};

export const restoreCategory = (id) => async (dispatch) => {
  try {
    dispatch({ type: RESTORE_CATEGORY_REQUEST });
    const { data } = await axios.put(
      `${API}/admin/category/${id}/restore`,
      {},
      { withCredentials: true },
    );
    dispatch({ type: RESTORE_CATEGORY_SUCCESS, payload: data.category });
    return { success: true, message: data.message, category: data.category };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to restore category";
    dispatch({
      type: RESTORE_CATEGORY_FAIL,
      payload: message,
    });
    return { success: false, message };
  }
};

// ─── Brand CRUD actions ──────────────────────────────────────────────────────
export const createBrand = (brandData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_BRAND_REQUEST });
    const { data } = await axios.post(`${API}/admin/brand/new`, brandData, {
      withCredentials: true,
    });
    dispatch({ type: CREATE_BRAND_SUCCESS, payload: data.brand });
  } catch (error) {
    dispatch({
      type: CREATE_BRAND_FAIL,
      payload: error.response?.data?.message || "Failed to create brand",
    });
  }
};

export const updateBrand = (id, brandData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_BRAND_REQUEST });
    const { data } = await axios.put(`${API}/admin/brand/${id}`, brandData, {
      withCredentials: true,
    });
    dispatch({ type: UPDATE_BRAND_SUCCESS, payload: data.brand });
  } catch (error) {
    dispatch({
      type: UPDATE_BRAND_FAIL,
      payload: error.response?.data?.message || "Failed to update brand",
    });
  }
};

export const deleteBrand = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_BRAND_REQUEST });
    const { data } = await axios.delete(`${API}/admin/brand/${id}`, {
      withCredentials: true,
    });
    dispatch({ type: DELETE_BRAND_SUCCESS, payload: id });
    return { success: true, data };
  } catch (error) {
    const isConflict = error.response?.status === 409;
    const message = error.response?.data?.message || "Failed to delete brand";
    dispatch({
      type: DELETE_BRAND_FAIL,
      payload: message,
    });
    if (isConflict) {
      return {
        conflict: true,
        productCount: error.response.data.productCount,
        products: error.response.data.products || [],
        message,
      };
    }
    return { success: false, message };
  }
};

export const reassignBrandAndDelete = (id, targetBrandId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_BRAND_REQUEST });
    const { data } = await axios.post(
      `${API}/admin/brand/${id}/reassign`,
      { targetBrandId },
      { withCredentials: true },
    );
    dispatch({ type: DELETE_BRAND_SUCCESS, payload: id });
    return { success: true, data };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to reassign and delete brand";
    dispatch({
      type: DELETE_BRAND_FAIL,
      payload: message,
    });
    return { success: false, message };
  }
};

export const restoreBrand = (id) => async (dispatch) => {
  try {
    dispatch({ type: RESTORE_BRAND_REQUEST });
    const { data } = await axios.put(
      `${API}/admin/brand/${id}/restore`,
      {},
      { withCredentials: true },
    );
    dispatch({ type: RESTORE_BRAND_SUCCESS, payload: data.brand });
    return { success: true, message: data.message, brand: data.brand };
  } catch (error) {
    const message = error.response?.data?.message || "Failed to restore brand";
    dispatch({
      type: RESTORE_BRAND_FAIL,
      payload: message,
    });
    return { success: false, message };
  }
};

// ─── Clear errors ─────────────────────────────────────────────────────────────
// Reference: itcp318-s3a-2026/frontend/src/actions/productActions.jsx lines 176-181
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
};

