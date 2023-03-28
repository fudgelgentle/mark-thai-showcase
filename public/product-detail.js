(function() {

  // *An array that stores the checkout items in the format:
  //*   [default_price, quantity, title, price]
  let shopping_cart_array = [];

  window.addEventListener('load', init);

  function init() {
    loadCartCookie();
    editCartBehavior();
    addToCart();
  }

  /**
   * Loads the cart_info cookie and fills in shopping_cart_array with the cookie.
   */
   function loadCartCookie() {
    let cartInfo = Cookies.get('cart_info');
    if(cartInfo) {
      cartInfo = JSON.parse(cartInfo);
      console.log(cartInfo);
      shopping_cart_array = cartInfo;
    }
  }

  /**
   * Handles add to cart behavior.
   */
  function addToCart() {
    let cartBtn = qs('.cart-btn');
    cartBtn.addEventListener('click', addToCartHelper);
  }

  /**
   * Helper function that allows users to add items from the product-detail
   * page to the shopping cart.
   */
  function addToCartHelper() {
    let product_id = this.id;
    let quantity = parseInt(id('qty').textContent);
    console.log('qtyF = ' + parseInt(id('qty').textContent));
    let title = id('prodName').textContent;
    let price = id('price').textContent;

    let found_index = shopping_cart_array.findIndex((i) => i.id === product_id);
    if (found_index > -1) {
      shopping_cart_array[found_index].quantity += quantity;
    } else {
      shopping_cart_array.push(
        {id: product_id, quantity: quantity, title: title, price: price}
        );
    }
    console.log(shopping_cart_array);
    saveCookie();
    location.reload();
  }

  /**
   * Allows users to increase/decrease the amount of product they want to
   * add to their shopping cart.
   */
  function editCartBehavior() {
    let plusButton = qsa('.plus');
    let minusButton = qsa('.minus');

    for (let i = 0; i < plusButton.length; i++) {
      plusButton[i].addEventListener('click', async e => {
        await plusCart();
      });
    }

    for (let i = 0; i < plusButton.length; i++) {
      minusButton[i].addEventListener('click', async e => {
        await minusCart();
      });
    }
  }

  /**
   * Increases quantity to the selected item when the plus icon is clicked.
   */
   async function plusCart() {
    let quantity = id('qty');
    quantity.textContent = parseInt(quantity.textContent) + 1;
  }

  /**
   * Decreases quantity to the selected item when the minus icon is clicked.
   */
  async function minusCart() {
    let quantity = id('qty');
    if (parseInt(quantity.textContent) > 1) {
      quantity.textContent = parseInt(quantity.textContent) - 1;
    }
  }

  /**
   * This function updates the cookie with shopping_cart_array everytime an item
   * is added to cart.
   */
  function saveCookie() {
    Cookies.set('cart_info', JSON.stringify(shopping_cart_array), { expires: 7 });
    console.log(Cookies.get('cart_info'));
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
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
   function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @return {object[]} array of DOM objects matching the query.
   */
   function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Takes in a given tag and creates a new tag element
   * @param {HTMLElement} tag - the given tag
   * @return {HTMLElement} a new tag element
   */
   function gen(tag) {
    return document.createElement(tag);
  }

})();