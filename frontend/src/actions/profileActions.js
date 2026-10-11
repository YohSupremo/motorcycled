import axios from "axios";
import {
  ADD_ADDRESS_FAIL,
  ADD_ADDRESS_REQUEST,
  ADD_ADDRESS_SUCCESS,
  DELETE_ADDRESS_FAIL,
  DELETE_ADDRESS_REQUEST,
  DELETE_ADDRESS_SUCCESS,
  GET_ADDRESSES_FAIL,
  GET_ADDRESSES_REQUEST,
  GET_ADDRESSES_SUCCESS,
  GET_PROFILE_FAIL,
  GET_PROFILE_REQUEST,
  GET_PROFILE_SUCCESS,
  SET_DEFAULT_ADDRESS_FAIL,
  SET_DEFAULT_ADDRESS_REQUEST,
  SET_DEFAULT_ADDRESS_SUCCESS,
  UPDATE_ADDRESS_FAIL,
  UPDATE_ADDRESS_REQUEST,
  UPDATE_ADDRESS_SUCCESS,
  UPDATE_PROFILE_FAIL,
  UPDATE_PROFILE_REQUEST,
  UPDATE_PROFILE_SUCCESS,
} from "../constants/profileConstants";

const api = import.meta.env.VITE_API;
const config = { withCredentials: true };
const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const getProfile = () => async (dispatch) => {
  try {
    dispatch({ type: GET_PROFILE_REQUEST });
    const { data } = await axios.get(`${api}/profile`, config);
    dispatch({ type: GET_PROFILE_SUCCESS, payload: data.profile });
  } catch (error) {
    dispatch({ type: GET_PROFILE_FAIL, payload: getErrorMessage(error) });
  }
};

export const updateProfile = (profileData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PROFILE_REQUEST });
    const requestData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        requestData.append(key, value);
      }
    });
    const { data } = await axios.put(`${api}/profile`, requestData, config);
    dispatch({ type: UPDATE_PROFILE_SUCCESS, payload: data.profile });
    return true;
  } catch (error) {
    dispatch({ type: UPDATE_PROFILE_FAIL, payload: getErrorMessage(error) });
    return false;
  }
};

export const getAddresses = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ADDRESSES_REQUEST });
    const { data } = await axios.get(`${api}/profile/addresses`, config);
    dispatch({ type: GET_ADDRESSES_SUCCESS, payload: data.addresses });
  } catch (error) {
    dispatch({ type: GET_ADDRESSES_FAIL, payload: getErrorMessage(error) });
  }
};

export const addAddress = (address) => async (dispatch) => {
  try {
    dispatch({ type: ADD_ADDRESS_REQUEST });
    const { data } = await axios.post(`${api}/profile/addresses`, address, config);
    dispatch({ type: ADD_ADDRESS_SUCCESS, payload: data.address });
    return true;
  } catch (error) {
    dispatch({ type: ADD_ADDRESS_FAIL, payload: getErrorMessage(error) });
    return false;
  }
};

export const updateAddress = (id, address) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ADDRESS_REQUEST });
    const { data } = await axios.put(`${api}/profile/addresses/${id}`, address, config);
    dispatch({ type: UPDATE_ADDRESS_SUCCESS, payload: data.address });
    return true;
  } catch (error) {
    dispatch({ type: UPDATE_ADDRESS_FAIL, payload: getErrorMessage(error) });
    return false;
  }
};

export const deleteAddress = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_ADDRESS_REQUEST });
    await axios.delete(`${api}/profile/addresses/${id}`, config);
    dispatch({ type: DELETE_ADDRESS_SUCCESS, payload: id });
    return true;
  } catch (error) {
    dispatch({ type: DELETE_ADDRESS_FAIL, payload: getErrorMessage(error) });
    return false;
  }
};

export const setDefaultAddress = (id) => async (dispatch) => {
  try {
    dispatch({ type: SET_DEFAULT_ADDRESS_REQUEST });
    const { data } = await axios.patch(
      `${api}/profile/addresses/${id}/default`,
      {},
      config,
    );
    dispatch({ type: SET_DEFAULT_ADDRESS_SUCCESS, payload: data.address });
    return true;
  } catch (error) {
    dispatch({
      type: SET_DEFAULT_ADDRESS_FAIL,
      payload: getErrorMessage(error),
    });
    return false;
  }
};
