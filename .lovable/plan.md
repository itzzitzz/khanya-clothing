

## Refund Feature for Admin Orders

### Overview
Add a "Refunded" option to the payment tracking dropdown on orders. When selected, it prompts for a refund reason, updates the payment status, excludes refunded orders from sales statistics, and removes refunded customers from the marketing campaign recipients list.

### Changes Required

#### 1. Database Migration
- Add a `refund_reason` column (text, nullable) to the `orders` table to store why the refund was issued.

#### 2. Edge Function: `update-payment-status`
- Handle the new `"Refunded"` payment status.
- Accept and store the `refund_reason` in the database.
- Send a refund confirmation email and SMS to the customer.

#### 3. OrderManager Component (`src/components/admin/OrderManager.tsx`)

**Refund reason dialog:**
- When admin selects "Refunded" from the payment tracking dropdown, show a dialog asking for a refund reason (required text field) before proceeding.

**Sales statistics exclusion:**
- Update `calculateStats()` to skip orders where `payment_tracking_status === 'Refunded'` so they no longer count toward All Time Sales, Financial Year, This Month, Last Month, or Outstanding Payments.

**Payment filter:**
- Add a "Refunded" option to the payment filter dropdown so admins can filter to see only refunded orders.

**Visual indicator:**
- Add a red/refund color style for the "Refunded" badge in `getPaymentTrackingColor()`.
- Display the refund reason on the order card when present.

#### 4. Marketing Manager (`src/components/admin/MarketingManager.tsx`)
- Update the customer query in `fetchCustomersForCampaign()` to exclude customers whose **only** orders are refunded (i.e., filter out orders with `payment_tracking_status = 'Refunded'` before building the delivered-customer list). Customers who have other non-refunded delivered orders will remain.

### Technical Details

**New DB column:**
```sql
ALTER TABLE orders ADD COLUMN refund_reason text;
```

**Stats calculation change** -- orders with `payment_tracking_status === 'Refunded'` will be entirely skipped in the `forEach` loop.

**Refund dialog** -- A new `AlertDialog` in OrderManager with a `Textarea` for the reason. On confirm, calls `handlePaymentUpdate` with status `"Refunded"` and passes the reason to the edge function.

**Edge function update** -- The `update-payment-status` function will accept an optional `refund_reason` field, save it to the order, and send a branded refund notification email/SMS.

**Marketing filter** -- The query `eq("order_status", "delivered")` will get an additional filter: `.neq("payment_tracking_status", "Refunded")` to exclude refunded customers from campaign recipients.

