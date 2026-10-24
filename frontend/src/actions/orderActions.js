import axios from 'axios'
import {
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAIL,
  CREATE_ORDER_RESET,
  MY_ORDERS_REQUEST,
  MY_ORDERS_SUCCESS,
  MY_ORDERS_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  APPLICATION_DETAILS_REQUEST,
  APPLICATION_DETAILS_SUCCESS,
  APPLICATION_DETAILS_FAIL,
  ADMIN_ORDERS_REQUEST,
  ADMIN_ORDERS_SUCCESS,
  ADMIN_ORDERS_FAIL,
  ADMIN_APPLICATIONS_REQUEST,
  ADMIN_APPLICATIONS_SUCCESS,
  ADMIN_APPLICATIONS_FAIL,
  UPDATE_ORDER_STATUS_REQUEST,
  UPDATE_ORDER_STATUS_SUCCESS,
  UPDATE_ORDER_STATUS_FAIL,
  UPDATE_ORDER_STATUS_RESET,
  APPROVE_APPLICATION_REQUEST,
  APPROVE_APPLICATION_SUCCESS,
  APPROVE_APPLICATION_FAIL,
  APPROVE_APPLICATION_RESET,
  REJECT_APPLICATION_REQUEST,
  REJECT_APPLICATION_SUCCESS,
  REJECT_APPLICATION_FAIL,
  REJECT_APPLICATION_RESET,
  CONFIRM_INSTALLMENT_ORDER_REQUEST,
  CONFIRM_INSTALLMENT_ORDER_SUCCESS,
  CONFIRM_INSTALLMENT_ORDER_FAIL,
  CONFIRM_INSTALLMENT_ORDER_RESET,
  CLEAR_ERRORS,
} from '../constants/orderConstants'

const api = import.meta.env.VITE_API

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

// Submit checkout — creates orders and/or installment applications
// checkoutPayload: { checkoutSessionId, items, shippingInfo, paymentMethod }
export const submitCheckout = (checkoutPayload) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST })
    const { data } = await axios.post(`${api}/checkout`, checkoutPayload, {
      withCredentials: true,
    })
    dispatch({ type: CREATE_ORDER_SUCCESS, payload: data.data || data })
  } catch (error) {
    dispatch({
      type: CREATE_ORDER_FAIL,
      payload: getErrorMessage(error),
    })
  }
}

export const resetCheckout = () => (dispatch) => {
  dispatch({ type: CREATE_ORDER_RESET })
}

// Get current user's orders and applications
export const getMyOrders = () => async (dispatch) => {
  try {
    dispatch({ type: MY_ORDERS_REQUEST })
    const { data } = await axios.get(`${api}/orders/me`, {
      withCredentials: true,
    })
    dispatch({
      type: MY_ORDERS_SUCCESS,
      payload: {
        orders: data.orders || data.data?.orders || [],
        applications: data.applications || data.data?.applications || [],
      },
    })
  } catch (error) {
    dispatch({ type: MY_ORDERS_FAIL, payload: getErrorMessage(error) })
  }
}

// Get single order details
export const getOrderDetails = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_DETAILS_REQUEST })
    const { data } = await axios.get(`${api}/order/${orderId}`, {
      withCredentials: true,
    })
    dispatch({
      type: ORDER_DETAILS_SUCCESS,
      payload: data.order || data.data?.order,
    })
  } catch (error) {
    dispatch({ type: ORDER_DETAILS_FAIL, payload: getErrorMessage(error) })
  }
}

// Get single installment application details
export const getApplicationDetails = (applicationId) => async (dispatch) => {
  try {
    dispatch({ type: APPLICATION_DETAILS_REQUEST })
    const { data } = await axios.get(`${api}/application/${applicationId}`, {
      withCredentials: true,
    })
    dispatch({
      type: APPLICATION_DETAILS_SUCCESS,
      payload: data.application || data.data?.application,
    })
  } catch (error) {
    dispatch({ type: APPLICATION_DETAILS_FAIL, payload: getErrorMessage(error) })
  }
}

// ── Admin actions ─────────────────────────────────────────────────────────────

export const getAdminOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_ORDERS_REQUEST })
    const { data } = await axios.get(`${api}/admin/orders`, {
      withCredentials: true,
    })
    dispatch({
      type: ADMIN_ORDERS_SUCCESS,
      payload: data.orders || data.data?.orders || [],
    })
  } catch (error) {
    dispatch({ type: ADMIN_ORDERS_FAIL, payload: getErrorMessage(error) })
  }
}

export const getAdminApplications = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_APPLICATIONS_REQUEST })
    const { data } = await axios.get(`${api}/admin/applications`, {
      withCredentials: true,
    })
    dispatch({
      type: ADMIN_APPLICATIONS_SUCCESS,
      payload: data.applications || data.data?.applications || [],
    })
  } catch (error) {
    dispatch({ type: ADMIN_APPLICATIONS_FAIL, payload: getErrorMessage(error) })
  }
}

export const updateOrderStatus = (orderId, statusData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ORDER_STATUS_REQUEST })
    const { data } = await axios.put(
      `${api}/admin/order/${orderId}/status`,
      statusData,
      { withCredentials: true }
    )
    dispatch({ type: UPDATE_ORDER_STATUS_SUCCESS, payload: data.order })
  } catch (error) {
    dispatch({ type: UPDATE_ORDER_STATUS_FAIL, payload: getErrorMessage(error) })
  }
}

export const resetUpdateOrderStatus = () => (dispatch) => {
  dispatch({ type: UPDATE_ORDER_STATUS_RESET })
}

export const approveApplication = (applicationId, confirmedTerms) => async (dispatch) => {
  try {
    dispatch({ type: APPROVE_APPLICATION_REQUEST })
    const { data } = await axios.put(
      `${api}/admin/application/${applicationId}/approve`,
      { confirmedTerms },
      { withCredentials: true }
    )
    dispatch({ type: APPROVE_APPLICATION_SUCCESS, payload: data.application })
  } catch (error) {
    dispatch({ type: APPROVE_APPLICATION_FAIL, payload: getErrorMessage(error) })
  }
}

export const resetApproveApplication = () => (dispatch) => {
  dispatch({ type: APPROVE_APPLICATION_RESET })
}

export const rejectApplication = (applicationId, rejectionReason) => async (dispatch) => {
  try {
    dispatch({ type: REJECT_APPLICATION_REQUEST })
    const { data } = await axios.put(
      `${api}/admin/application/${applicationId}/reject`,
      { rejectionReason },
      { withCredentials: true }
    )
    dispatch({ type: REJECT_APPLICATION_SUCCESS, payload: data.application })
  } catch (error) {
    dispatch({ type: REJECT_APPLICATION_FAIL, payload: getErrorMessage(error) })
  }
}

export const resetRejectApplication = () => (dispatch) => {
  dispatch({ type: REJECT_APPLICATION_RESET })
}

export const confirmInstallmentOrder = (applicationId) => async (dispatch) => {
  try {
    dispatch({ type: CONFIRM_INSTALLMENT_ORDER_REQUEST })
    const { data } = await axios.put(
      `${api}/admin/application/${applicationId}/confirm-order`,
      {},
      { withCredentials: true }
    )
    dispatch({
      type: CONFIRM_INSTALLMENT_ORDER_SUCCESS,
      payload: { application: data.application, order: data.order },
    })
  } catch (error) {
    dispatch({ type: CONFIRM_INSTALLMENT_ORDER_FAIL, payload: getErrorMessage(error) })
  }
}

export const resetConfirmInstallmentOrder = () => (dispatch) => {
  dispatch({ type: CONFIRM_INSTALLMENT_ORDER_RESET })
}

export const clearOrderErrors = () => (dispatch) => {
  dispatch({ type: CLEAR_ERRORS })
}

export const payInstallmentAmortization = (applicationId, paymentData) => async (dispatch) => {
  try {
    const { data } = await axios.post(
      `${api}/application/${applicationId}/pay-installment`,
      paymentData,
      { withCredentials: true }
    );
    dispatch(getMyOrders());
    return { success: true, data };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
};

export const cancelOrder = (orderId) => async (dispatch) => {
  try {
    const { data } = await axios.put(
      `${api}/order/${orderId}/cancel`,
      {},
      { withCredentials: true }
    );
    dispatch(getMyOrders());
    return { success: true, data };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
};
