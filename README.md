# 📱 Echo Cart – Frontend (React Native + Expo)

This is the **mobile frontend** for **Echo Cart**, a smart shopping and food inventory app that helps users compare prices across suppliers, manage shopping lists, and track food expiration dates.

Built with **React Native** and powered by **Expo**, this app brings a smooth and intuitive experience to users on both iOS and Android.

---

## Features

- **Browse Products** from multiple suppliers
- **See Lowest Prices** automatically highlighted
- **Create & Manage Shopping Lists**
- **Share Lists** with friends for collaborative shopping
- **Fridge Page** to track purchased items
- **Set Expiration Dates** and get **reminders** when items are expiring or expired

---

## ⚙️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/)
- **Toolchain**: [Expo](https://expo.dev/)
- **Navigation**: React Navigation
- **State Management**: Context API / Redux (depending on your implementation)
- **API Communication**: Axios / Fetch
- **Notifications**: Expo Notifications API (for expiry reminders)

---

## Screens (Modules)

- `ProductListScreen` – shows all available products from different suppliers
- `ShoppingListScreen` – user's shopping list, with share options
- `FridgeScreen` – all purchased items with expiration dates
- `ProductDetailsScreen` – detailed product info and price comparison
- `SettingsScreen` – user preferences and notification settings
- `ShareScreen` – for managing and inviting friends to shared lists

---

## Installation

```bash
# Clone the repo
git clone https://github.com/nurzat04/EcoCartApp.git
cd echo-cart-frontend

# Install dependencies
npm install

# Start Expo
npm start
# or
expo start
