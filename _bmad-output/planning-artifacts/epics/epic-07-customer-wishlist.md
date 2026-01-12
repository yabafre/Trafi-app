# Epic 7: Customer Accounts & Wishlist

Buyer peut creer un compte (email, Google, Apple), gerer ses adresses, wishlist, et voir son historique.

**FRs covered:** FR41, FR42, FR43, FR44, FR45, FR79, FR80, FR81, FR82, FR83, FR84

---

## Story 7.1: Customer Registration with Email

As a **Buyer (Emma)**,
I want **to create an account with my email and password**,
So that **I can have a personalized shopping experience**.

**Acceptance Criteria:**

**Given** a buyer is on the registration page
**When** they submit email and password
**Then** account is created with:
- Email validation (format and uniqueness)
- Password strength requirements (min 8 chars, mixed case)
- Password hashed with bcrypt
**And** welcome email is sent
**And** buyer is automatically logged in
**And** any guest cart is merged with the new account

---

## Story 7.2: Customer Login and Session

As a **Buyer (Emma)**,
I want **to log in to my account**,
So that **I can access my saved information**.

**Acceptance Criteria:**

**Given** a registered buyer
**When** they submit valid credentials
**Then** a secure session is created
**And** session persists across browser closes (remember me)
**And** invalid credentials show appropriate error
**And** account lockout after 5 failed attempts (temporary)
**And** logout clears session completely

---

## Story 7.3: Password Reset Flow

As a **Buyer (Emma)**,
I want **to reset my password if I forget it**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** a buyer requests password reset
**When** they enter their email
**Then** a reset link is sent (valid for 1 hour)
**And** link leads to password reset form
**And** submitting new password updates the account
**And** all existing sessions are invalidated
**And** confirmation email is sent after reset
**And** invalid/expired links show clear messaging

---

## Story 7.4: Google OAuth Authentication

As a **Buyer (Emma)**,
I want **to sign in with my Google account**,
So that **I can log in quickly without a new password**.

**Acceptance Criteria:**

**Given** a buyer clicks "Sign in with Google"
**When** they authorize on Google
**Then** account is created or linked automatically
**And** email from Google is used as identifier
**And** profile name is pre-filled from Google
**And** buyer is logged in upon return
**And** existing email account can be linked to Google

---

## Story 7.5: Sign in with Apple

As a **Buyer (Emma)**,
I want **to sign in with my Apple ID**,
So that **I can use Apple's privacy-focused authentication**.

**Acceptance Criteria:**

**Given** a buyer clicks "Sign in with Apple"
**When** they authorize on Apple
**Then** account is created or linked
**And** Apple's private relay email is supported
**And** configurable Services ID and redirect URLs (FR81)
**And** buyer is logged in upon return
**And** works on web flow (not just native apps)

---

## Story 7.6: Address Book Management

As a **Buyer (Emma)**,
I want **to save multiple shipping addresses**,
So that **I can checkout faster for different locations**.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they access their address book
**Then** they can:
- Add new addresses with all required fields
- Edit existing addresses
- Delete addresses
- Set a default shipping address
- Set a default billing address
**And** addresses are available at checkout for quick selection
**And** maximum 10 addresses per account

---

## Story 7.7: Order History View

As a **Buyer (Emma)**,
I want **to view my past orders**,
So that **I can track purchases and reorder items**.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they access order history
**Then** they see all their orders with:
- Order number and date
- Order status and total
- Items purchased (thumbnails)
**And** clicking an order shows full details
**And** orders are paginated for performance
**And** guest orders can be claimed by email match

---

## Story 7.8: Order Tracking

As a **Buyer (Emma)**,
I want **to track my order shipments**,
So that **I know when my order will arrive**.

**Acceptance Criteria:**

**Given** a buyer views an order with shipment
**When** tracking info is available
**Then** they see:
- Carrier name and tracking number
- Link to carrier tracking page
- Shipment status (if available via API)
- Estimated delivery date
**And** multiple shipments per order are shown separately

---

## Story 7.9: Returning Customer Identification

As a **System**,
I want **to identify returning customers across sessions**,
So that **their experience is personalized**.

**Acceptance Criteria:**

**Given** a customer has previously purchased
**When** they visit the store (logged in or via email match)
**Then** the system recognizes them
**And** logged-in customers see their saved preferences
**And** guest checkout with known email can show order history
**And** recognition enables personalized recommendations (future)
**And** privacy is respected (no tracking without consent)

---

## Story 7.10: Wishlist - Add and View

As a **Buyer (Emma)**,
I want **to save products to a wishlist**,
So that **I can remember items I want to buy later**.

**Acceptance Criteria:**

**Given** a buyer is viewing products
**When** they click the wishlist icon
**Then** the product is added to their wishlist
**And** visual feedback confirms the action (heart fills)
**And** wishlist persists across sessions (account-linked)
**And** anonymous users are prompted to log in
**And** one-click add without page reload (UX-84)

---

## Story 7.11: Wishlist Management

As a **Buyer (Emma)**,
I want **to manage my wishlist items**,
So that **I can organize products I'm interested in**.

**Acceptance Criteria:**

**Given** a buyer views their wishlist
**When** they manage items
**Then** they can:
- View all wishlist items with images and prices
- Remove items from wishlist
- Sort items by date added or price
- See if items are in stock or out of stock
**And** out-of-stock items are visually indicated
**And** price changes since adding are shown

---

## Story 7.12: Wishlist to Cart

As a **Buyer (Emma)**,
I want **to move wishlist items to my cart**,
So that **I can easily purchase saved items**.

**Acceptance Criteria:**

**Given** a buyer has items in wishlist
**When** they click "Add to Cart"
**Then** the item is added to cart with default variant
**And** item remains in wishlist (unless setting to remove)
**And** variant selection is available if multiple exist
**And** out-of-stock items show "Notify Me" instead
**And** bulk "Add All to Cart" is available
