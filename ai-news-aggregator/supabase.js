// Supabase configuration
const SUPABASE_URL = 'https://exzkrdamofzmuuguadrh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nCcLus9un19eKMEKfLdZLQ_xgGZGr-Q';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Categories enum
const CATEGORIES = [
    'LLM',
    'Video Editing',
    'Image Editing',
    'Sound',
    'Research',
    'Development',
    'Web Browsing',
    'Automation',
    'Design Tools',
    'Security',
    'Business',
    'General'
];

// Post types enum
const POST_TYPES = [
    'News',
    'Product Launch',
    'Update',
    'Tutorial',
    'Benchmark',
    'Opinion',
    'General'
];

// Data fetching functions

/**
 * Fetch posts with pagination and filters
 */
async function fetchPosts(options = {}) {
    const {
        limit = 50,
        offset = 0,
        companyId = null,
        productId = null,
        category = null,
        postType = null
    } = options;

    // If filtering by company, first get all product IDs for that company
    let productIds = null;
    if (companyId && !productId) {
        const products = await fetchProductsByCompany(companyId);
        productIds = products.map(p => p.id);
        if (productIds.length === 0) {
            return []; // No products for this company, so no posts
        }
    }

    let query = supabase
        .from('posts')
        .select(`
            *,
            products!inner(
                id,
                slug,
                name,
                company_id,
                companies!inner(
                    id,
                    slug,
                    name,
                    logo_url,
                    summary
                )
            )
        `)
        .order('date', { ascending: false })
        .order('id', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply filters
    if (productId) {
        query = query.eq('product_id', productId);
    } else if (productIds && productIds.length > 0) {
        // Filter by company through product IDs
        query = query.in('product_id', productIds);
    }

    if (category) {
        query = query.eq('category', category);
    }

    if (postType) {
        query = query.eq('post_type', postType);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }

    // Transform data to ensure we use products.company_id as source of truth
    return data.map(post => ({
        ...post,
        company: post.products.companies,
        product: {
            id: post.products.id,
            slug: post.products.slug,
            name: post.products.name,
            company_id: post.products.company_id
        }
    }));
}

/**
 * Fetch all companies
 */
async function fetchCompanies() {
    const { data, error } = await supabase
        .from('companies')
        .select('id, slug, name, logo_url, summary')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch company by slug
 */
async function fetchCompanyBySlug(slug) {
    const { data, error } = await supabase
        .from('companies')
        .select('id, slug, name, logo_url, summary')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching company:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch all products for a company
 */
async function fetchProductsByCompany(companyId) {
    const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, company_id')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch all products
 */
async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, company_id')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch product by slug
 */
async function fetchProductBySlug(slug) {
    const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, company_id')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch company by id
 */
async function fetchCompanyById(id) {
    const { data, error } = await supabase
        .from('companies')
        .select('id, slug, name, logo_url, summary')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching company:', error);
        throw error;
    }

    return data;
}

