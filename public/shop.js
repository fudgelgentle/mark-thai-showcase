
/*
 *Pu Thavikulwat
 * 04/19/2022
 * AD, Itani,Abdul Rahman
 *
 * This is the JS file that handles all of the UI in shop.html.
 * It contains features like switching images on the item list when the
 * mouse is hovered over and adding items to the shopping cart
 */

"use strict";

(function() {
  window.addEventListener('load', init);

  // *An array that stores the checkout items in the format:
  //*   [default_price, quantity, title, price]
  let shopping_cart_array = [];

  /**
   * The starting function init() executes all the methods inside the
   * module pattern when the page is loaded.
   */
  async function init() {
    try {
      retrieveCookie();
      await populateShop();
      isCartEmpty();
      checkOut();
      changeIconBehavior();
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * This function changes the add-to-cart icon to a different color when
   * the mouse is hovered on / out.
   */
  function changeIconBehavior() {
    let imgList = qsa('article .detail-container img');
    for (let i = 0; i < imgList.length; i++) {
      console.log(imgList[i]);
      imgList[i].addEventListener('mouseover', changeIcon);
      imgList[i].addEventListener('mouseout', changeIcon);
    }
  }

  /**
   * Changes between two add-to-cart icons.
   */
  function changeIcon() {
    let iconName = this.src.split('/').pop();
    if (iconName.includes('2')) {
      this.src = 'img/' + iconName.replace('2','1');
      this.alt = this.src;
    } else {
      this.src = 'img/' + iconName.replace('1','2');
      this.alt = this.src;
    }
  }

  /**
   * Handles the "Checkout" behavior when the user adds items to the cart and
   * clicks the shopping cart logo to checkout.
   */
  function checkOut() {
    let checkOutBtn = id('checkout');
    checkOutBtn.addEventListener('click', checkOutHelper);
  }

  async function checkOutHelper() {
    // Cookies.set('cart_info', JSON.stringify(shopping_cart_array), { expires: 7 });
    window.location.href = 'checkout.html';
  }

  /**
   * A function for "Adding to Cart" behavior that adds the item into
   * the shopping_cart array after the user clicks "Add to Cart" button. The
   * quantity of the item is increased everytime the add to cart is clicked.
   */
  function addToCart() {
    // WIP: Quantity is set to 1 for now
    let product_id = this.id;
    let left_side = this.parentNode.previousElementSibling;
    let title = left_side.childNodes[0].textContent;
    let price = left_side.childNodes[1].textContent;
    let found_index = shopping_cart_array.findIndex((i) => i.id === product_id);
    if (found_index > -1) {
      shopping_cart_array[found_index].quantity++;
    }
    else {
      shopping_cart_array.push(
        {id: product_id, quantity: 1, title: title, price: price}
        )
    }
    isCartEmpty();
    saveCookie();
    location.reload();
  }

  /**
   * This function updates the cookie with shopping_cart_array everytime an item
   * is added to cart.
   */
  function saveCookie() {
    Cookies.set('cart_info', JSON.stringify(shopping_cart_array), { expires: 7 });
  }

  /**
   * This function retrieves the current cookie and fills in shopping_cart_array
   * with that cookie.
   */
  function retrieveCookie() {
    let cart_info = Cookies.get('cart_info');
    if(cart_info) {
      console.log('not undef')
      shopping_cart_array = JSON.parse(cart_info);
    } else {
      console.log('undef');
    }
  }

  /**
   * Fetches the endpoint '/list-product' and populates all of the legal
   * products from Stripe.
   */
  async function populateShop() {
    try {
      id('loading').classList.remove('hidden');
      let productList = await fetch('/list-product');
      await statusCheck(productList);
      productList = await productList.json();
      let parentContainer = gen('article');

      // & result holds the default_price of all legal products
      let default_price;
      let product_id;
      // & unit_amount is how much the product costs
      let unit_amount;
      let images;
      let name;

      for (let i = 0; i < productList.data.length; i++) {
        // ? If the default price isn't null and the product is active
        if (productList.data[i].default_price && productList.data[i].active) {
          default_price = productList.data[i].default_price;
          product_id = productList.data[i].id;
          unit_amount = await getUnitAmount(default_price)
          images = productList.data[i].images;
          name = productList.data[i].name;

          // Generates the item info
          let divContainer = gen('div');
            let listBackground = gen('div');

            // ? list-background------------------------------------------------
            listBackground.classList.add('list-background');
              // * img
              let img = gen('img');
              img.src = images;
              img.alt = name;
              img.setAttribute('id', product_id);
              img.classList.add('prodImg');

              let imgLink = gen('a');
              imgLink.href= '/product?id=' + product_id;
              id('loading').classList.add('hidden');
              imgLink.appendChild(img);
              // * img

              // & detail-container---------------------------------------------
              let detailContainer = gen('div');
              detailContainer.classList.add('detail-container');
                let leftSide = gen('div');
                leftSide.classList.add('left-side');

                  let titleLink = gen('a');
                  titleLink.href = '/product?id=' + product_id;
                  titleLink.textContent = name;

                  let price = gen('p');
                  price.textContent = '$' + unit_amount;
                  price.setAttribute('id', 'price');
                let rightSide = gen('div');
                rightSide.classList.add('right-side');
                  let icon = gen('img');
                  icon.src = 'img/add-to-cart1.svg';
                  icon.alt = 'add-to-cart1';
                  icon.classList.add('cart-icon');
                  icon.setAttribute('id', product_id);
                  icon.onclick = addToCart;
              // & detail-container---------------------------------------------

            let button = gen('button');
            button.textContent = 'Add To Cart';
          // ? list-background--------------------------------------------------

          // Grouping left-side and right-side
          // leftSide.appendChild(title);
          leftSide.appendChild(titleLink);
          leftSide.appendChild(price);

          rightSide.appendChild(icon);

          // Grouping detail-container
          detailContainer.appendChild(leftSide);
          detailContainer.appendChild(rightSide);

          // Grouping list-background
          // listBackground.appendChild(img);
          listBackground.appendChild(imgLink);
          listBackground.appendChild(detailContainer);

          // Grouping div-containter
          divContainer.appendChild(listBackground);
          divContainer.setAttribute('id', product_id);

          // Finally, groups the parent-div
          parentContainer.appendChild(divContainer);
        }
      }
      id('item-list').appendChild(parentContainer);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   *
   * @param {string} default_price - the product id
   * @returns the price of the given product in dollars $
   */
  async function getUnitAmount(default_price) {
    try {
      let res = await fetch('/retrieve-price?default_price=' + default_price);
      await statusCheck(res);
      res = await res.text();
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Checks if the shopping_cart array has any items. If so, the floating
   * shopping cart will display a red dot.
   */
  function isCartEmpty() {
    if (shopping_cart_array.length === 0) {
      id('checkout').src = 'img/cart.png';
    } else {
      id('checkout').src = 'img/active_cart.png';
    }
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
   * Takes in a given tag and creates a new tag element
   * @param {HTMLElement} tag - the given tag
   * @return {HTMLElement} a new tag element
   */
  function gen(tag) {
    return document.createElement(tag);
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
   * Takes in a promise object and checks if the promise request succeeded.
   * Throws a new error if the request did not succeed.
   * @param {response} response - A promise object
   * @return {Promise} A promise object
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

})();

