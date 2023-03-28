
// ? Note: Every page that has a floating cart menu will need this js file

"use strict";
(function() {

  window.addEventListener('load', init);

  function init() {
    isCartEmpty();
    checkOut();
  }

  /**
   * Fetches the cookie and returns a boolean stating whether the cookie
   * is empty or not.
   * @returns {boolean}
   */
  function isCookieEmpty() {
    console.log('calledd');
    // cart_info will be undefined if it's empty, which returns false;
    let cart_info = Cookies.get('cart_info');
    let cartJson = JSON.parse(cart_info);
    return Object.keys(cartJson).length === 0;
  }

  /**
     * Checks if the shopping_cart array has any items. If so, the floating
     * shopping cart will display a red dot.
     */
  function isCartEmpty() {
    if (isCookieEmpty()) {
      id('checkout').src = 'img/cart.png';
    } else {
      id('checkout').src = 'img/active_cart.png';
    }
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @return {object} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
 * Handles the "Checkout" behavior when the user adds items to the cart and
 * clicks the shopping cart logo to checkout.
 */
  function checkOut() {
    let checkOutBtn = id('checkout');
    checkOutBtn.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }

})();