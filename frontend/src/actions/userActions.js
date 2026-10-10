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

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    const { data } = await axios.post(`${api}/login`, { email, password }, config);

    markLoggedIn();

    dispatch({
      type: LOGIN_SUCCESS,
      payload: data.user,
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
      payload: data.user,
    });
  } catch (error) {
    clearSessionMarker();
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