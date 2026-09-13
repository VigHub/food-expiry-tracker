# 🥗 Smart Fridge - Food Expiry Tracker

[![Svelte 5](https://img.shields.io/badge/Svelte-5.0-orange?logo=svelte)](https://svelte.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare_D1-blue?logo=sqlite)](https://developers.cloudflare.com/d1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Smart Fridge** is an intuitive, privacy-first web application designed to track food inventory, minimize household food waste, and alert you before your groceries expire. 

Powered by **Svelte 5** and **Cloudflare D1**, it offers real-time cloud synchronization across mobile and desktop devices with built-in barcode scanning and password security.

---

## ✨ Highlights & Capabilities

### 📱 Modern Glassmorphism Experience
Built with a sleek, dark-mode native-like interface featuring smooth animations, responsive cards, and dynamic color-coded urgency badges.

### 📷 Smart Barcode Scanner (Open Food Facts Integration)
Point your mobile camera at any food barcode (EAN / UPC) or type the number manually. The app automatically fetches product titles, brands, categories, and cover images directly from the Open Food Facts global database.

### ☁️ Seamless Cloud Sync (Cloudflare D1)
Your inventory stays up-to-date across all your family phones, tablets, and computers powered by Cloudflare's serverless SQLite edge database.

### 🔒 Password-Protected Access
Keep your food inventory private with a built-in login screen using Web Crypto SHA-256 password hashing and secure HTTP-only session cookies.

### ⏱️ Visual Expiry Intelligence
- **Fresh**: Clear countdown display for products safely in date.
- **Expiring Soon**: Highlights products expiring within 3 days so you can plan meals.
- **Expired**: Instant alerts for items past their expiration date.

### 🔍 Instant Search & Smart Filtering
Quickly find items by name, brand, or category. Sort inventory by expiration date, alphabetical order, or date added.

### 💾 Backup & Data Portability
Full ownership of your data — export your entire food inventory to JSON at any time, or restore from previous backups.

---

## 🛠️ Built With

- **Framework**: [Svelte 5](https://svelte.dev) (Runes State Engine) & SvelteKit
- **Cloud Infrastructure**: Cloudflare Pages Functions & `@sveltejs/adapter-cloudflare`
- **Database**: Cloudflare D1 (Edge SQLite Database)
- **Security**: Web Crypto API (SHA-256 + Salt hashing), HTTP-Only Cookies
- **Barcode & Data**: `html5-qrcode` & Open Food Facts REST API

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
