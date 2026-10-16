// Review Redux reducers

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
  NEW_REVIEW_RESET,
  DELETE_MY_REVIEW_REQUEST,
  DELETE_MY_REVIEW_SUCCESS,
  DELETE_MY_REVIEW_FAIL,
  DELETE_MY_REVIEW_RESET,
  ADMIN_REVIEWS_REQUEST,
  ADMIN_REVIEWS_SUCCESS,
  ADMIN_REVIEWS_FAIL,
  MODERATE_REVIEW_REQUEST,
  MODERATE_REVIEW_SUCCESS,
  MODERATE_REVIEW_FAIL,
  CLEAR_ERRORS,
} from "../constants/reviewConstants.js";

// ─── Public: reviews for a single product ─────────────────────────────────────
export const productReviewsReducer = (
  state = { loading: false, reviews: [], count: 0, error: null },
  action,
) => {
  switch (action.type) {
    case PRODUCT_REVIEWS_REQUEST:
      return { ...state, loading: true };

    case PRODUCT_REVIEWS_SUCCESS:
      return {
        loading: false,
        reviews: action.payload.reviews,
        count: action.payload.count,
        error: null,
      };

    case PRODUCT_REVIEWS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Customer: own review + eligibility ───────────────────────────────────────
export const myReviewReducer = (
  state = {
    loading: false,
    review: null,
    ordered: false,
    received: false,
    error: null,
  },
  action,
) => {
  switch (action.type) {
    case MY_REVIEW_REQUEST:
      return { ...state, loading: true };

    case MY_REVIEW_SUCCESS:
      return {
        loading: false,
        review: action.payload.review,
        ordered: action.payload.ordered,
        received: action.payload.received,
        error: null,
      };

    case MY_REVIEW_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Customer: submit / update own review ─────────────────────────────────────
export const newReviewReducer = (
  state = { loading: false, success: false, review: null, error: null },
  action,
) => {
  switch (action.type) {
    case NEW_REVIEW_REQUEST:
      return { ...state, loading: true };

    case NEW_REVIEW_SUCCESS:
      return {
        loading: false,
        success: true,
        review: action.payload.review,
        error: null,
      };

    case NEW_REVIEW_FAIL:
      return { ...state, loading: false, error: action.payload };

    case NEW_REVIEW_RESET:
      return { ...state, success: false, review: null };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Customer: delete own review ──────────────────────────────────────────────
export const deleteMyReviewReducer = (
  state = { loading: false, success: false, error: null },
  action,
) => {
  switch (action.type) {
    case DELETE_MY_REVIEW_REQUEST:
      return { ...state, loading: true, success: false };

    case DELETE_MY_REVIEW_SUCCESS:
      return { loading: false, success: true, error: null };

    case DELETE_MY_REVIEW_FAIL:
      return { ...state, loading: false, error: action.payload };

    case DELETE_MY_REVIEW_RESET:
      return { ...state, success: false };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Admin: all reviews ───────────────────────────────────────────────────────
export const adminReviewsReducer = (
  state = { loading: false, reviews: [], count: 0, error: null },
  action,
) => {
  switch (action.type) {
    case ADMIN_REVIEWS_REQUEST:
      return { ...state, loading: true };

    case ADMIN_REVIEWS_SUCCESS:
      return {
        loading: false,
        reviews: action.payload.reviews,
        count: action.payload.count,
        error: null,
      };

    case ADMIN_REVIEWS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Admin: moderation (hide / delete) ────────────────────────────────────────
export const reviewModerationReducer = (
  state = { loading: false, message: null, error: null },
  action,
) => {
  switch (action.type) {
    case MODERATE_REVIEW_REQUEST:
      return { ...state, loading: true, message: null };

    case MODERATE_REVIEW_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload.message || "Review updated",
      };

    case MODERATE_REVIEW_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CLEAR_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
};
