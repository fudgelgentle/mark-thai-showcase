require('dotenv').config();

// Gets the API key from process.env
const stripe = require('stripe')(process.env.STRIPE_API_TOKEN);
const express = require('express');
const app = express();
// ! Need to require CORS when you're fetching API from 3rd party services
const cors = require("cors");
const path = require('path');
const port = process.env.PORT || 3000;

// * Viewing ejs files
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// ! Put this down to make express accept JSON data in POST create checkout
// ! session, i.e. req.body
app.use(express.json());


app.use(
    cors({
      origin: ["${YOUR_DOMAIN}", "https://checkout.stripe.com"],
    })
);

/**
 * This endpoint is used with ejs to create product detail page for all
 * the products listed in the Shop.
 */
// Sample id: prod_LvXOq7aYRQfCXZ
app.get("/product", async (req, res) => {
  let id = req.query.id;
  if (id.length > 0) {
    let productObject = await stripe.products.retrieve(id);
    let default_price = productObject.default_price;
    let unit_amount = await getUnitAmount(default_price);

    let thisTitle = productObject.name;
    let thisImages = productObject.images;
    let thisDescription = productObject.description;
    let thisPrice = '$' + centsToDollars(unit_amount);

    res.render("product-detail", {
      title: thisTitle,
      images: thisImages,
      description: thisDescription,
      price: thisPrice,
      product_id: id
    });
  }
});

/**
 * Converts the unit_amount from cents to dollars
 * @param {Number} The unit_amount in cents
 * @returns {String} The unit_amount in dollars, rounded by 2 decimal places
 */
function centsToDollars(cents) {
  return (parseFloat(cents) / 100).toFixed(2);
}

/**
 * ! Unused endpoint (for now)
 */
app.post('/create-product', async (req, res) => {
  try {
    console.log('name = ' + req.body.name);
    console.log('id = ' + req.body.id);
    console.log('description = ' + req.body.description);
    let product = await stripe.products.create({
      name: req.body.name,
      id: req.body.id,
      description: req.body.description
    })
    // let product = await stripe.products.create({
    //   name: "pad thai",
    //   id: "2",
    //   description: "this is a pad thai"
    // })
    console.log('product created');
    res.json(product);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

/**
 * Retrieves the details of an existing product. Supply the unique product ID
 * from either a product creation request or the product list, and
 * Stripe will return the corresponding product information.
 */
app.get('/retrieve-product', async (req, res) => {
  try {
    let id = req.query.id;
    console.log('id = ' + id);
    let product = await stripe.products.retrieve(id);
    res.json(product);
    console.log('success');
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

/**
 * List the only active products in Stripe
 */
app.get('/list-product', async (req, res) => {
  try {
    let productList = await stripe.products.list({
      active: true,
    });
    res.json(productList);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

/**
 * Takes in the 'default_price' from the query and outputs the unit_amount
 * (or the price) of the product in dollars.
 */
app.get('/retrieve-price', async (req, res) => {
  try {
    // let priceObj = await stripe.prices.retrieve(req.query.default_price);
    // let unit_amount = priceObj.unit_amount;
    // res.type('text').send(centsToDollars(unit_amount));

    let unit_amount = await getUnitAmount(req.query.default_price);
    res.type('text').send(centsToDollars(unit_amount));
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

/**
 * ! Unused endpoint (for now)
 */
app.delete('/delete-product', async (req, res) => {
  try {
    await stripe.products.del(req.query.id);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

/**
 * ! Unused endpoint (for now)
 */
app.delete('/delete-all-product', async (req, res) => {
  try {
    let productList = await stripe.products.list();
    for (let i = 0; i < productList.data.length; i++) {
      await stripe.products.del(productList.data[i].id);
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

/**
 * Takes in a JSON Array of the items in the shopping_cart and sends
 * the corresponding Stripe checkout URL to the client side.
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    if (req.body.length > 0) {
      console.log('req body: ' + JSON.stringify(req.body));
      const session = await stripe.checkout.sessions.create({
        line_items: req.body,
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}/success.html`,
        cancel_url: `${YOUR_DOMAIN}/checkout.html`,
      });
      console.log(session.url);
      res.send(session.url);
    } else {
      console.log('EMPTY CART');
    }
  } catch (error) {
    console.log(error);
  }
});

// ~The 404 Route (ALWAYS Keep this as the last route)
app.get('*', (req, res) => {
  res.render('error');
});

/**
 *
 * @param {id} default_price
 * @returns Takes in the default_price and returns the unit_amount of the
 * Stripe price object in cents.
 */
 async function getUnitAmount(default_price) {
  let priceObj = await stripe.prices.retrieve(default_price);
  let unit_amount = priceObj.unit_amount;
  return unit_amount;
}

app.use(express.static('public'));
// TODO: Put in the website domain once it's published
const YOUR_DOMAIN = 'https://mark-home-made.onrender.com/';
app.listen(port, () => console.log('Running on port ' + port));