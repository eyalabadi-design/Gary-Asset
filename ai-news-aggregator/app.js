// Application state
const state = {the 
    posts: [],
    companies: [],
    products: [],
    filters: {
        companyId: null,
        productId: null,
        category: null,
        postType: null
    },
    pagination: {
        offset: 0,
        limit: 50,
        hasMore: true
    },
    currentPage: 'home',
    currentCompany: null,
    currentProduct: null,
    navigation: {
        companiesExpanded: false,
        productsExpanded: false,
        expandedCompanies: new Set() // Set of company IDs that are expanded
    }
};

// DOM elements
const elements = {
    content: document.getElementById('content'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    filtersSection: document.getElementById('filters-section'),
    companyFilter: document.getElementById('company-filter'),
    productFilter: document.getElementById('product-filter'),
    categoryFilter: document.getElementById('category-filter'),
    postTypeFilter: document.getElementById('post-type-filter'),
    clearFiltersBtn: document.getElementById('clear-filters'),
    loadMoreContainer: document.getElementById('load-more-container'),
    loadMoreBtn: document.getElementById('load-more'),
    navTree: document.getElementById('nav-tree'),
    headerContent: document.getElementById('header-content')
};

// Utility functions

function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showError(message) {
    elements.error.textContent = message;
    elements.error.classList.remove('hidden');
}

function hideError() {
    elements.error.classList.add('hidden');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getCategoryClass(category) {
    return `tag-category tag-${category.toLowerCase().replace(/\s+/g, '-')}`;
}

function getPostTypeClass(postType) {
    return `tag-type tag-${postType.toLowerCase().replace(/\s+/g, '-')}`;
}

// Render functions

function renderPostCard(post, options = {}) {
    const { showCompany = true, showProduct = true } = options;
    
    return `
        <article class="post-card">
            <div class="post-header">
                <h2 class="post-title">
                    <a href="${post.post_url}" target="_blank" rel="noopener noreferrer">
                        ${post.title}
                    </a>
                </h2>
                <div class="post-meta">
                    ${showCompany && post.company ? `
                        <a href="/company/${post.company.slug}" class="post-company" data-route="company">
                            ${post.company.name}
                        </a>
                    ` : ''}
                    ${showProduct && post.product ? `
                        <a href="/product/${post.product.slug}" class="post-product" data-route="product">
                            ${post.product.name}
                        </a>
                    ` : ''}
                </div>
            </div>
            <p class="post-summary">${post.summary || ''}</p>
            <div class="post-footer">
                <div class="post-tags">
                    ${post.category ? `<span class="tag ${getCategoryClass(post.category)}">${post.category}</span>` : ''}
                    ${post.post_type ? `<span class="tag ${getPostTypeClass(post.post_type)}">${post.post_type}</span>` : ''}
                </div>
                <time class="post-date" datetime="${post.date}">${formatDate(post.date)}</time>
            </div>
        </article>
    `;
}

function renderPosts(posts, options = {}) {
    if (posts.length === 0) {
        return '<div class="no-posts">No posts found.</div>';
    }
    
    return posts.map(post => renderPostCard(post, options)).join('');
}

function renderHeader() {
    // Re-fetch element in case DOM wasn't ready when script loaded
    const headerContentEl = document.getElementById('header-content') || elements.headerContent;
    
    if (!headerContentEl) {
        console.warn('Header content element not found. DOM might not be ready.');
        return;
    }
    
    let currentRoute = 'home';
    if (router && typeof router.getCurrentRoute === 'function') {
        currentRoute = router.getCurrentRoute();
    }
    
    console.log('renderHeader called for route:', currentRoute);
    
    let headerHtml = '';
    
    if (currentRoute === 'home') {
        // Feed header
        headerHtml = `
            <div class="header-feed">
                <h1 class="header-feed-title">Feed</h1>
            </div>
        `;
    } else if (currentRoute === 'company' && state.currentCompany) {
        // Company header with icon
        const iconHtml = state.currentCompany.logo_url 
            ? `<img src="${state.currentCompany.logo_url}" alt="${state.currentCompany.name}" class="header-company-icon" onerror="this.style.display='none'">`
            : '';
        headerHtml = `
            <div class="header-company">
                ${iconHtml}
                <h1 class="header-company-title">${state.currentCompany.name}</h1>
            </div>
        `;
    } else if (currentRoute === 'product' && state.currentProduct && state.currentCompany) {
        // Product header with "By [company]" link
        headerHtml = `
            <div class="header-product">
                <h1 class="header-product-title">${state.currentProduct.name}</h1>
                <a href="/company/${state.currentCompany.slug}" class="header-product-link" data-route="company">By ${state.currentCompany.name}</a>
            </div>
        `;
    } else if (currentRoute === 'companies') {
        // Companies list header
        headerHtml = `
            <div class="header-feed">
                <h1 class="header-feed-title">Companies</h1>
            </div>
        `;
    } else if (currentRoute === 'products') {
        // Products list header
        headerHtml = `
            <div class="header-feed">
                <h1 class="header-feed-title">Products</h1>
            </div>
        `;
    } else {
        // Default: Feed header
        headerHtml = `
            <div class="header-feed">
                <h1 class="header-feed-title">Feed</h1>
            </div>
        `;
    }
    
    headerContentEl.innerHTML = headerHtml;
    console.log('Header rendered for route:', currentRoute);
    console.log('Header HTML set:', headerHtml.substring(0, 100));
    
    // Force a reflow to ensure visibility
    headerContentEl.style.display = 'block';
}

function renderHomeFeed() {
    const postsHtml = renderPosts(state.posts, {
        showCompany: true,
        showProduct: true
    });
    
    elements.content.innerHTML = `
        <div class="posts-grid">
            ${postsHtml}
        </div>
    `;
    
    // Show/hide load more button
    if (state.pagination.hasMore) {
        elements.loadMoreContainer.classList.remove('hidden');
    } else {
        elements.loadMoreContainer.classList.add('hidden');
    }
}

function renderCompanyPage(company, products, posts) {
    const companyInfo = `
        <div class="page-header">
            ${company.logo_url ? `<img src="${company.logo_url}" alt="${company.name} logo" class="company-logo">` : ''}
            ${company.summary ? `<p class="page-summary">${company.summary}</p>` : ''}
        </div>
    `;
    
    const postsHtml = renderPosts(posts, {
        showCompany: false,
        showProduct: true
    });
    
    elements.content.innerHTML = `
        ${companyInfo}
        <div class="posts-grid">
            ${postsHtml}
        </div>
    `;
    
    // Hide filters and load more on company page
    elements.filtersSection.classList.add('hidden');
    elements.loadMoreContainer.classList.add('hidden');
    
    // Update header
    renderHeader();
}

function renderProductPage(product, company, posts) {
    const productInfo = `
        <div class="page-header">
        </div>
    `;
    
    const postsHtml = renderPosts(posts, {
        showCompany: false,
        showProduct: false
    });
    
    elements.content.innerHTML = `
        ${productInfo}
        <div class="posts-grid">
            ${postsHtml}
        </div>
    `;
    
    // Hide filters and load more on product page
    elements.filtersSection.classList.add('hidden');
    elements.loadMoreContainer.classList.add('hidden');
    
    // Update header
    renderHeader();
}

// Navigation tree rendering functions

function getNavItemState(itemType, itemId = null) {
    const currentRoute = router.getCurrentRoute();
    const itemIdNum = itemId ? parseInt(itemId) : null;
    const isSelected = 
        (itemType === 'feed' && currentRoute === 'home') ||
        (itemType === 'companies' && currentRoute === 'companies') ||
        (itemType === 'products' && currentRoute === 'products') ||
        (itemType === 'company' && currentRoute === 'company' && state.currentCompany?.id === itemIdNum) ||
        (itemType === 'product' && currentRoute === 'product' && state.currentProduct?.id === itemIdNum);
    
    const isSubSelected = 
        (itemType === 'companies' && state.navigation.companiesExpanded && !isSelected) ||
        (itemType === 'products' && state.navigation.productsExpanded && !isSelected) ||
        (itemType === 'company' && itemIdNum && state.navigation.expandedCompanies.has(itemIdNum) && !isSelected);
    
    return { isSelected, isSubSelected };
}

function renderNavItem(itemType, label, iconPath, href, itemId = null, hasChildren = false, isExpanded = false, indentLevel = 0) {
    const { isSelected, isSubSelected } = getNavItemState(itemType, itemId);
    const classes = ['nav-item'];
    if (isSelected) classes.push('nav-item-selected');
    if (isSubSelected) classes.push('nav-item-sub-selected');
    if (hasChildren && isExpanded) classes.push('nav-folder-expanded');
    if (indentLevel === 1) classes.push('nav-item-indented');
    if (indentLevel === 2) classes.push('nav-item-indented-2');
    
    const chevronVisible = hasChildren ? '' : 'nav-item-chevron-hidden';
    const chevronRotated = isExpanded ? 'nav-item-expanded' : '';
    
    return `
        <div class="${classes.join(' ')}" data-item-type="${itemType}" data-item-id="${itemId || ''}" data-href="${href || ''}">
            <div class="nav-item-label">
                <div class="nav-item-icon">
                    <img src="${iconPath}" alt="" onerror="this.src='Folder_default.svg'">
                </div>
                <span class="nav-item-text">${label}</span>
            </div>
            ${hasChildren ? `
                <div class="nav-item-chevron ${chevronVisible} ${chevronRotated}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.73442 11.8891L3.11014 7.26908C2.96329 7.12116 2.96329 6.88198 3.11014 6.73407L3.72879 6.11094C3.87564 5.96302 4.11311 5.96302 4.25996 6.11094L8 9.84028L11.74 6.11094C11.8869 5.96302 12.1244 5.96302 12.2712 6.11094L12.8899 6.73407C13.0367 6.88198 13.0367 7.12116 12.8899 7.26908L8.26558 11.8891C8.11873 12.037 7.88127 12.037 7.73442 11.8891Z" fill="currentColor"/>
                    </svg>
                </div>
            ` : ''}
        </div>
    `;
}

function renderNavigationTree() {
    if (!elements.navTree) {
        console.error('nav-tree element not found!');
        return;
    }
    
    const companiesExpanded = state.navigation.companiesExpanded;
    const productsExpanded = state.navigation.productsExpanded;
    
    let html = '';
    
    // Feed - always show
    html += renderNavItem('feed', 'Feed', 'Feed_Icon.svg', '/', null, false, false, 0);
    
    // Companies folder - always show, even if empty
    html += renderNavItem('companies', 'Companies', companiesExpanded ? 'Folder_open.svg' : 'Folder_default.svg', '/companies', null, true, companiesExpanded, 0);
    
    if (companiesExpanded && state.companies.length > 0) {
        html += '<div class="nav-folder-children">';
        state.companies.forEach(company => {
            const companyExpanded = state.navigation.expandedCompanies.has(company.id);
            const companyProducts = state.products.filter(p => p.company_id === company.id);
            const hasProducts = companyProducts.length > 0;
            
            html += renderNavItem('company', company.name, company.logo_url || 'Folder_default.svg', `/company/${company.slug}`, company.id, hasProducts, companyExpanded, 1);
            
            if (companyExpanded && hasProducts) {
                html += '<div class="nav-folder-children">';
                companyProducts.forEach(product => {
                    html += renderNavItem('product', product.name, 'Folder_sub.svg', `/product/${product.slug}`, product.id, false, false, 2);
                });
                html += '</div>';
            }
        });
        html += '</div>';
    }
    
    // Products folder - always show, even if empty
    html += renderNavItem('products', 'Products', productsExpanded ? 'Folder_open.svg' : 'Folder_default.svg', '/products', null, true, productsExpanded, 0);
    
    elements.navTree.innerHTML = html;
    console.log('Navigation tree rendered with', html.length, 'characters');
    
    // Attach event listeners
    attachNavigationListeners();
}

function attachNavigationListeners() {
    if (!elements.navTree) return;
    
    // Remove existing listeners by cloning
    const newTree = elements.navTree.cloneNode(true);
    elements.navTree.parentNode.replaceChild(newTree, elements.navTree);
    elements.navTree = newTree;
    
    elements.navTree.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (!navItem) return;
        
        const itemType = navItem.getAttribute('data-item-type');
        const itemId = navItem.getAttribute('data-item-id');
        const href = navItem.getAttribute('data-href');
        const chevron = navItem.querySelector('.nav-item-chevron');
        const clickedChevron = e.target.closest('.nav-item-chevron');
        
        // If chevron was clicked, only toggle expansion
        if (clickedChevron && chevron && !chevron.classList.contains('nav-item-chevron-hidden')) {
            e.stopPropagation();
            e.preventDefault();
            toggleFolderExpansion(itemType, itemId);
            return;
        }
        
        // Otherwise, navigate (but auto-expand if it's a folder with children)
        if (href) {
            // Auto-expand folders when navigating to them
            if (itemType === 'companies' || itemType === 'products') {
                toggleFolderExpansion(itemType, itemId);
            } else if (itemType === 'company') {
                // Auto-expand company when navigating to it
                const companyId = parseInt(itemId);
                if (!state.navigation.expandedCompanies.has(companyId)) {
                    state.navigation.expandedCompanies.add(companyId);
                }
                if (!state.navigation.companiesExpanded) {
                    state.navigation.companiesExpanded = true;
                }
                renderNavigationTree();
            }
            router.navigate(href);
        }
    });
}

function toggleFolderExpansion(itemType, itemId) {
    if (itemType === 'companies') {
        state.navigation.companiesExpanded = !state.navigation.companiesExpanded;
    } else if (itemType === 'products') {
        state.navigation.productsExpanded = !state.navigation.productsExpanded;
    } else if (itemType === 'company' && itemId) {
        if (state.navigation.expandedCompanies.has(parseInt(itemId))) {
            state.navigation.expandedCompanies.delete(parseInt(itemId));
        } else {
            state.navigation.expandedCompanies.add(parseInt(itemId));
        }
    }
    renderNavigationTree();
}

function autoExpandForRoute() {
    const currentRoute = router.getCurrentRoute();
    
    // Reset expansion state (but preserve manual expansions if needed)
    if (currentRoute === 'home') {
        state.navigation.companiesExpanded = false;
        state.navigation.productsExpanded = false;
        state.navigation.expandedCompanies.clear();
    } else if (currentRoute === 'companies') {
        state.navigation.companiesExpanded = true;
        state.navigation.productsExpanded = false;
        state.navigation.expandedCompanies.clear();
    } else if (currentRoute === 'products') {
        state.navigation.companiesExpanded = false;
        state.navigation.productsExpanded = true;
        state.navigation.expandedCompanies.clear();
    } else if (currentRoute === 'company' && state.currentCompany) {
        // Auto-expand Companies folder and the specific company
        state.navigation.companiesExpanded = true;
        state.navigation.productsExpanded = false;
        state.navigation.expandedCompanies.clear();
        state.navigation.expandedCompanies.add(state.currentCompany.id);
    } else if (currentRoute === 'product' && state.currentProduct && state.currentCompany) {
        // Auto-expand Companies folder, company, and select product
        state.navigation.companiesExpanded = true;
        state.navigation.productsExpanded = false;
        state.navigation.expandedCompanies.clear();
        state.navigation.expandedCompanies.add(state.currentCompany.id);
    }
    
    renderNavigationTree();
}

// Filter functions

async function populateFilters() {
    try {
        // Populate company filter
        const companies = await fetchCompanies();
        state.companies = companies;
        elements.companyFilter.innerHTML = '<option value="">All Companies</option>' +
            companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        // Populate product filter
        const products = await fetchProducts();
        state.products = products;
        elements.productFilter.innerHTML = '<option value="">All Products</option>' +
            products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        // Populate category filter
        elements.categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');

        // Populate post type filter
        elements.postTypeFilter.innerHTML = '<option value="">All Types</option>' +
            POST_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');

        // Render navigation tree after data is loaded
        renderNavigationTree();

    } catch (error) {
        console.error('Error populating filters:', error);
        showError('Failed to load filters.');
    }
}

function applyFilters() {
    state.filters.companyId = elements.companyFilter.value || null;
    state.filters.productId = elements.productFilter.value || null;
    state.filters.category = elements.categoryFilter.value || null;
    state.filters.postType = elements.postTypeFilter.value || null;
    
    // Reset pagination when filters change
    state.pagination.offset = 0;
    state.posts = [];
    
    loadPosts();
}

// Data loading functions

async function loadPosts() {
    showLoading();
    hideError();
    
    try {
        const posts = await fetchPosts({
            limit: state.pagination.limit,
            offset: state.pagination.offset,
            companyId: state.filters.companyId,
            productId: state.filters.productId,
            category: state.filters.category,
            postType: state.filters.postType
        });
        
        if (state.pagination.offset === 0) {
            state.posts = posts;
        } else {
            state.posts = [...state.posts, ...posts];
        }
        
        state.pagination.hasMore = posts.length === state.pagination.limit;
        state.pagination.offset += posts.length;
        
        if (state.currentPage === 'home') {
            renderHomeFeed();
        }
        
    } catch (error) {
        console.error('Error loading posts:', error);
        showError('Failed to load posts. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadMorePosts() {
    await loadPosts();
}

async function loadCompanyPage(slug) {
    showLoading();
    hideError();
    
    try {
        const company = await fetchCompanyBySlug(slug);
        state.currentCompany = company;
        
        const products = await fetchProductsByCompany(company.id);
        
        // Fetch posts for all products of this company
        const productIds = products.map(p => p.id);
        const allPosts = [];
        let offset = 0;
        let hasMore = true;
        
        while (hasMore) {
            const posts = await fetchPosts({
                limit: 50,
                offset: offset,
                companyId: company.id
            });
            
            allPosts.push(...posts);
            hasMore = posts.length === 50;
            offset += 50;
        }
        
        renderCompanyPage(company, products, allPosts);
        renderHeader();
        autoExpandForRoute();
        
    } catch (error) {
        console.error('Error loading company page:', error);
        showError('Failed to load company page. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadProductPage(slug) {
    showLoading();
    hideError();
    
    try {
        const product = await fetchProductBySlug(slug);
        state.currentProduct = product;
        
        const company = await fetchCompanyById(product.company_id);
        state.currentCompany = company;
        
        // Fetch all posts for this product
        const allPosts = [];
        let offset = 0;
        let hasMore = true;
        
        while (hasMore) {
            const posts = await fetchPosts({
                limit: 50,
                offset: offset,
                productId: product.id
            });
            
            allPosts.push(...posts);
            hasMore = posts.length === 50;
            offset += 50;
        }
        
        renderProductPage(product, company, allPosts);
        renderHeader();
        autoExpandForRoute();
        
    } catch (error) {
        console.error('Error loading product page:', error);
        showError('Failed to load product page. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadCompaniesPage() {
    showLoading();
    hideError();
    
    try {
        const companies = await fetchCompanies();
        state.companies = companies;
        
        // Render companies list page
        const companiesHtml = companies.map(company => `
            <div class="company-card" style="background-color: var(--bg-color); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: var(--shadow); margin-bottom: var(--spacing-md);">
                <h2><a href="/company/${company.slug}" data-route="company">${company.name}</a></h2>
                ${company.summary ? `<p>${company.summary}</p>` : ''}
            </div>
        `).join('');
        
        elements.content.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">All Companies</h1>
            </div>
            <div class="companies-list">
                ${companiesHtml}
            </div>
        `;
        
        elements.filtersSection.classList.add('hidden');
        elements.loadMoreContainer.classList.add('hidden');
        renderHeader();
        autoExpandForRoute();
        
    } catch (error) {
        console.error('Error loading companies page:', error);
        showError('Failed to load companies page. Please try again.');
    } finally {
        hideLoading();
    }
}

async function loadProductsPage() {
    showLoading();
    hideError();
    
    try {
        const products = await fetchProducts();
        state.products = products;
        
        // Group products by company
        const productsByCompany = {};
        products.forEach(product => {
            if (!productsByCompany[product.company_id]) {
                productsByCompany[product.company_id] = [];
            }
            productsByCompany[product.company_id].push(product);
        });
        
        // Fetch companies for display
        const companies = await fetchCompanies();
        const companyMap = {};
        companies.forEach(c => companyMap[c.id] = c);
        
        // Render products list page
        let productsHtml = '';
        companies.forEach(company => {
            const companyProducts = productsByCompany[company.id] || [];
            if (companyProducts.length > 0) {
                productsHtml += `
                    <div class="company-section" style="margin-bottom: var(--spacing-lg);">
                        <h2>${company.name}</h2>
                        <div class="products-grid" style="display: grid; gap: var(--spacing-md);">
                            ${companyProducts.map(product => `
                                <div class="product-card" style="background-color: var(--bg-color); padding: var(--spacing-md); border-radius: var(--border-radius); box-shadow: var(--shadow);">
                                    <h3><a href="/product/${product.slug}" data-route="product">${product.name}</a></h3>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        elements.content.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">All Products</h1>
            </div>
            <div class="products-list">
                ${productsHtml}
            </div>
        `;
        
        elements.filtersSection.classList.add('hidden');
        elements.loadMoreContainer.classList.add('hidden');
        renderHeader();
        autoExpandForRoute();
        
    } catch (error) {
        console.error('Error loading products page:', error);
        showError('Failed to load products page. Please try again.');
    } finally {
        hideLoading();
    }
}

// Event listeners

elements.companyFilter.addEventListener('change', applyFilters);
elements.productFilter.addEventListener('change', applyFilters);
elements.categoryFilter.addEventListener('change', applyFilters);
elements.postTypeFilter.addEventListener('change', applyFilters);

elements.clearFiltersBtn.addEventListener('click', () => {
    elements.companyFilter.value = '';
    elements.productFilter.value = '';
    elements.categoryFilter.value = '';
    elements.postTypeFilter.value = '';
    applyFilters();
});

elements.loadMoreBtn.addEventListener('click', loadMorePosts);

// Router setup

router.register('home', () => {
    state.currentPage = 'home';
    state.currentCompany = null;
    state.currentProduct = null;
    elements.filtersSection.classList.remove('hidden');
    renderHeader();
    loadPosts();
    setTimeout(() => autoExpandForRoute(), 0);
});

router.register('companies', () => {
    state.currentPage = 'companies';
    state.currentCompany = null;
    state.currentProduct = null;
    loadCompaniesPage();
});

router.register('company', (slug) => {
    state.currentPage = 'company';
    state.currentProduct = null;
    loadCompanyPage(slug);
});

router.register('products', () => {
    state.currentPage = 'products';
    state.currentCompany = null;
    state.currentProduct = null;
    loadProductsPage();
});

router.register('product', (slug) => {
    state.currentPage = 'product';
    loadProductPage(slug);
});

// Initialize app
async function init() {
    console.log('Initializing app...');
    
    // Re-fetch DOM elements in case they weren't ready when script loaded
    elements.headerContent = document.getElementById('header-content');
    elements.navTree = document.getElementById('nav-tree');
    
    console.log('Header content element:', elements.headerContent);
    console.log('Nav-tree element:', elements.navTree);
    
    // Render header immediately with default "Feed"
    if (elements.headerContent) {
        console.log('Calling renderHeader from init...');
        renderHeader();
    } else {
        console.error('Header content element not found in init!');
    }
    
    // Render navigation tree immediately (will show Feed, Companies, Products)
    renderNavigationTree();
    await populateFilters();
    // Re-render after data loads to show companies/products
    renderNavigationTree();
    router.handleRoute();
    // Ensure header is rendered after route handling
    renderHeader();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already ready
    init();
}

