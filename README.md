# CriticalKit
Dungeons and Dragons and RPG themed online store.

## Shopify Theme Development & Deployment

This repository contains a Shopify theme optimized for D&D and RPG merchandise stores.

### Prerequisites

- Node.js 16+ 
- Shopify CLI
- Access to a Shopify store

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Shopify CLI (if not already installed):
   ```bash
   npm install -g @shopify/cli @shopify/theme
   ```

### Development

1. Start development server:
   ```bash
   npm run dev
   ```

2. Check theme for issues:
   ```bash
   npm run check
   ```

### Deployment

#### Manual Deployment

1. Push to development theme:
   ```bash
   npm run push
   ```

2. Deploy to live store:
   ```bash
   npm run deploy
   ```

#### Automated Deployment

The repository includes GitHub Actions for automated deployment:

- **Pull Requests**: Automatically deploys to development theme
- **Main Branch**: Automatically deploys to live store

#### Required Secrets

Configure these secrets in your GitHub repository settings:

- `SHOPIFY_CLI_PARTNERS_TOKEN`: Your Shopify Partners token
- `SHOPIFY_STORE`: Your store domain (e.g., `your-store.myshopify.com`)

### Theme Features

- D&D and RPG themed design
- Customizable colors and fonts
- Magical effects toggle
- Wishlist functionality
- Social media integration
- Newsletter signup
- Responsive design

### Configuration

Update `.shopify/config.json` with your store details before deployment. 
