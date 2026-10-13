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

// Add a product to the cart (fetches fresh data from backend & enforces stock limit)
export const addToCart = (productId, quantity = 1) => async (dispatch, getState) => {
  try {
    const { data } = await axios.get(`${api}/product/${productId}`, {
      withCredentials: true,
    })
    const p = data.product
    if (!p) return { success: false, message: 'Product not found' }

    if (p.stock <= 0) {
      return {
        success: false,
        message: `"${p.name}" is currently Out of Stock.`,
        stock: 0,
      }
    }

    const { cart } = getState()
    const currentInCart = (cart.cartItems || [])
      .filter((i) => i.productId === productId)
      .reduce((sum, i) => sum + (i.quantity || 1), 0)

    if (currentInCart + quantity > p.stock) {
      const remaining = Math.max(0, p.stock - currentInCart)
      return {
        success: false,
        message:
          currentInCart >= p.stock
            ? `Stock limit reached! You already have all ${p.stock} available units of "${p.name}" in your cart.`
            : `Cannot add ${quantity} more. Stock limit of ${p.stock} reached (${currentInCart} already in cart, only ${remaining} available).`,
        stock: p.stock,
        currentInCart,
      }
    }

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
    return { success: true, message: `Added "${p.name}" to cart!` }
  } catch (error) {
    const err = getErrorMessage(error)
    console.error('addToCart error:', err)
    return { success: false, message: err }
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
