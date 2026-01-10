// Simple client-side router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Handle initial load
        window.addEventListener('DOMContentLoaded', () => {
            this.handleRoute();
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                const href = link.getAttribute('href');
                this.navigate(href || route);
            }
        });
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(p => p);

        // Home route
        if (path === '/' || path === '') {
            if (this.routes['home']) {
                this.currentRoute = 'home';
                this.routes['home']();
            }
            return;
        }

        // Companies list route: /companies
        if (pathParts[0] === 'companies' && pathParts.length === 1) {
            if (this.routes['companies']) {
                this.currentRoute = 'companies';
                this.routes['companies']();
            }
            return;
        }

        // Company route: /company/:slug
        if (pathParts[0] === 'company' && pathParts[1]) {
            if (this.routes['company']) {
                this.currentRoute = 'company';
                this.routes['company'](pathParts[1]);
            }
            return;
        }

        // Products list route: /products
        if (pathParts[0] === 'products' && pathParts.length === 1) {
            if (this.routes['products']) {
                this.currentRoute = 'products';
                this.routes['products']();
            }
            return;
        }

        // Product route: /product/:slug
        if (pathParts[0] === 'product' && pathParts[1]) {
            if (this.routes['product']) {
                this.currentRoute = 'product';
                this.routes['product'](pathParts[1]);
            }
            return;
        }

        // 404 - redirect to home
        this.navigate('/');
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

// Create global router instance
const router = new Router();

