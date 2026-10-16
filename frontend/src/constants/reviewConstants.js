// Review Redux action type constants

// Public: reviews for a single product
export const PRODUCT_REVIEWS_REQUEST = "PRODUCT_REVIEWS_REQUEST";
export const PRODUCT_REVIEWS_SUCCESS = "PRODUCT_REVIEWS_SUCCESS";
export const PRODUCT_REVIEWS_FAIL = "PRODUCT_REVIEWS_FAIL";

// Customer: own review + eligibility for a product
export const MY_REVIEW_REQUEST = "MY_REVIEW_REQUEST";
export const MY_REVIEW_SUCCESS = "MY_REVIEW_SUCCESS";
export const MY_REVIEW_FAIL = "MY_REVIEW_FAIL";

// Customer: submit or update own review
export const NEW_REVIEW_REQUEST = "NEW_REVIEW_REQUEST";
export const NEW_REVIEW_SUCCESS = "NEW_REVIEW_SUCCESS";
export const NEW_REVIEW_FAIL = "NEW_REVIEW_FAIL";
export const NEW_REVIEW_RESET = "NEW_REVIEW_RESET";

// Customer: delete own review
export const DELETE_MY_REVIEW_REQUEST = "DELETE_MY_REVIEW_REQUEST";
export const DELETE_MY_REVIEW_SUCCESS = "DELETE_MY_REVIEW_SUCCESS";
export const DELETE_MY_REVIEW_FAIL = "DELETE_MY_REVIEW_FAIL";
export const DELETE_MY_REVIEW_RESET = "DELETE_MY_REVIEW_RESET";

// Admin: all reviews
export const ADMIN_REVIEWS_REQUEST = "ADMIN_REVIEWS_REQUEST";
export const ADMIN_REVIEWS_SUCCESS = "ADMIN_REVIEWS_SUCCESS";
export const ADMIN_REVIEWS_FAIL = "ADMIN_REVIEWS_FAIL";

// Admin: moderation (hide / unhide / delete)
export const MODERATE_REVIEW_REQUEST = "MODERATE_REVIEW_REQUEST";
export const MODERATE_REVIEW_SUCCESS = "MODERATE_REVIEW_SUCCESS";
export const MODERATE_REVIEW_FAIL = "MODERATE_REVIEW_FAIL";

export const CLEAR_ERRORS = "CLEAR_ERRORS";
