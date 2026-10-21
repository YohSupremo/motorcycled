import axios from "axios";
import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOAD_USER_REQUEST,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAIL,
  LOGOUT_SUCCESS,
  LOGOUT_FAIL,
  CLEAR_ERRORS,
} from "../constants/userConstants";

const api = import.meta.env.VITE_API;

// The JWT lives in an httpOnly cookie (invisible to JS), so we keep a small
// marker here to avoid probing /me with a pointless 401 when signed out.
const SESSION_MARKER = "isLoggedIn";
const markLoggedIn = () => {
  try {
    localStorage.setItem(SESSION_MARKER, "1");
  } catch {
    /* storage unavailable - ignore */
  }
};
const clearSessionMarker = () => {
  try {
    localStorage.removeItem(SESSION_MARKER);
  } catch {
    /* storage unavailable - ignore */
  }
};

// Safely pull an error message regardless of whether the request ever
// reached the server (error.response can be undefined for network errors).
const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const isDeactivationError = (error) =>
  error?.response?.status === 403 &&
  error?.response?.data?.message
    ?.toLowerCase()
    .includes("account has been deactivated");

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
      skipDeactivationRedirect: true,
    };

    const { data } = await axios.post(
      `${api}/login`,
      { email, password },
      config,
    );

    console.log(data);
    markLoggedIn();

    dispatch({
      type: LOGIN_SUCCESS,
      payload: {
        ...data.user,
        address: data.address,
      },
    });
  } catch (error) {
    clearSessionMarker();
    dispatch({
      type: LOGIN_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

// Restores the session on page refresh using the JWT cookie.
export const loadUser = () => async (dispatch) => {
  try {
    dispatch({ type: LOAD_USER_REQUEST });

    const { data } = await axios.get(`${api}/me`, { withCredentials: true });

    markLoggedIn();

    dispatch({
      type: LOAD_USER_SUCCESS,
      payload: {
        ...data.user,
        address: data.address,
      },
    });
  } catch (error) {
    clearSessionMarker();
    if (isDeactivationError(error)) return;
    dispatch({
      type: LOAD_USER_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

export const logout = () => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    await axios.get(`${api}/logout`, config);

    clearSessionMarker();

    dispatch({
      type: LOGOUT_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: LOGOUT_FAIL,
      payload: getErrorMessage(error),
    });
  }
};

export const clearErrors = () => async (dispatch) => {
  dispatch({
    type: CLEAR_ERRORS,
  });
};

/**
 * Quiz 4 (15 pts): Social authentication via Firebase (Google/Facebook)
 */
export const firebaseLoginAction = (socialUserData) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    const { data } = await axios.post(
      `${api}/firebase-login`,
      socialUserData,
      config,
    );

    if (data.isRegistered === false) {
      clearSessionMarker();
      // Reset loading state so the auth reducer doesn't leave a stale
      // loading:true that could interfere with the redirect to /register.
      dispatch({ type: LOGIN_FAIL, payload: null });
      return {
        success: false,
        notRegistered: true,
        email: socialUserData.email,
        message: data.message,
      };
    }

    markLoggedIn();

    dispatch({
      type: LOGIN_SUCCESS,
      payload: {
        ...data.user,
        address: data.address,
      },
    });

    return { success: true };
  } catch (error) {
    clearSessionMarker();
    const message = getErrorMessage(error);
    dispatch({
      type: LOGIN_FAIL,
      payload: message,
    });
    return { success: false, message };
  }
};
