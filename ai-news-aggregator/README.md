# AI News Aggregator

A read-only client-side news aggregation website backed by Supabase, displaying AI-related news, product launches, updates, and more.

## Features

- **Home Feed**: Browse all posts with filtering by company, product, category, and post type
- **Company Pages**: View all posts from a specific company
- **Product Pages**: View all posts about a specific product
- **Filtering**: Filter posts by company, product, category, and post type
- **Pagination**: Load more posts with infinite scroll-style pagination
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. Open `index.html` in a web browser or serve it using a local web server
2. The application will automatically connect to Supabase using the configured credentials

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - All styling and responsive design
- `supabase.js` - Supabase client initialization and data fetching functions
- `router.js` - Client-side routing system
- `app.js` - Main application logic and UI rendering

## Data Rules

- All data is read-only (no writes to the database)
- Company and product names are always fetched from their respective tables
- Posts are ordered by date (descending), then by id (descending)
- Company ID is derived from products, not directly from posts

## Categories

- LLM
- Video Editing
- Image Editing
- Sound
- Research
- Development
- Web Browsing
- Automation
- Design Tools
- Security
- Business
- General

## Post Types

- News
- Product Launch
- Update
- Tutorial
- Benchmark
- Opinion
- General

## Usage

1. **Home Page**: Browse all posts, use filters to narrow down results
2. **Company Page**: Click on a company name to see all posts from that company
3. **Product Page**: Click on a product name to see all posts about that product
4. **Load More**: Click "Load More" to fetch additional posts

## Technical Details

- Uses Supabase JavaScript client (v2)
- Client-side only (no backend required)
- Row Level Security enabled (read-only access)
- No authentication required
- All filtering uses IDs internally (slugs only for routing)

