import bcrypt from 'bcryptjs';
import { query, pool } from './pool.js';

async function seed() {
  console.log('Seeding database...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminResult = await client.query(`
      INSERT INTO users (phone, password_hash, full_name, role, phone_verified, email_verified)
      VALUES ('9999999999', $1, 'Admin User', 'admin', true, true)
      ON CONFLICT (phone) DO UPDATE SET password_hash = $1, role = 'admin'
      RETURNING id
    `, [passwordHash]);
    
    const adminId = adminResult.rows[0].id;
    console.log('Admin user created/updated:', adminId);
    
    // Create categories
    const categories = [
      { name: 'Rice & Grains', slug: 'rice-grains', icon: '🌾', display_order: 1 },
      { name: 'Dal & Pulses', slug: 'dal-pulses', icon: '🫘', display_order: 2 },
      { name: 'Flour', slug: 'flour', icon: '🌾', display_order: 3 },
      { name: 'Oil & Ghee', slug: 'oil-ghee', icon: '🫒', display_order: 4 },
      { name: 'Spices', slug: 'spices', icon: '🌶️', display_order: 5 },
      { name: 'Biscuits', slug: 'biscuits', icon: '🍪', display_order: 6 },
      { name: 'Snacks', slug: 'snacks', icon: '🍿', display_order: 7 },
      { name: 'Beverages', slug: 'beverages', icon: '🥤', display_order: 8 },
      { name: 'Dairy', slug: 'dairy', icon: '🥛', display_order: 9 },
      { name: 'Bread', slug: 'bread', icon: '🍞', display_order: 10 },
      { name: 'Fruits', slug: 'fruits', icon: '🍎', display_order: 11 },
      { name: 'Vegetables', slug: 'vegetables', icon: '🥕', display_order: 12 },
      { name: 'Personal Care', slug: 'personal-care', icon: '🧴', display_order: 13 },
      { name: 'Household Items', slug: 'household', icon: '🏠', display_order: 14 },
      { name: 'Cleaning Products', slug: 'cleaning', icon: '🧽', display_order: 15 },
    ];
    
    const categoryIds: Record<string, string> = {};
    
    for (const cat of categories) {
      const result = await client.query(`
        INSERT INTO categories (name, slug, icon, display_order, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (slug) DO UPDATE SET name = $1, icon = $3, display_order = $4
        RETURNING id
      `, [cat.name, cat.slug, cat.icon, cat.display_order]);
      categoryIds[cat.slug] = result.rows[0].id;
    }
    
    console.log('Categories created:', Object.keys(categoryIds).length);
    
    // Create sample products
    const products = [
      // Rice & Grains
      { category: 'rice-grains', name: 'Basmati Rice Premium', slug: 'basmati-rice-premium', description: 'Long grain premium basmati rice', selling_price: 80, mrp_price: 95, unit: 'kg', stock: 100, min_qty: 1, max_qty: 25, brand: 'India Gate' },
      { category: 'rice-grains', name: 'Sona Masoori Rice', slug: 'sona-masoori-rice', description: 'Medium grain rice for daily cooking', selling_price: 55, mrp_price: 65, unit: 'kg', stock: 150, min_qty: 1, max_qty: 25, brand: 'Fortune' },
      { category: 'rice-grains', name: 'Brown Rice Organic', slug: 'brown-rice-organic', description: 'Healthy organic brown rice', selling_price: 120, mrp_price: 140, unit: 'kg', stock: 50, min_qty: 0.5, max_qty: 10, brand: '24 Mantra' },
      
      // Dal & Pulses
      { category: 'dal-pulses', name: 'Toor Dal', slug: 'toor-dal', description: 'Split pigeon peas', selling_price: 110, mrp_price: 130, unit: 'kg', stock: 80, min_qty: 0.5, max_qty: 10, brand: 'Tata' },
      { category: 'dal-pulses', name: 'Moong Dal', slug: 'moong-dal', description: 'Split green gram', selling_price: 100, mrp_price: 115, unit: 'kg', stock: 90, min_qty: 0.5, max_qty: 10, brand: 'Tata' },
      { category: 'dal-pulses', name: 'Chana Dal', slug: 'chana-dal', description: 'Split chickpeas', selling_price: 75, mrp_price: 85, unit: 'kg', stock: 70, min_qty: 0.5, max_qty: 10, brand: 'Fortune' },
      { category: 'dal-pulses', name: 'Urad Dal', slug: 'urad-dal', description: 'Split black gram', selling_price: 120, mrp_price: 140, unit: 'kg', stock: 60, min_qty: 0.5, max_qty: 10, brand: 'Tata' },
      { category: 'dal-pulses', name: 'Rajma Red', slug: 'rajma-red', description: 'Red kidney beans', selling_price: 130, mrp_price: 150, unit: 'kg', stock: 40, min_qty: 0.5, max_qty: 5, brand: 'Fortune' },
      
      // Flour
      { category: 'flour', name: 'Whole Wheat Atta', slug: 'whole-wheat-atta', description: 'Freshly ground whole wheat flour', selling_price: 45, mrp_price: 52, unit: 'kg', stock: 200, min_qty: 1, max_qty: 20, brand: 'Aashirvaad' },
      { category: 'flour', name: 'Multigrain Atta', slug: 'multigrain-atta', description: 'Healthy multigrain flour blend', selling_price: 55, mrp_price: 65, unit: 'kg', stock: 100, min_qty: 1, max_qty: 10, brand: 'Aashirvaad' },
      { category: 'flour', name: 'Besan Gram Flour', slug: 'besan-gram-flour', description: 'Chickpea flour for cooking', selling_price: 85, mrp_price: 95, unit: 'kg', stock: 80, min_qty: 0.5, max_qty: 5, brand: 'Fortune' },
      { category: 'flour', name: 'Maida Refined Flour', slug: 'maida-refined-flour', description: 'All-purpose refined flour', selling_price: 38, mrp_price: 45, unit: 'kg', stock: 120, min_qty: 1, max_qty: 10, brand: 'Pillsbury' },
      
      // Oil & Ghee
      { category: 'oil-ghee', name: 'Sunflower Oil', slug: 'sunflower-oil', description: 'Refined sunflower cooking oil', selling_price: 140, mrp_price: 160, unit: 'liter', stock: 100, min_qty: 1, max_qty: 5, brand: 'Fortune' },
      { category: 'oil-ghee', name: 'Mustard Oil', slug: 'mustard-oil', description: 'Cold pressed mustard oil', selling_price: 160, mrp_price: 180, unit: 'liter', stock: 80, min_qty: 1, max_qty: 5, brand: 'Fortune' },
      { category: 'oil-ghee', name: 'Pure Cow Ghee', slug: 'pure-cow-ghee', description: 'Traditional pure cow ghee', selling_price: 550, mrp_price: 620, unit: 'kg', stock: 30, min_qty: 0.5, max_qty: 2, brand: 'Amul' },
      { category: 'oil-ghee', name: 'Coconut Oil', slug: 'coconut-oil', description: 'Virgin coconut oil', selling_price: 320, mrp_price: 360, unit: 'liter', stock: 40, min_qty: 0.5, max_qty: 2, brand: 'Parachute' },
      
      // Spices
      { category: 'spices', name: 'Turmeric Powder', slug: 'turmeric-powder', description: 'Pure turmeric powder', selling_price: 180, mrp_price: 210, unit: 'kg', stock: 100, min_qty: 0.1, max_qty: 1, brand: 'Everest' },
      { category: 'spices', name: 'Red Chili Powder', slug: 'red-chili-powder', description: 'Spicy red chili powder', selling_price: 220, mrp_price: 250, unit: 'kg', stock: 80, min_qty: 0.1, max_qty: 1, brand: 'Everest' },
      { category: 'spices', name: 'Coriander Powder', slug: 'coriander-powder', description: 'Fresh coriander powder', selling_price: 160, mrp_price: 180, unit: 'kg', stock: 90, min_qty: 0.1, max_qty: 1, brand: 'Everest' },
      { category: 'spices', name: 'Garam Masala', slug: 'garam-masala', description: 'Aromatic spice blend', selling_price: 280, mrp_price: 320, unit: 'kg', stock: 60, min_qty: 0.05, max_qty: 0.5, brand: 'MDH' },
      { category: 'spices', name: 'Cumin Seeds', slug: 'cumin-seeds', description: 'Whole cumin seeds', selling_price: 250, mrp_price: 280, unit: 'kg', stock: 70, min_qty: 0.1, max_qty: 1, brand: 'Tata' },
      
      // Biscuits
      { category: 'biscuits', name: 'Parle-G Biscuits', slug: 'parle-g-biscuits', description: 'Classic glucose biscuits', selling_price: 10, mrp_price: 10, unit: 'packet', stock: 500, min_qty: 1, max_qty: 50, brand: 'Parle' },
      { category: 'biscuits', name: 'Bourbon Biscuits', slug: 'bourbon-biscuits', description: 'Chocolate cream biscuits', selling_price: 30, mrp_price: 35, unit: 'packet', stock: 200, min_qty: 1, max_qty: 20, brand: 'Britannia' },
      { category: 'biscuits', name: 'Marie Gold Biscuits', slug: 'marie-gold-biscuits', description: 'Light and crispy biscuits', selling_price: 25, mrp_price: 30, unit: 'packet', stock: 300, min_qty: 1, max_qty: 30, brand: 'Britannia' },
      { category: 'biscuits', name: 'Hide & Seek', slug: 'hide-and-seek', description: 'Chocolate chip cookies', selling_price: 35, mrp_price: 40, unit: 'packet', stock: 150, min_qty: 1, max_qty: 15, brand: 'Parle' },
      
      // Snacks
      { category: 'snacks', name: 'Lays Chips Classic', slug: 'lays-chips-classic', description: 'Classic salted potato chips', selling_price: 20, mrp_price: 20, unit: 'packet', stock: 200, min_qty: 1, max_qty: 20, brand: 'Lays' },
      { category: 'snacks', name: 'Kurkure Masala', slug: 'kurkure-masala', description: 'Spicy crunchy snacks', selling_price: 15, mrp_price: 15, unit: 'packet', stock: 250, min_qty: 1, max_qty: 30, brand: 'Kurkure' },
      { category: 'snacks', name: 'Haldiram Bhujia', slug: 'haldiram-bhujia', description: 'Traditional Indian snack', selling_price: 45, mrp_price: 50, unit: 'packet', stock: 100, min_qty: 1, max_qty: 10, brand: 'Haldiram' },
      
      // Beverages
      { category: 'beverages', name: 'Coca Cola 750ml', slug: 'coca-cola-750ml', description: 'Refreshing cola drink', selling_price: 40, mrp_price: 40, unit: 'bottle', stock: 150, min_qty: 1, max_qty: 12, brand: 'Coca Cola' },
      { category: 'beverages', name: 'Sprite 750ml', slug: 'sprite-750ml', description: 'Lemon-lime soda', selling_price: 40, mrp_price: 40, unit: 'bottle', stock: 150, min_qty: 1, max_qty: 12, brand: 'Sprite' },
      { category: 'beverages', name: 'Real Fruit Juice 1L', slug: 'real-fruit-juice-1l', description: 'Mixed fruit juice', selling_price: 95, mrp_price: 110, unit: 'bottle', stock: 80, min_qty: 1, max_qty: 6, brand: 'Real' },
      { category: 'beverages', name: 'Tata Tea Premium', slug: 'tata-tea-premium', description: 'Premium tea leaves', selling_price: 280, mrp_price: 320, unit: 'kg', stock: 50, min_qty: 0.25, max_qty: 2, brand: 'Tata' },
      { category: 'beverages', name: 'Nescafe Classic Coffee', slug: 'nescafe-classic-coffee', description: 'Instant coffee powder', selling_price: 380, mrp_price: 420, unit: 'jar', stock: 40, min_qty: 0.05, max_qty: 1, brand: 'Nescafe' },
      
      // Dairy
      { category: 'dairy', name: 'Amul Milk 500ml', slug: 'amul-milk-500ml', description: 'Fresh toned milk', selling_price: 28, mrp_price: 28, unit: 'packet', stock: 200, min_qty: 1, max_qty: 20, brand: 'Amul' },
      { category: 'dairy', name: 'Amul Butter 100g', slug: 'amul-butter-100g', description: 'Salted butter', selling_price: 52, mrp_price: 55, unit: 'packet', stock: 100, min_qty: 1, max_qty: 10, brand: 'Amul' },
      { category: 'dairy', name: 'Amul Cheese Slices', slug: 'amul-cheese-slices', description: 'Processed cheese slices', selling_price: 125, mrp_price: 140, unit: 'packet', stock: 80, min_qty: 1, max_qty: 10, brand: 'Amul' },
      { category: 'dairy', name: 'Mother Dairy Curd 400g', slug: 'mother-dairy-curd-400g', description: 'Fresh dahi', selling_price: 50, mrp_price: 55, unit: 'packet', stock: 100, min_qty: 1, max_qty: 10, brand: 'Mother Dairy' },
      
      // Bread
      { category: 'bread', name: 'Brown Bread 400g', slug: 'brown-bread-400g', description: 'Whole wheat brown bread', selling_price: 35, mrp_price: 40, unit: 'loaf', stock: 50, min_qty: 1, max_qty: 5, brand: 'Modern' },
      { category: 'bread', name: 'White Bread 400g', slug: 'white-bread-400g', description: 'Classic white bread', selling_price: 30, mrp_price: 35, unit: 'loaf', stock: 60, min_qty: 1, max_qty: 5, brand: 'Modern' },
      { category: 'bread', name: 'Multigrain Bread', slug: 'multigrain-bread', description: 'Healthy multigrain bread', selling_price: 45, mrp_price: 50, unit: 'loaf', stock: 40, min_qty: 1, max_qty: 5, brand: 'Modern' },
      
      // Fruits
      { category: 'fruits', name: 'Banana (Dozen)', slug: 'banana-dozen', description: 'Fresh ripe bananas', selling_price: 60, mrp_price: 70, unit: 'dozen', stock: 100, min_qty: 1, max_qty: 5, brand: 'Fresh' },
      { category: 'fruits', name: 'Apple Red (1kg)', slug: 'apple-red-1kg', description: 'Premium red apples', selling_price: 180, mrp_price: 220, unit: 'kg', stock: 50, min_qty: 0.5, max_qty: 3, brand: 'Fresh' },
      { category: 'fruits', name: 'Orange (1kg)', slug: 'orange-1kg', description: 'Sweet oranges', selling_price: 120, mrp_price: 150, unit: 'kg', stock: 60, min_qty: 0.5, max_qty: 3, brand: 'Fresh' },
      { category: 'fruits', name: 'Mango Alphonso (1kg)', slug: 'mango-alphonso-1kg', description: 'King of mangoes', selling_price: 800, mrp_price: 950, unit: 'kg', stock: 20, min_qty: 0.5, max_qty: 2, brand: 'Fresh' },
      
      // Vegetables
      { category: 'vegetables', name: 'Onion (1kg)', slug: 'onion-1kg', description: 'Fresh onions', selling_price: 35, mrp_price: 45, unit: 'kg', stock: 200, min_qty: 0.5, max_qty: 10, brand: 'Fresh' },
      { category: 'vegetables', name: 'Potato (1kg)', slug: 'potato-1kg', description: 'Fresh potatoes', selling_price: 25, mrp_price: 30, unit: 'kg', stock: 200, min_qty: 0.5, max_qty: 10, brand: 'Fresh' },
      { category: 'vegetables', name: 'Tomato (1kg)', slug: 'tomato-1kg', description: 'Fresh red tomatoes', selling_price: 40, mrp_price: 50, unit: 'kg', stock: 150, min_qty: 0.5, max_qty: 5, brand: 'Fresh' },
      { category: 'vegetables', name: 'Spinach Bunch', slug: 'spinach-bunch', description: 'Fresh green spinach', selling_price: 30, mrp_price: 35, unit: 'bunch', stock: 80, min_qty: 1, max_qty: 5, brand: 'Fresh' },
      { category: 'vegetables', name: 'Carrot (1kg)', slug: 'carrot-1kg', description: 'Fresh carrots', selling_price: 50, mrp_price: 60, unit: 'kg', stock: 100, min_qty: 0.5, max_qty: 5, brand: 'Fresh' },
      
      // Personal Care
      { category: 'personal-care', name: 'Dove Soap 100g', slug: 'dove-soap-100g', description: 'Moisturizing beauty bar', selling_price: 45, mrp_price: 50, unit: 'piece', stock: 100, min_qty: 1, max_qty: 10, brand: 'Dove' },
      { category: 'personal-care', name: 'Colgate Toothpaste 100g', slug: 'colgate-toothpaste-100g', description: 'Strong teeth toothpaste', selling_price: 55, mrp_price: 60, unit: 'tube', stock: 150, min_qty: 1, max_qty: 10, brand: 'Colgate' },
      { category: 'personal-care', name: 'Dettol Handwash 200ml', slug: 'dettol-handwash-200ml', description: 'Antibacterial handwash', selling_price: 85, mrp_price: 95, unit: 'bottle', stock: 80, min_qty: 1, max_qty: 5, brand: 'Dettol' },
      { category: 'personal-care', name: 'Clinic Plus Shampoo 180ml', slug: 'clinic-plus-shampoo-180ml', description: 'Strong and long hair shampoo', selling_price: 95, mrp_price: 110, unit: 'bottle', stock: 100, min_qty: 1, max_qty: 5, brand: 'Clinic Plus' },
      
      // Household Items
      { category: 'household', name: 'Garbage Bags Large (10 pcs)', slug: 'garbage-bags-large-10pcs', description: 'Heavy duty garbage bags', selling_price: 60, mrp_price: 70, unit: 'pack', stock: 100, min_qty: 1, max_qty: 10, brand: 'HomeMate' },
      { category: 'household', name: 'Aluminium Foil 9m', slug: 'aluminium-foil-9m', description: 'Food wrapping foil', selling_price: 85, mrp_price: 100, unit: 'roll', stock: 80, min_qty: 1, max_qty: 5, brand: 'HomeMate' },
      { category: 'household', name: 'Cling Film 20m', slug: 'cling-film-20m', description: 'Food wrap cling film', selling_price: 75, mrp_price: 90, unit: 'roll', stock: 80, min_qty: 1, max_qty: 5, brand: 'HomeMate' },
      
      // Cleaning Products
      { category: 'cleaning', name: 'Lizol Floor Cleaner 975ml', slug: 'lizol-floor-cleaner-975ml', description: 'Disinfectant floor cleaner', selling_price: 185, mrp_price: 210, unit: 'bottle', stock: 60, min_qty: 1, max_qty: 5, brand: 'Lizol' },
      { category: 'cleaning', name: 'Harpic Toilet Cleaner 500ml', slug: 'harpic-toilet-cleaner-500ml', description: 'Toilet bowl cleaner', selling_price: 115, mrp_price: 130, unit: 'bottle', stock: 80, min_qty: 1, max_qty: 5, brand: 'Harpic' },
      { category: 'cleaning', name: 'Vim Bar 150g', slug: 'vim-bar-150g', description: 'Dishwashing bar', selling_price: 25, mrp_price: 30, unit: 'piece', stock: 200, min_qty: 1, max_qty: 20, brand: 'Vim' },
      { category: 'cleaning', name: 'Scotch Brite Scrub Pad (3 pcs)', slug: 'scotch-brite-scrub-pad-3pcs', description: 'Kitchen scrub pads', selling_price: 55, mrp_price: 65, unit: 'pack', stock: 100, min_qty: 1, max_qty: 10, brand: 'Scotch Brite' },
    ];
    
    for (const prod of products) {
      const discount = prod.mrp_price ? Math.round(((prod.mrp_price - prod.selling_price) / prod.mrp_price) * 100) : 0;
      const stockStatus = prod.stock <= 10 ? 'low_stock' : (prod.stock <= 0 ? 'out_of_stock' : 'in_stock');
      
      await client.query(`
        INSERT INTO products (
          category_id, name, slug, description, selling_price, mrp_price, 
          discount_percentage, unit, min_order_quantity, max_order_quantity,
          stock_quantity, low_stock_threshold, stock_status, is_active, is_featured, brand
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, false, $14)
        ON CONFLICT (slug) DO UPDATE SET 
          selling_price = $5, mrp_price = $6, discount_percentage = $7,
          stock_quantity = $11, stock_status = $13
      `, [
        categoryIds[prod.category],
        prod.name,
        prod.slug,
        prod.description,
        prod.selling_price,
        prod.mrp_price,
        discount,
        prod.unit,
        prod.min_qty,
        prod.max_qty || null,
        prod.stock,
        10,
        stockStatus,
        prod.brand
      ]);
    }
    
    console.log('Products created:', products.length);
    
    // Create sample offers
    const offers = [
      {
        title: '10% Off on All Dairy Products',
        description: 'Get 10% discount on milk, butter, cheese and more',
        type: 'percentage',
        value: 10,
        applicable_on: 'category',
        category_id: categoryIds.dairy,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true
      },
      {
        title: '₹50 Off on Orders Above ₹1000',
        description: 'Flat ₹50 discount on orders above ₹1000',
        type: 'flat',
        value: 50,
        min_order_amount: 1000,
        applicable_on: 'all',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true
      },
      {
        title: 'Buy 2 Get 1 Free on Biscuits',
        description: 'Buy any 2 biscuit packets, get 1 free',
        type: 'buy_x_get_y',
        value: 1,
        applicable_on: 'category',
        category_id: categoryIds.biscuits,
        start_date: new Date(),
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        is_active: true
      }
    ];
    
    for (const offer of offers) {
      await client.query(`
        INSERT INTO offers (title, description, type, value, min_order_amount, applicable_on, category_id, start_date, end_date, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [offer.title, offer.description, offer.type, offer.value, offer.min_order_amount || null, offer.applicable_on, offer.category_id || null, offer.start_date, offer.end_date, offer.is_active]);
    }
    
    console.log('Offers created:', offers.length);
    
    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));