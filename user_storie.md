Project Development Guide: Agricultural Store POS
This document outlines the features for the new Point of Sale (POS) and Inventory system. The project will be built as a standalone desktop application using Electron, React, and SQLite, designed to work completely offline.

The primary user of this system is the Store Seller.

Core User Stories

Story 1: Managing Products
[x] As a Store Seller,
[x] I want to add, view, and edit all my products in one place,
[x] so that I can accurately track inventory levels and pricing.

Acceptance Criteria (must have these features):

[x] When I add a product, the system must automatically create a unique SKU for it.
[x] I must be able to enter a Product Name, a Description (to tell similar items apart), a Selling Price, and the initial quantity in stock.
[x] I need to see a list of all my products with their current stock levels.

Story 2: Creating Barcode Labels
[x] As a Store Seller,
[x] I want to select any product from my inventory and print a barcode label for it,
[x] so that I can label my items for fast checkout.

Acceptance Criteria:

[x] The printed label must show the product's name, price, and a scannable barcode representing its unique SKU.
[x] The printing should work with a dedicated label printer.

Story 3: Selling an Item (The Fast Way)
[x] As a Store Seller,
[x] I want to use a USB barcode scanner to scan an item,
[x] so that it is immediately added to the customer's cart.

Acceptance Criteria:

[x] The main sales screen should be ready to accept a scan at any time.
[x] Scanning a barcode finds the product and adds it to the cart with the correct price instantly.
[x] Scanning the same item multiple times should increase its quantity in the cart.

Story 4: Selling an Item (The Manual Way)
[x] As a Store Seller,
[x] I want to type a product's name to find it,
[x] so that I can sell items that I haven't had time to label yet.

Acceptance Criteria:

[x] As I type in a search box, a list of matching products must appear.
[x] This list must show me enough information (like description and price) to pick the correct item, especially if multiple products have the same name but different prices.
[x] I can select the correct item from the list with my mouse or keyboard to add it to the cart.

Story 5: Completing a Transaction
[ ] As a Store Seller,
[ ] I want to finalize a sale with a single button,
[ ] so that my inventory is automatically updated and the customer gets a receipt.

Acceptance Criteria:

[ ] The cart must clearly show a final total.
[ ] When I click "Complete Sale":
[ ] The stock count for each sold item must decrease in the database.
[ ] A record of the sale must be saved permanently.
[ ] A receipt must be automatically printed on my thermal receipt printer.

Story 6: Protecting Business Data
[ ] As a Store Owner,
[ ] I want to press a button to back up all my data to a USB flash drive,
[ ] so that my business is protected if the computer fails.

Acceptance Criteria:

[ ] There must be an easy-to-find "Backup" button.
[ ] This function should save a single, dated backup file of the database.
[ ] There should also be a "Restore" function to load data from a backup file, with a clear warning that it will overwrite existing data.

Technical Implementation Checklist for the Developer
This is a high-level guide to building the application based on the user stories.

Phase 0: Foundation

[x] Set up a new project with Electron and React (Vite template recommended).
[x] Configure electron-builder for packaging the final application.
[x] Establish the IPC bridge between the Main and Renderer processes using a preload.js script.
[x] Set up SQLite and write the initialization script to create the products, sales, and sale_items tables if they don't exist.

Phase 1: Inventory & Labeling (Story 1 & 2)

[x] Build the React UI for the "Product Management" screen.
[x] Implement the IPC functions for addProduct, editProduct, getProduct(s).
[x] Connect the UI to the IPC functions.
[x] Integrate jsbarcode to generate a barcode image.
[x] Implement the IPC call to print the generated label.

Phase 2: Point of Sale Interface (Story 3 & 4)

[x] Build the React UI for the main "POS" screen.
[x] Implement the logic for the shopping cart (add item, update quantity, remove item).
[x] Implement the primary lookup function:
[x] It should first check if the input is a direct SKU match (for scanning).
[x] If not, it should perform a LIKE search on the product name/description.
[x] Crucially, implement a debounce on this search function to prevent performance issues.
[x] Connect the search input and results list to the cart.

Phase 3: Finalizing the Sale (Story 5)

[ ] Create the "Complete Sale" transaction function. This function must be atomic (all or nothing) and should:
[ ] Create the sales record.
[ ] Create the sale_items records.
[ ] Update the stockOnHand in the products table.
[ ] Implement the HTML receipt generation.
[ ] Use Electron's contents.print() API for silent receipt printing.

Phase 4: Data Safety & Final Polish (Story 6)

[ ] Build the UI for the Settings/Backup screen.
[ ] Implement the file-copy logic for the "Backup" function.
[ ] Implement the file replacement logic for the "Restore" function, including a confirmation dialog.
[ ] Thoroughly test all workflows and package the application for deployment.