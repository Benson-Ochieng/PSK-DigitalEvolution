# Checkout Upsell Popup — Feature Spec

Reference: `petstore.co.ke/checkout/` (screenshot capture)

## What it does

A modal pops up over the checkout page offering one discounted add-on
product before the customer can place the order. It creates urgency
with a countdown, then lets the shopper either add the item or
dismiss and continue.

## Observed UI elements

| Element | Detail |
|---|---|
| Trigger | Fires ONLY once the customer fills in all required checkout fields and clicks "Place Order" (or WhatsApp checkout) |
| Dismissal | Cannot click outside the modal or use ESC; only closes via the 2 action buttons or timer expiry |
| Countdown | Numeric badge top-center, counting down from 30 seconds and auto-dismissing on 0 (proceeding with original order) |
| Heading | "Limited Time Offer!" in bold brand blue |
| Product card | Image, product name, regular price struck through (e.g. 195KSh), sale price in bold red (e.g. 137KSh) |
| Primary action | Green button — "Add to Cart & Checkout" (adds item at promo price, integrates calculations into total, and proceeds to payment/order completion) |
| Secondary action | Grey button — "Do Not Add to Cart & Checkout" (dismisses modal and proceeds to payment/order completion with original cart) |

## Trigger Architecture & Mechanics

### What Exactly Triggers the Popup Modal:

The modal is triggered **strictly upon form submission**, not on page load:

1. **Form Validation Passed**: The customer must have filled all required checkout fields (Name, Phone, Email, City, Neighbourhood, Street Address, and Terms checkbox).
2. **"Place Order" Click Intercept**: When the customer clicks the **"Place Order"** or **"Complete Order via WhatsApp"** button, the system intercepts the action if the upsell has not yet been prompted.
3. **Active Cart**: The cart must contain at least 1 item (`items.length > 0`).
4. **Product Exclusion**: The upsell product is not already present in the user's cart.
5. **Session Frequency Capping**: Has not already been prompted during this checkout attempt (`hasPromptedUpsell`).
6. **Store Configuration**: `enabled` is `true` in `content/upsells.json`.

### Dismissal Constraints:

- **No Outside Click**: Clicking the darkened backdrop outside the modal is disabled.
- **No ESC Key Dismissal**: Pressing the Escape key will not close the modal.
- **Authorized Dismissals Only**:
  1. **"Add to Cart & Checkout" Button**: Adds the upsell item, integrates calculations into the order total, and takes the shopper directly to the order placement / payment page.
  2. **"Do Not Add to Cart & Checkout" Button**: Closes the modal and proceeds with placing the order with the original cart.
  3. **30-Second Countdown Expiration (0s)**: Automatically closes the modal when the timer reaches 0 and proceeds to place the order with the original cart.

---

## Resolved Specifications & Behaviors

- **Post-Validation Intercept**: Modal only triggers after complete form validation when the user clicks "Place Order".
- **Integrated Calculations**: Clicking "Add to Cart & Checkout" recalculates item list, subtotal, shipping fee tier (e.g. free shipping above 5,000 KES in Nairobi), coupon discounts, loyalty discounts, and final total, then immediately submits to `/api/order` and loads the order confirmation/payment screen.
- **Auto-Proceed on Decline / Expiry**: If the customer clicks "Do Not Add to Cart & Checkout" or the timer reaches 0, the order continues processing with the initial cart without requiring a second click.
- **Strict Closure Guard**: Outside backdrop click and ESC key are disabled so the customer makes a clear decision or lets the timer run down.

## Proposed implementation (WooCommerce)

**1. Product selection — how the linking actually works**

There are two legitimate ways to decide *which* product shows in the
popup. Pick based on what the reference site seems to be doing (a
cat treat shown regardless of what's in the cart suggests option B,
a fixed/global pick — but confirm once you send the live URL).

**Option A — Cart-based cross-sell (WooCommerce native, no custom field needed)**
WooCommerce already has a "Linked Products" tab on every product
edit screen with **Cross-sells** and **Upsells** fields — this is
core functionality, not something you build. You just populate it
per product. Then at checkout, pull whatever cross-sells apply to
what's already in the cart:

```php
function get_checkout_upsell_product() {
    $cross_sell_ids = WC()->cart->get_cross_sells(); // auto-aggregated
                                                       // from every item in cart,
                                                       // already excludes items
                                                       // already in the cart
    if ( empty( $cross_sell_ids ) ) {
        return null;
    }
    return wc_get_product( $cross_sell_ids[0] ); // or apply your own
                                                  // priority/in-stock logic
}
```

**Option B — Fixed/global promo product**
If it's the same promo item for everyone regardless of cart contents,
store one setting (a single option) instead:

```php
function get_checkout_upsell_product() {
    $product_id = get_option( 'checkout_upsell_product_id' );
    return $product_id ? wc_get_product( $product_id ) : null;
}
```

Either way, the popup never hardcodes a name/price/image — it always
calls `wc_get_product( $id )` and reads live data off the product
object, so it can't drift out of sync with what's in wp-admin.

**AJAX endpoint that feeds the modal:**
```php
add_action( 'wp_ajax_get_checkout_upsell', 'ajax_get_checkout_upsell' );
add_action( 'wp_ajax_nopriv_get_checkout_upsell', 'ajax_get_checkout_upsell' );

function ajax_get_checkout_upsell() {
    $product = get_checkout_upsell_product();
    if ( ! $product ) {
        wp_send_json_error();
    }
    wp_send_json_success([
        'id'            => $product->get_id(),
        'name'          => $product->get_name(),
        'image'         => wp_get_attachment_image_url( $product->get_image_id(), 'medium' ),
        'regular_price' => $product->get_regular_price(),
        'sale_price'    => $product->get_sale_price(),
        'permalink'     => $product->get_permalink(),
    ]);
}
```

**Add-to-cart handler for the green button:**
```php
add_action( 'wp_ajax_upsell_add_to_cart', 'ajax_upsell_add_to_cart' );
add_action( 'wp_ajax_nopriv_upsell_add_to_cart', 'ajax_upsell_add_to_cart' );

function ajax_upsell_add_to_cart() {
    $product_id = absint( $_POST['product_id'] );
    WC()->cart->add_to_cart( $product_id, 1 );
    wp_send_json_success();
}
```

```js
// on "Add to Cart & Checkout" click
jQuery.post(wc_checkout_params.ajax_url, {
    action: 'upsell_add_to_cart',
    product_id: upsellProductId
}, function () {
    jQuery(document.body).trigger('update_checkout'); // refreshes totals in place
    closeModal();
});
```

**2. Trigger & markup**
Hook into `woocommerce_before_checkout_form` (or gate a footer script
with `is_checkout()`) so the modal assets only load on checkout. Fetch
the product data through a small AJAX endpoint
(`wp_ajax_` / `wp_ajax_nopriv_`) returning JSON:
`{ id, name, image, regular_price, sale_price, permalink }`.

**3. Countdown**
Plain JS `setInterval` from 30. Confirm against the reference site
whether 0 triggers auto-dismiss before wiring that behavior in.

**4. Add-to-cart action**
"Add to Cart & Checkout" → AJAX call to WooCommerce's add-to-cart
endpoint with the product ID and qty 1, then fire WooCommerce's
`update_checkout` event so totals/order review refresh without a
full page reload.
"Do Not Add & Checkout" → just closes the modal, no cart mutation.

**5. Discount display**
The struck-through + red price pattern matches WooCommerce's default
`get_price_html()` output for a product with a Sale Price set — no
coupon needed, just a sale price on the upsell product itself is the
simplest way to reproduce it.

## Dashboard Management (PSK Commerce)

Store administrators can manage and analyze checkout upsells directly from the Admin Dashboard:

- **Location**: Navigate to Admin Dashboard → **PSK Commerce** → **Checkout Upsells** (`/store_backend/upsells`).

### Page Structure & Features (in Order):

1. **Add New Upsell Product** (Top Section)
   - Clean product selector dropdown with instant catalog product lookup.
   - **`Add Upsell Product`** primary button to add the selected item to the active upsell pool.
   - Descriptive guidance text: *"Select a product to add as an upsell. It will be added to the table below."*

2. **Overview with the Filter** (Middle Section)
   - **3 Top Metric Cards**:
     - 🛒 **Total Upsell Products**: Active count of configured upsell items.
     - 👁 **Total Times Shown**: Aggregate count of popup modal impressions.
     - ✓ **Total Purchases**: Aggregate count of accepted upsell conversions.
   - **Search & Filter Bar**: Instant search input with a dedicated **`Filter`** button.
   - **Upsell Products Table**:
     - Columns: `ID`, `Name`, `Regular Price`, `Upsell Price` (with inline numerical input and individual **`Update`** button), `Min Quantity` (default 1), `Category`, and `Actions` (**`Remove`** button).

3. **Upsell Conversion Metrics** (Bottom Section)
   - **Filter Controls**:
     - Time Range dropdown (`Last 7 Days`, `Last 30 Days`, `Last 90 Days`, `All Time`).
     - Product dropdown (`All Products` or individual items).
     - **`Apply Filters`** button.
   - **Dual Analytics Charts**:
     - **Product Performance Bar Chart**: Visual comparison of *Times Shown* (cyan bars) vs. *Times Purchased* (pink bars) per product with pagination controls (`[Previous] Page 1 of 3 [Next]`).
     - **Revenue Over Time Line Chart**: Graphical representation of generated revenue over selected periods.
   - **Detailed Product Performance Table**:
     - Columns: `Product`, `Times Shown`, `Times Purchased`, `Conversion Rate (%)`, `Revenue`, and `Recent Impressions (Last 30 Days)`.
   - **Detailed Conversion Reports Export**:
     - **`Download PDF Report`** and **`Download CSV Report`** buttons for offline analytics and reporting.

### Real-Time Dynamic Event Tracking

- All metric counters, conversion rates, and chart data start at a **clean zero baseline (`0`)**.
- As customers encounter the checkout upsell popup modal on `/checkout`, an impression event is automatically recorded in real time.
- When customers click **"Add to Cart & Checkout"**, a purchase conversion event is logged, dynamically calculating conversion rates and revenue across time ranges.

### Dynamic Upsell Interchange & Category Affinity

When multiple products exist in the active upsell pool, the system selects which item to present on the checkout modal dynamically:

1. **Smart Category Context Matching (Dog vs. Cat)**:
   - **Cat in Cart**: If the customer's cart contains cat food, treats, or feline accessories, the system automatically presents a Cat upsell treat (e.g., *Reflex Happy Hour Cat Treat Healthy Bones* or *Reflex Calmness Cat Treat*).
   - **Dog in Cart**: If the customer's cart contains dog food, puppy treats, or canine supplies, the system presents a Dog upsell treat (e.g., *Reflex Dog Dental Care Treat* or *Spectrum Gusto Dog Snack*).
   - **Mixed / General**: Falls back to the primary featured offer or highest-converting pool product.

2. **Cart Exclusion & Fallback**:
   - The selector automatically checks the customer's cart and **excludes any product already in the cart**.
   - If the primary offer is already in the cart, the system seamlessly promotes the next best available product from the pool.

3. **Admin Rotation Strategies**:
   - Store managers can select between 4 strategies directly from the dashboard:
     - 🎯 **Smart Category Match** *(Dog/Cat cart context affinity)*
     - ⭐ **Highest Conversion Rate First** *(Auto-optimized ROI)*
     - 🔄 **Round-Robin Rotation** *(Even split across all items)*
     - 📌 **Fixed Featured Product Only** *(Manual choice)*

