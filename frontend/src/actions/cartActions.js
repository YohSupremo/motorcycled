import axios from 'axios'
import {
  ADD_TO_CART,
  REMOVE_ITEM_CART,
  UPDATE_ITEM_CART,
  SELECT_CART_ITEM,
  SELECT_ALL_CART_ITEMS,
  SAVE_SHIPPING_INFO,
  CLEAR_CART,
  CLEAR_SELECTED_ITEMS,
  SET_ITEM_PURCHASE_METHOD,
  SET_ITEM_TERM_MONTHS,
} from '../constants/cartConstants'

const api = import.meta.env.VITE_API

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

// Generate a stable cartItemId for a product entry.
// Motorcycles: unique per addition (timestamp-based), parts: productId
const makeCartItemId = (productId, isVehicle) =>
  isVehicle ? `${productId}-${Date.now()}` : productId

// Add a product to the cart (fetches fresh data from backend)
export const addToCart = (productId, quantity = 1) => async (dispatch, getState) => {
  try {
    const { data } = await axios.get(`${api}/product/${productId}`, {
      withCredentials: true,
    })
    const p = data.product
    const categoryName = p?.category?.name || p?.category || ''
    const isVehicle = categoryName === 'Motorcycles'
    const isInstallmentEligible = p.installmentEligible && isVehicle

    const item = {
      cartItemId: makeCartItemId(productId, isVehicle),
      productId: p._id,
      name: p.name,
      price: p.price,
      image: p.images?.[0]?.url || '',
      category: categoryName,
      brand: p?.brand?.name || p?.brand || '',
      inStock: p.stock,
      quantity: Math.min(quantity, p.stock),
      isVehicle,
      installmentEligible: isInstallmentEligible,
      selected: true,
      purchaseMethod: 'cash', // default; user can change for motorcycles
      termMonths: 12,
    }

    dispatch({ type: ADD_TO_CART, payload: item })
  } catch (error) {
    console.error('addToCart error:', getErrorMessage(error))
  }
}

export const removeFromCart = (cartItemId) => (dispatch) => {
  dispatch({ type: REMOVE_ITEM_CART, payload: cartItemId })
}

export const updateCartItemQuantity = (cartItemId, quantity) => (dispatch) => {
  if (!Number.isInteger(quantity) || quantity < 1) return
  dispatch({ type: UPDATE_ITEM_CART, payload: { cartItemId, quantity } })
}

export const selectCartItem = (cartItemId, selected) => (dispatch) => {
  dispatch({ type: SELECT_CART_ITEM, payload: { cartItemId, selected } })
}

export const selectAllCartItems = (selected) => (dispatch) => {
  dispatch({ type: SELECT_ALL_CART_ITEMS, payload: selected })
}

export const setItemPurchaseMethod = (cartItemId, purchaseMethod) => (dispatch) => {
  dispatch({ type: SET_ITEM_PURCHASE_METHOD, payload: { cartItemId, purchaseMethod } })
}

export const setItemTermMonths = (cartItemId, termMonths) => (dispatch) => {
  dispatch({ type: SET_ITEM_TERM_MONTHS, payload: { cartItemId, termMonths } })
}

export const saveShippingInfo = (shippingInfo) => (dispatch) => {
  dispatch({ type: SAVE_SHIPPING_INFO, payload: shippingInfo })
}

export const clearCart = () => (dispatch) => {
  dispatch({ type: CLEAR_CART })
}

// Remove only the cart items that were successfully processed
export const clearSuccessfulItems = (cartItemIds) => (dispatch) => {
  dispatch({ type: CLEAR_SELECTED_ITEMS, payload: cartItemIds })
}
