# Supplier, Inventory & Restock Testing Checklist

This checklist provides end-to-end verification steps for the **Supplier Management**, **Bulk Restock Engine**, **Inventory Ledger**, and **Dashboard Financial Telemetry** implemented in **Motorcycled** (based on [Tunify](https://github.com/YohSupremo/tunify) architecture).

---

## Pre-Flight Setup
- [ ] Backend running (`cd backend && npm run dev`) on port `5000` (or configured `.env` port).
- [ ] Frontend running (`cd frontend && npm run dev`) on `http://localhost:5173`.
- [ ] Log in as an **Admin** user and navigate to `/admin/inventory` and `/admin/dashboard`.

---

## 1. Supplier Management (`/admin/inventory` -> "Suppliers" Tab)

### 1.1 Supplier Creation
- [/] **Open Add Modal**: Click `+ Add supplier` button. Modal should open with fields: Name (required), Contact Person, Email, Phone, Address.
- [/] **Validation - Empty Name**: Try submitting with an empty name. Form should block submission and show *"Supplier name is required"*.
- [/] **Validation - Invalid Phone**: Enter an invalid phone like `"123"`. Form should reject and show *"Enter a valid phone number (7–15 digits)"*.
- [/] **Successful Addition**: Enter valid details (e.g., Name: `Yamaha Genuine Parts Ph`, Phone: `09171234567`, Contact: `Maria Santos`, Email: `parts@yamaha.ph`). Submit.
  - [/] Toast notification *"Supplier added"* appears.
  - [/] Modal closes automatically.
  - [/] New supplier row appears in the table with `0 restocks` and `Active` badge.
- [doesnt show error in the supplier name fieled] **Duplicate Name Guard**: Attempt to create another supplier with the same name (`Yamaha Genuine Parts Ph`, case-insensitive).
  - [/ (but is this needed?)] Backend returns `409 Conflict`.
  - [/] Toast displays *"A supplier with this name already exists"*.

### 1.2 Supplier Editing
- [/] **Open Edit Modal**: Click the edit (pencil) icon on an active supplier.
  - [/] Modal opens pre-populated with supplier's current details.
- [/] **Modify Details**: Update Contact Person or Phone and submit.
  - [/] Toast displays *"Supplier updated"*.
  - [/] Table reflects updated values without a full page reload.

### 1.3 Search & Status Filtering
- [/ but this only searches up supplier names] **Search Box**: Type a search query matching part of a supplier's name, email, contact person, or phone. Table filters in real-time.
- [/] **Active Tab**: Filter set to `Active`. Only suppliers without `deletedAt` are displayed.
- [/] **Deactivated Tab**: Filter set to `Deactivated`. Only soft-deleted suppliers are displayed.
- [/] **All Tab**: Both active and deactivated suppliers appear.

### 1.4 Audit Preservation Guard (Deactivation Check)
- [/] **Case A: Supplier WITHOUT Restock History (Brand New)**:
  - [/] Click the deactivate (red trash) icon on a newly created supplier with `0 restocks`.
  - [/] SweetAlert2 confirmation dialog appears: *"Deactivate supplier? ... will no longer appear in restock options."*
  - [/] Confirm deactivation.
  - [/] Toast displays *"Supplier deactivated"*.
  - [/] Supplier switches to `Deactivated` badge and disappears from `Active` filter tab.
- [ /] **Case B: Supplier WITH Restock History (Audit Guard Test)**:
  - [/] Perform at least one restock using an active supplier (see Section 2 below).
  - [/] After restocking, attempt to deactivate this supplier.
  - [/ (i feel like this is only happening in the tunify db because we assigned a supplier for each product. for this system it doesnt matter because we didnt assign a supplier for each product. )] SweetAlert2 error modal blocks the action:
    - Title: *"Cannot deactivate supplier"*
    - Body: *"This supplier has restock history and cannot be deactivated. Restock history must be preserved for auditing."*
  - [/] Supplier remains active in the database.

  this 1.4 preservation guard may be omitted wdyt? 

### 1.5 Supplier Restoration
- [/] Switch filter tab to `Deactivated`.
- [/] Click the restore (green rotate-arrow) icon on a deactivated supplier.
- [/] Toast displays *"Supplier restored"*.
- [/] Supplier reappears under the `Active` tab and in restock dropdowns.

---

## 2. Bulk Restock Engine (`/admin/inventory` -> "Restock Inventory" Modal)

### 2.1 Modal Interaction & Dynamic Rows
- [/] **Open Restock Modal**: Click `Restock inventory` button.
  - [/] Modal opens with an auto-generated Purchase Order Ref (e.g., `PO-XXXXXXXX`).
  - [/] Modal starts with 1 clean restocking row.
- [/] **Dynamic Row Addition**: Click `+ Add Line`.
  - [/] A new row is appended to the table.
  - [/] Click the trash icon on row 2. Row 2 is removed.
  - [/] If only 1 row remains, deletion is prevented or disabled (minimum 1 row required).

### 2.2 Product Auto-Population & Margin Rule Validation
- [ ] **Searchable Product Select**:
  - [/] Click or type in the product input. Filter dropdown appears with active catalog products.
  - [/] Navigate items with arrow keys `Up`/`Down` and `Enter` or mouse click.
- [/] **Auto-Fill Previous Unit Cost**:
  - [/] When an item with previous restock cost is chosen, `Unit Cost` auto-fills with recorded cost.
  - [/] Selling price is displayed next to or below the item.
- [/] **Critical Margin Rule Validation (`unitCost < sellingPrice`)**:
  - [/] Select a product that sells for `₱150,000`.
  - [/] Enter a unit cost equal to or greater than `₱150,000` (e.g. `₱150,000` or `₱155,000`).
  - [/] Validation error appears immediately: *"Unit cost must be strictly less than selling price (₱150,000)"*.
  - [/] Submit button is disabled or form submission is blocked.
  - [ ] Enter a valid unit cost (e.g. `₱110,000`). Error clears immediately.
- [/] **Quantity Validation**:
  - [ ] Enter `0` or negative number or float (e.g. `2.5`). Form rejects with *"Quantity must be a positive whole number"*.
  - [/] Enter integer `5`. Validated as valid.
- [/] **Supplier Selection**:
  - [/] Supplier dropdown only lists active suppliers (deactivated suppliers are omitted).

### 2.3 Multi-Line Batch Submission & Atomic Commit
- [/] **Prepare Multi-Line Restock**:
  - [/] Line 1: Motorcycle A, Supplier X, Qty: `2`, Cost: `₱120,000`, Note: `Initial showroom stock`.
  - [/] Line 2: Helmet / Part B, Supplier Y, Qty: `10`, Cost: `₱1,500`, Note: `Accessories rack`.
- [/] **Submit Batch**: Click `Save restock`.
  - [/] Restock saves successfully. Toast displays *"Restock saved"*.
  - [/] Modal closes.
  - [/] Catalog stock updates: Product A stock increased by `+2`, Product B stock increased by `+10`.
  - [/] Products' recorded `costPrice` updates to the new unit cost.
- [/] **Failed Lines Reporting (Backend Validation Test)**:
  - [/] If any server-side validation error occurs, backend returns `400` with `failedLines: [{ lineIndex, productId, reason }]`.
  - [/] Error banner displays at the top of the modal listing the exact line numbers and reasons.
  - [/] Transaction rolls back atomically: zero rows are written to DB if any line fails.

---

## 3. Inventory Stock Ledger (`/admin/inventory` -> "Stock Ledger" Tab)

### 3.1 Header Summary Cards
- [/] **Total Entries**: Displays total number of recorded transactions matching current filters.
- [/] **Total Units**: Displays sum of all quantity changes.
- [/] **Total Cost**: Displays total cost value $\sum (|\text{quantity}| \times \text{unitCost})$.

### 3.2 Data Grid Columns & Filtering
- [ ] **Ledger Columns**: Verify table shows:
  - Reference ID (`TXN-XXXXXXXX`)
  - Date and time
  - Type badge (`Restock`, `Sale`, `Reserve`, `Release`, etc.)
  - Product Name
  - Supplier Name (or `—` for non-restocks)
  - Quantity (green `+X` for restocks)
  - Unit Cost (`₱X`)
  - Total Cost (`₱Y`)
  - Order or PO Ref
  - Notes & Admin Performed By
- [ ] **Operation Type Filter**:
  - [ ] Filter by `Restock`: Only restock events appear.
  - [ ] Filter by `Sale`: Only order sales appear.
  - [ ] Filter by `All`: Complete audit trail appears.

---

## 4. Main Admin Dashboard (`/admin/dashboard`)

### 4.1 Inventory & Financials Section
- [ ] **Current Inventory Valuation**:
  - [ ] Card shows `₱` value equal to $\sum (\text{active product stock} \times \text{product costPrice})$.
- [ ] **Cost of Goods Sold (COGS)**:
  - [ ] Displays total cost of items on completed/paid orders: $\sum (\text{item.costPrice} \times \text{quantity})$.
- [ ] **Gross Profit**:
  - [ ] Card shows `Total Sales Revenue - COGS`.
  - [ ] Positive values styled in emerald green; negative in red.
- [ ] **Total Restock Outflow (Capital Invested)**:
  - [ ] Card shows all-time cash spent on restocks: $\sum (\text{quantity} \times \text{unitCost})$ from `InventoryTransaction`.
- [ ] **Net Cash Recovery**:
  - [ ] Card shows `Total Revenue - Total Restock Outflow`.
  - [ ] Subtitle reads: *"Collected revenue minus restock spend"*.
- [ ] **Capital Recovery Progress Bar**:
  - [ ] Displays percentage: $(\text{Revenue} / \text{Restock Spend}) \times 100\%$.
  - [ ] If Net $\ge 0$: Green/emerald bar with caption *"In profit — ₱X earned, ₱Y invested"*.
  - [ ] If Net $< 0$: Amber/rose bar with caption *"You're ₱X in the negative — ₱Y invested, ₱Z earned so far"*.

### 4.2 Recent Restocks Activity Feed
- [ ] **Widget Visibility**: "Recent restocks" card is visible on dashboard.
- [ ] **Feed Details**: Each restock entry displays:
  - Product name
  - Supplier name pill
  - Purchase order reference (e.g. `PO-XXXXXXXX`)
  - Notes (if provided)
  - Green quantity pill (e.g. `+5 units`)
  - Cost breakdown: `₱unitCost / unit` and `Total: ₱totalCost`
  - Relative time stamp (e.g. *"Just now"*, *"5m ago"*, *"2h ago"*)
- [ ] **Expand / Collapse**:
  - [ ] If more than 6 restocks exist, button displays *"Show all (X)"*.
  - [ ] Clicking expands to show up to 30 items.
  - [ ] Clicking *"Show less"* contracts back to 6 items.
- [ ] **Empty State**: When no restocks exist, shows graceful placeholder: *"No restock activity yet. Add stock from the inventory page."*

---

## 5. Security & Authorization Checks
- [ ] **Role Protection (Admin Only)**:
  - [ ] Attempt calling `GET /api/v1/suppliers` without auth token $\rightarrow$ `401 Unauthorized`.
  - [ ] Attempt calling with a customer token $\rightarrow$ `403 Forbidden`.
  - [ ] Attempt calling `POST /api/v1/admin/inventory/bulk-restock` as customer $\rightarrow$ `403 Forbidden`.
