
Batteries Shop — Frontend Demo

This is a simple static frontend demo for a Battery Shopping site. It runs entirely in the browser and uses localStorage to store demo data (products, users, session, and orders).

Features

- Register and Login (choose role: customer or admin)
- Product listing with category filter and per-product quantity
- Cart that persists for guests and merges into user session on login
- Checkout creates orders (persisted in localStorage)
- Admin dashboard to review orders and accept/reject with a basic history
- CSV export of orders (admin)

How to run (quick)

1. Double-click or open `index.html` in your browser. No server is required for basic testing.
2. Default admin credentials: username `admin`, password `admin` (created automatically on first run).
3. Register a new customer or admin via the Register tab in the modal. Add items to cart and checkout while logged in as a customer.

Notes & safety

- This is a demo for learning and prototyping only. Do not store real passwords or sensitive data here — localStorage is not secure.
- Passwords are stored in plain text for the demo. If you build a real app, add a backend and secure authentication.

Troubleshooting

- If UI elements appear hidden after an edit, try refreshing the page (Ctrl+R / F5).
- If orders don't appear for a user, ensure you're logged in with the same username used to place the order.
- If the cart seems empty after a refresh as a guest, check the guest cart (localStorage key `bs_guest_cart`) or register/login to merge it into your account.

Extending this demo (next steps)

- Add a small Node/Express backend to persist data instead of localStorage.
- Add product management (create/edit/delete) in the admin UI.
- Integrate payments and order validation.

Credits

- Built as a lightweight front-end demo. Use and adapt freely for learning purposes.

