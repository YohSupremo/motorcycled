// Review Redux actions

import axios from "axios";
import {
  PRODUCT_REVIEWS_REQUEST,
  PRODUCT_REVIEWS_SUCCESS,
  PRODUCT_REVIEWS_FAIL,
  MY_REVIEW_REQUEST,
  MY_REVIEW_SUCCESS,
  MY_REVIEW_FAIL,
  NEW_REVIEW_REQUEST,
  NEW_REVIEW_SUCCESS,
  NEW_REVIEW_FAIL,
  DELETE_MY_REVIEW_REQUEST,
  DELETE_MY_REVIEW_SUCCESS,
  DELETE_MY_REVIEW_FAIL,
  ADMIN_REVIEWS_REQUEST,
  ADMIN_REVIEWS_SUCCESS,
  ADMIN_REVIEWS_FAIL,
  MODERATE_REVIEW_REQUEST,
  MODERATE_REVIEW_SUCCESS,
  MODERATE_REVIEW_FAIL,
  CLEAR_ERRORS,
} from "../constants/reviewConstants.js";

const API = import.meta.env.VITE_API;

// ─── Public: reviews for a product ────────────────────────────────────────────
export const getProductReviews = (productId) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_REVIEWS_REQUEST });
    const { data } = await axios.get(`${API}/product/${productId}/reviews`);
    dispatch({ type: PRODUCT_REVIEWS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_REVIEWS_FAIL,
      payload: error.response?.data?.message || "Failed to load reviews",
    });
  }
};

// ─── Customer: own review + eligibility ───────────────────────────────────────
export const getMyReview = (productId) => async (dispatch) => {
  try {
    dispatch({ type: MY_REVIEW_REQUEST });
    const { data } = await axios.get(
      `${API}/product/${productId}/my-review`,
      { withCredentials: true },
    );
    dispatch({ type: MY_REVIEW_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MY_REVIEW_FAIL,
      payload: error.response?.data?.message || "Failed to load your review",
    });
  }
};

// ─── Customer: submit own review ──────────────────────────────────────────────
export const newReview = (productId, reviewData) => async (dispatch) => {
  try {
    dispatch({ type: NEW_REVIEW_REQUEST });
    const config = {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    };
    const { data } = await axios.post(
      `${API}/product/${productId}/review`,
      reviewData,
      config,
    );
    return dispatch({ type: NEW_REVIEW_SUCCESS, payload: data });
  } catch (error) {
    return dispatch({
      type: NEW_REVIEW_FAIL,
      payload: error.response?.data?.message || "Failed to submit review",
    });
  }
};

// ─── Customer: update own review ──────────────────────────────────────────────
export const updateReview = (productId, reviewData) => async (dispatch) => {
  try {
    dispatch({ type: NEW_REVIEW_REQUEST });
    const config = {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    };
    const { data } = await axios.put(
      `${API}/product/${productId}/review`,
      reviewData,
      config,
    );
    return dispatch({ type: NEW_REVIEW_SUCCESS, payload: data });
  } catch (error) {
    return dispatch({
      type: NEW_REVIEW_FAIL,
      payload: error.response?.data?.message || "Failed to update review",
    });
  }
};

// ─── Customer: delete own review ──────────────────────────────────────────────
export const deleteMyReview = (productId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_MY_REVIEW_REQUEST });
    const { data } = await axios.delete(`${API}/product/${productId}/review`, {
      withCredentials: true,
    });
    return dispatch({ type: DELETE_MY_REVIEW_SUCCESS, payload: data });
  } catch (error) {
    return dispatch({
      type: DELETE_MY_REVIEW_FAIL,
      payload: error.response?.data?.message || "Failed to delete review",
    });
  }
};

// ─── Admin: all reviews ───────────────────────────────────────────────────────
export const getAdminReviews = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_REVIEWS_REQUEST });
    const { data } = await axios.get(`${API}/admin/reviews`, {
      withCredentials: true,
    });
    dispatch({ type: ADMIN_REVIEWS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: ADMIN_REVIEWS_FAIL,
      payload: error.response?.data?.message || "Failed to load reviews",
    });
  }
};

// ─── Admin: toggle review visibility ──────────────────────────────────────────
export const toggleReviewVisibility = (id) => async (dispatch) => {
  try {
    dispatch({ type: MODERATE_REVIEW_REQUEST });
    const { data } = await axios.put(
      `${API}/admin/review/${id}/hide`,
      {},
      { withCredentials: true },
    );
    return dispatch({ type: MODERATE_REVIEW_SUCCESS, payload: data });
  } catch (error) {
    return dispatch({
      type: MODERATE_REVIEW_FAIL,
      payload: error.response?.data?.message || "Failed to update review",
    });
  }
};

// ─── Admin: delete review ─────────────────────────────────────────────────────
export const deleteReview = (id) => async (dispatch) => {
  try {
    dispatch({ type: MODERATE_REVIEW_REQUEST });
    const { data } = await axios.delete(`${API}/admin/review/${id}`, {
      withCredentials: true,
    });
    return dispatch({ type: MODERATE_REVIEW_SUCCESS, payload: data });
  } catch (error) {
    return dispatch({
      type: MODERATE_REVIEW_FAIL,
      payload: error.response?.data?.message || "Failed to delete review",
    });
  }
};

export const clearErrors = () => async (dispatch) => {
  dispatch({ type: CLEAR_ERRORS });
};
