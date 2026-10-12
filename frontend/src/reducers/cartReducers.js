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

// Rehydrate persisted cart from localStorage on load
const loadCartFromStorage = () => {
  try {
    const raw = localStorage.getItem('motorcycledCart')
    return raw ? JSON.parse(raw) : { cartItems: [], shippingInfo: {} }
  } catch {
    return { cartItems: [], shippingInfo: {} }
  }
}

const persisted = loadCartFromStorage()

const initialState = {
  cartItems: persisted.cartItems || [],
  shippingInfo: persisted.shippingInfo || {},
}

// Helper: persist non-sensitive cart data
const persist = (cartItems, shippingInfo) => {
  try {
    localStorage.setItem(
      'motorcycledCart',
      JSON.stringify({ cartItems, shippingInfo })
    )
  } catch {
    /* storage unavailable */
  }
}

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const incoming = action.payload
      // For motorcycles (isVehicle), each unit is a separate line
      // For parts, accumulate by productId
      if (incoming.isVehicle) {
        // Do not deduplicate motorcycles — each may have its own purchase method
        const exists = state.cartItems.find(
          (i) => i.cartItemId === incoming.cartItemId
        )
        if (exists) {
          // Already in cart (exact cartItemId match); do nothing
          persist(state.cartItems, state.shippingInfo)
          return state
        }
        const updated = [...state.cartItems, incoming]
        persist(updated, state.shippingInfo)
        return { ...state, cartItems: updated }
      }
      // Parts: accumulate quantity if same productId already in cart
      const existingIndex = state.cartItems.findIndex(
        (i) => i.productId === incoming.productId && !i.isVehicle
      )
      let updated
      if (existingIndex >= 0) {
        const existing = state.cartItems[existingIndex]
        const newQty = Math.min(
          existing.inStock,
          (existing.quantity || 1) + (incoming.quantity || 1)
        )
        updated = state.cartItems.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: newQty } : item
        )
      } else {
        updated = [...state.cartItems, incoming]
      }
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case REMOVE_ITEM_CART: {
      const updated = state.cartItems.filter(
        (i) => i.cartItemId !== action.payload
      )
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case UPDATE_ITEM_CART: {
      const { cartItemId, quantity } = action.payload
      const updated = state.cartItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case SELECT_CART_ITEM: {
      const { cartItemId, selected } = action.payload
      const updated = state.cartItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, selected } : item
      )
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case SELECT_ALL_CART_ITEMS: {
      const updated = state.cartItems.map((item) => ({
        ...item,
        selected: action.payload,
      }))
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case SET_ITEM_PURCHASE_METHOD: {
      const { cartItemId, purchaseMethod } = action.payload
      const updated = state.cartItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, purchaseMethod } : item
      )
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case SET_ITEM_TERM_MONTHS: {
      const { cartItemId, termMonths } = action.payload
      const updated = state.cartItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, termMonths } : item
      )
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case SAVE_SHIPPING_INFO: {
      const updated = action.payload
      persist(state.cartItems, updated)
      return { ...state, shippingInfo: updated }
    }

    case CLEAR_SELECTED_ITEMS: {
      // Remove only the cart items whose cartItemId is in the payload array
      const toRemove = new Set(action.payload)
      const updated = state.cartItems.filter(
        (i) => !toRemove.has(i.cartItemId)
      )
      persist(updated, state.shippingInfo)
      return { ...state, cartItems: updated }
    }

    case CLEAR_CART: {
      persist([], state.shippingInfo)
      return { ...state, cartItems: [] }
    }

    default:
      return state
  }
}
