import {
  GET_PROFILE_REQUEST,
  GET_PROFILE_SUCCESS,
  GET_PROFILE_FAIL,
  UPDATE_PROFILE_REQUEST,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_FAIL,
  GET_ADDRESSES_REQUEST,
  GET_ADDRESSES_SUCCESS,
  GET_ADDRESSES_FAIL,
  ADD_ADDRESS_REQUEST,
  ADD_ADDRESS_SUCCESS,
  ADD_ADDRESS_FAIL,
  UPDATE_ADDRESS_REQUEST,
  UPDATE_ADDRESS_SUCCESS,
  UPDATE_ADDRESS_FAIL,
  DELETE_ADDRESS_REQUEST,
  DELETE_ADDRESS_SUCCESS,
  DELETE_ADDRESS_FAIL,
  SET_DEFAULT_ADDRESS_REQUEST,
  SET_DEFAULT_ADDRESS_SUCCESS,
  SET_DEFAULT_ADDRESS_FAIL,
} from "../constants/profileConstants";

const initialProfileState = {
  loading: false,
  updating: false,
  addressesLoading: false,
  addressesUpdating: false,
  profile: null,
  addresses: [],
  error: null,
};

export const profileReducer = (state = initialProfileState, action) => {
  switch (action.type) {
    case GET_PROFILE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_PROFILE_SUCCESS:
      return {
        ...state,
        loading: false,
        profile: action.payload,
        error: null,
      };

    case GET_PROFILE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        updating: true,
        error: null,
      };

    case UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        updating: false,
        profile: action.payload,
        error: null,
      };

    case UPDATE_PROFILE_FAIL:
      return {
        ...state,
        updating: false,
        error: action.payload,
      };

    case GET_ADDRESSES_REQUEST:
      return {
        ...state,
        addressesLoading: true,
        error: null,
      };

    case GET_ADDRESSES_SUCCESS:
      return {
        ...state,
        addressesLoading: false,
        addresses: action.payload,
        error: null,
      };

    case GET_ADDRESSES_FAIL:
      return {
        ...state,
        addressesLoading: false,
        error: action.payload,
      };

    case ADD_ADDRESS_REQUEST:
    case UPDATE_ADDRESS_REQUEST:
    case DELETE_ADDRESS_REQUEST:
    case SET_DEFAULT_ADDRESS_REQUEST:
      return {
        ...state,
        addressesUpdating: true,
        error: null,
      };

    case ADD_ADDRESS_SUCCESS:
      return {
        ...state,
        addressesUpdating: false,
        addresses: [...state.addresses, action.payload],
        error: null,
      };

    case UPDATE_ADDRESS_SUCCESS:
      return {
        ...state,
        addressesUpdating: false,
        addresses: state.addresses.map((address) =>
          address._id === action.payload._id ? action.payload : address,
        ),
        error: null,
      };

    case SET_DEFAULT_ADDRESS_SUCCESS:
      return {
        ...state,
        addressesUpdating: false,
        addresses: state.addresses.map((address) => ({
          ...address,
          isDefault: address._id === action.payload._id,
        })),
        error: null,
      };

    case DELETE_ADDRESS_SUCCESS:
      return {
        ...state,
        addressesUpdating: false,
        addresses: state.addresses.filter(
          (address) => address._id !== action.payload,
        ),
        error: null,
      };

    case ADD_ADDRESS_FAIL:
    case UPDATE_ADDRESS_FAIL:
    case DELETE_ADDRESS_FAIL:
    case SET_DEFAULT_ADDRESS_FAIL:
      return {
        ...state,
        addressesUpdating: false,
        error: action.payload,
      };

    default:
      return state;
  }
};
