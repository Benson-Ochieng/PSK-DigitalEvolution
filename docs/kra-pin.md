# KRA PIN Field — Implementation Plan
*Reverse-engineered from petstore.co.ke, for the Granular IT WooCommerce store*

## What petstore.co.ke does

Two touchpoints, tied together by a shared value:

1. **Checkout page** — an optional "KRA PIN" field sits after Order Notes and before the terms-and-conditions checkbox.
   - Label: `KRA PIN (optional)`
   - Placeholder: `E.G. A123456789B`
   - Helper text: `Optional. Use 11 characters, for example A123456789B.`

2. **My Account → Edit Account** — a "KRA PIN" field sits after the password-change fields and before the newsletter subscription options.
   - Label: `KRA PIN`
   - Helper text: `Optional. Save this for business expense records.`
   - Pre-filled with whatever the customer saved previously (e.g. `A014365385C`).

The two are the same underlying value: saving it on the account page pre-fills it at checkout next time, and entering it at checkout (while logged in) updates the saved value for future orders. This is standard practice in Kenya for customers who want KRA PIN printed on their receipt for business expense/tax purposes.

## Data model

| Field | Storage | Key |
|---|---|---|
| Order-level value | Order meta | `_kra_pin` |
| Customer's saved value | User meta | `kra_pin` |

KRA PIN format: 1 letter + 9 digits + 1 letter = 11 characters (e.g. `A123456789B`). Validate this format only when the field isn't blank — it stays optional.

## `functions.php` code

```php
/**
 * KRA PIN field — checkout + My Account
 * Mirrors the field behavior on petstore.co.ke
 */

// ---------------------------------------------------------------------
// 1. Checkout: render the field after Order Notes, pre-filled from
//    the logged-in customer's saved KRA PIN if they have one.
// ---------------------------------------------------------------------
add_action( 'woocommerce_after_order_notes', 'gr_add_kra_pin_checkout_field' );
function gr_add_kra_pin_checkout_field( $checkout ) {
    $user_id   = get_current_user_id();
    $saved_pin = $user_id ? get_user_meta( $user_id, 'kra_pin', true ) : '';

    echo '<div id="kra_pin_field">';

    woocommerce_form_field( 'kra_pin', array(
        'type'              => 'text',
        'class'             => array( 'kra-pin-field form-row-wide' ),
        'label'             => __( 'KRA PIN (optional)', 'woocommerce' ),
        'placeholder'       => __( 'E.G. A123456789B', 'woocommerce' ),
        'required'          => false,
        'custom_attributes' => array( 'maxlength' => '11' ),
    ), $checkout->get_value( 'kra_pin' ) ?: $saved_pin );

    echo '<p class="form-row form-row-wide kra-pin-hint" style="margin-top:-10px;font-size:0.85em;color:#666;">'
        . esc_html__( 'Optional. Use 11 characters, for example A123456789B.', 'woocommerce' )
        . '</p></div>';
}

// ---------------------------------------------------------------------
// 2. Checkout: validate format only if something was entered.
// ---------------------------------------------------------------------
add_action( 'woocommerce_after_checkout_validation', 'gr_validate_kra_pin_checkout', 10, 2 );
function gr_validate_kra_pin_checkout( $data, $errors ) {
    if ( ! empty( $data['kra_pin'] ) ) {
        $pin = strtoupper( trim( $data['kra_pin'] ) );
        if ( ! preg_match( '/^[A-Z]\d{9}[A-Z]$/', $pin ) ) {
            $errors->add(
                'validation',
                __( 'Please enter a valid KRA PIN (11 characters, e.g. A123456789B), or leave the field blank.', 'woocommerce' )
            );
        }
    }
}

// ---------------------------------------------------------------------
// 3. Checkout: save to the order, and back to the customer's account
//    so it's ready for next time. HPOS-safe (uses the order object,
//    not update_post_meta directly).
// ---------------------------------------------------------------------
add_action( 'woocommerce_checkout_update_order_meta', 'gr_save_kra_pin_to_order' );
function gr_save_kra_pin_to_order( $order_id ) {
    if ( empty( $_POST['kra_pin'] ) ) {
        return;
    }

    $pin   = strtoupper( sanitize_text_field( wp_unslash( $_POST['kra_pin'] ) ) );
    $order = wc_get_order( $order_id );

    if ( $order ) {
        $order->update_meta_data( '_kra_pin', $pin );
        $order->save();
    }

    $user_id = get_current_user_id();
    if ( $user_id ) {
        update_user_meta( $user_id, 'kra_pin', $pin );
    }
}

// ---------------------------------------------------------------------
// 4. Admin: show it on the single-order screen next to billing info.
// ---------------------------------------------------------------------
add_action( 'woocommerce_admin_order_data_after_billing_address', 'gr_show_kra_pin_admin_order' );
function gr_show_kra_pin_admin_order( $order ) {
    $pin = $order->get_meta( '_kra_pin' );
    if ( $pin ) {
        echo '<p><strong>' . esc_html__( 'KRA PIN:', 'woocommerce' ) . '</strong> ' . esc_html( $pin ) . '</p>';
    }
}

// ---------------------------------------------------------------------
// 5. Optional: show it on the thank-you page / order-details view
//    (also appears in order emails that use this template hook).
// ---------------------------------------------------------------------
add_action( 'woocommerce_order_details_after_order_table', 'gr_show_kra_pin_order_details' );
function gr_show_kra_pin_order_details( $order ) {
    $pin = $order->get_meta( '_kra_pin' );
    if ( $pin ) {
        echo '<p><strong>' . esc_html__( 'KRA PIN:', 'woocommerce' ) . '</strong> ' . esc_html( $pin ) . '</p>';
    }
}

// ---------------------------------------------------------------------
// 6. My Account → Edit Account: render the field, pre-filled.
// ---------------------------------------------------------------------
add_action( 'woocommerce_edit_account_form', 'gr_add_kra_pin_account_field' );
function gr_add_kra_pin_account_field() {
    $pin = get_user_meta( get_current_user_id(), 'kra_pin', true );
    ?>
    <p class="form-row form-row-wide">
        <label for="kra_pin"><?php esc_html_e( 'KRA PIN', 'woocommerce' ); ?></label>
        <input type="text" class="woocommerce-Input woocommerce-Input--text input-text"
               name="kra_pin" id="kra_pin" maxlength="11"
               value="<?php echo esc_attr( $pin ); ?>" />
        <span class="description" style="font-size:0.85em;color:#666;display:block;margin-top:4px;">
            <?php esc_html_e( 'Optional. Save this for business expense records.', 'woocommerce' ); ?>
        </span>
    </p>
    <?php
}

// ---------------------------------------------------------------------
// 7. My Account: validate format if something was entered.
// ---------------------------------------------------------------------
add_action( 'woocommerce_save_account_details_errors', 'gr_validate_kra_pin_account', 10, 2 );
function gr_validate_kra_pin_account( $errors ) {
    if ( ! empty( $_POST['kra_pin'] ) ) {
        $pin = strtoupper( trim( wp_unslash( $_POST['kra_pin'] ) ) );
        if ( ! preg_match( '/^[A-Z]\d{9}[A-Z]$/', $pin ) ) {
            $errors->add(
                'kra_pin_error',
                __( 'Please enter a valid KRA PIN (11 characters, e.g. A123456789B), or leave the field blank.', 'woocommerce' )
            );
        }
    }
}

// ---------------------------------------------------------------------
// 8. My Account: save the field (runs after validation passes).
// ---------------------------------------------------------------------
add_action( 'woocommerce_save_account_details', 'gr_save_kra_pin_account_field' );
function gr_save_kra_pin_account_field( $user_id ) {
    if ( isset( $_POST['kra_pin'] ) ) {
        $pin = strtoupper( sanitize_text_field( wp_unslash( $_POST['kra_pin'] ) ) );
        update_user_meta( $user_id, 'kra_pin', $pin );
    }
}
```

## Notes

- **HPOS compatibility**: order-meta reads/writes go through `wc_get_order()->update_meta_data()` / `get_meta()`, not `update_post_meta()` / `get_post_meta()` directly — safe whether or not High-Performance Order Storage is enabled.
- **Guests**: guests can still fill the checkout field; it saves to the order but there's no user account to persist it to. That matches petstore.co.ke's behavior (field is on checkout regardless of login state).
- **Case handling**: input is upper-cased before validation/storage so `a123456789b` and `A123456789B` are treated the same.
- **Security**: both checkout and My Account forms already run through WooCommerce's own nonce checks, so no extra nonce handling is needed inside these hooks.

## Testing checklist

- [ ] Guest checkout: field shows, placeholder correct, order saves `_kra_pin` when filled
- [ ] Guest checkout: leaving it blank does not block order placement
- [ ] Logged-in checkout, no saved PIN: field starts empty
- [ ] Logged-in checkout, saved PIN exists: field pre-fills from account
- [ ] Entering a new PIN at checkout updates the saved account value
- [ ] Invalid format (wrong length/pattern) blocks submission with the error message, on both checkout and Edit Account
- [ ] Admin order screen shows the PIN when present, hides the line when absent
- [ ] Thank-you page / order-details view shows the PIN when present
- [ ] Edit Account page pre-fills and updates correctly, independent of placing an order
