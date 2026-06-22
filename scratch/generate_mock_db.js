import fs from 'fs';

// Read petstore_seed.sql
const sql = fs.readFileSync('petstore_seed.sql', 'utf8');

// Parse products
// We'll search for the VALUES block of INSERT INTO products
const productsMatch = sql.match(/INSERT INTO products[\s\S]*?VALUES([\s\S]*?);\s*-- ── Prices/);
if (!productsMatch) {
  console.error("Could not find products VALUES in sql");
  process.exit(1);
}

const valuesBlock = productsMatch[1].trim();

// Split by values tuples
// Each tuple starts with a '(' and ends with a ')' at the end of a line (followed by comma or semicolon/end of statement)
const tuples = [];
let depth = 0;
let current = '';
let inString = false;
let stringChar = '';

for (let i = 0; i < valuesBlock.length; i++) {
  const char = valuesBlock[i];
  
  if (inString) {
    if (char === stringChar) {
      // Check for escaped quote ''
      if (valuesBlock[i+1] === stringChar) {
        current += char;
        current += valuesBlock[i+1];
        i++; // skip next quote
      } else {
        inString = false;
        current += char;
      }
    } else {
      current += char;
    }
  } else {
    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      current += char;
    } else if (char === '(') {
      if (depth === 0) {
        current = '';
      } else {
        current += char;
      }
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        tuples.push(current);
      } else {
        current += char;
      }
    } else {
      if (depth > 0) {
        current += char;
      }
    }
  }
}

// Function to parse a tuple into an array of values
function parseTuple(tupleStr) {
  const values = [];
  let currentVal = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];
    
    if (inString) {
      if (char === stringChar) {
        if (tupleStr[i+1] === stringChar) {
          currentVal += stringChar;
          i++; // skip escaped
        } else {
          inString = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
      } else if (char === ',') {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  values.push(currentVal.trim());
  return values.map(v => {
    if (v === 'NULL' || v === 'null' || v === '') return null;
    if (!isNaN(v)) return Number(v);
    return v;
  });
}

const parsedProducts = tuples.map((t, idx) => {
  const row = parseTuple(t);
  return {
    id: idx + 1,
    name: row[0],
    brand: row[1],
    weight_kg: row[2],
    animal_type: row[3],
    food_type: row[4],
    image_url: row[5],
    description: row[6],
    nutrition_protein: row[7],
    nutrition_fat: row[8],
    nutrition_fibre: row[9],
    nutrition_moisture: row[10],
    key_ingredients: row[11],
    feeding_guide: row[12],
    replaces_brand: row[13],
    replaces_reason: row[14],
    created_at: new Date().toISOString()
  };
});

// Parse store_prices
const pricesMatch = sql.match(/INSERT INTO store_prices[\s\S]*?VALUES([\s\S]*?);/);
if (!pricesMatch) {
  console.error("Could not find store_prices VALUES in sql");
  process.exit(1);
}

const pricesBlock = pricesMatch[1].trim();
const priceTuples = [];
depth = 0;
current = '';
inString = false;

for (let i = 0; i < pricesBlock.length; i++) {
  const char = pricesBlock[i];
  if (inString) {
    if (char === stringChar) {
      if (pricesBlock[i+1] === stringChar) {
        current += char + pricesBlock[i+1];
        i++;
      } else {
        inString = false;
        current += char;
      }
    } else {
      current += char;
    }
  } else {
    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      current += char;
    } else if (char === '(') {
      if (depth === 0) current = '';
      else current += char;
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) priceTuples.push(current);
      else current += char;
    } else {
      if (depth > 0) current += char;
    }
  }
}

const parsedPrices = priceTuples.map((t, idx) => {
  const row = parseTuple(t);
  return {
    id: idx + 1,
    product_id: row[0],
    store_name: row[1],
    price: row[2],
    product_url: row[3],
    in_stock: row[4] !== false,
    last_updated: new Date().toISOString()
  };
});

// Write to app/db.mock.ts
const code = `// Automatically generated in-memory mock database
export interface Product {
  id: number;
  name: string;
  brand: string | null;
  weight_kg: number | null;
  animal_type: string | null;
  food_type: string | null;
  image_url: string | null;
  description: string | null;
  nutrition_protein: number | null;
  nutrition_fat: number | null;
  nutrition_fibre: number | null;
  nutrition_moisture: number | null;
  key_ingredients: string | null;
  feeding_guide: string | null;
  replaces_brand: string | null;
  replaces_reason: string | null;
  created_at: string;
}

export interface StorePrice {
  id: number;
  product_id: number;
  store_name: string;
  price: number;
  product_url: string | null;
  in_stock: boolean;
  last_updated: string;
}

export interface Order {
  id: number;
  customer_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  delivery_area: string | null;
  subtotal_kes: number;
  delivery_fee_kes: number;
  total_kes: number;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

export interface Customer {
  id: number;
  phone: string;
  email: string | null;
  name: string | null;
  created_at: string;
}

export const mockProducts: Product[] = ${JSON.stringify(parsedProducts, null, 2)};

export const mockStorePrices: StorePrice[] = ${JSON.stringify(parsedPrices, null, 2)};

export const mockCustomers: Customer[] = [];

export const mockOrders: Order[] = [
  {
    id: 1,
    customer_name: "John Doe",
    customer_phone: "254712345678",
    customer_email: "john@example.com",
    delivery_area: "Westlands",
    subtotal_kes: 1478,
    delivery_fee_kes: 200,
    total_kes: 1678,
    payment_method: "mpesa",
    status: "pending",
    notes: "Deliver after 5 PM",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    customer_name: "Jane Smith",
    customer_phone: "254798765432",
    customer_email: null,
    delivery_area: "Kilimani",
    subtotal_kes: 2696,
    delivery_fee_kes: 250,
    total_kes: 2946,
    payment_method: "cod",
    status: "confirmed",
    notes: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const mockOrderItems: OrderItem[] = [
  {
    id: 1,
    order_id: 1,
    product_id: 3,
    product_name: "Bravo Dog Food Adult Chicken 2Kg",
    qty: 2,
    unit_price: 739,
    total_price: 1478
  },
  {
    id: 2,
    order_id: 2,
    product_id: 5,
    product_name: "Top Dog Rice And Chicken Puppy Food 5Kg",
    qty: 2,
    unit_price: 1348,
    total_price: 2696
  }
];

export async function executeMockQuery(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number }> {
  const queryText = text.replace(/\\s+/g, ' ').trim();

  // 1. Stats query on homepage
  if (queryText.includes("COUNT(*) FROM products") && queryText.includes("MAX(last_updated)")) {
    return {
      rows: [{
        product_count: mockProducts.length,
        last_updated: new Date().toISOString()
      }],
      rowCount: 1
    };
  }

  // 2. Featured products query
  if (queryText.includes("MIN(comp.price) AS competitor_min") && queryText.includes("LIMIT 6")) {
    const featured = mockProducts
      .map(p => {
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
        const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'PetStore Kenya').map(sp => sp.price);
        const competitor_min = compPrices.length > 0 ? Math.min(...compPrices) : null;
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight_kg: p.weight_kg,
          animal_type: p.animal_type,
          food_type: p.food_type,
          image_url: p.image_url,
          our_price: bbp ? bbp.price : null,
          competitor_min
        };
      })
      .filter(item => item.our_price !== null && item.competitor_min !== null)
      .sort((a, b) => ((b.competitor_min || 0) - (b.our_price || 0)) - ((a.competitor_min || 0) - (a.our_price || 0)))
      .slice(0, 6);

    return { rows: featured, rowCount: featured.length };
  }

  // 3. Shop products list query
  if (queryText.includes("bbp.price AS our_price") && queryText.includes("LEFT JOIN store_prices comp")) {
    let animalFilter = '';
    let typeFilter = '';
    let searchFilter = '';

    if (params && params.length > 0) {
      for (const p of params) {
        if (typeof p === 'string') {
          if (p.startsWith('%') && p.endsWith('%')) {
            searchFilter = p.slice(1, -1).toLowerCase();
          } else if (['dog', 'cat', 'rabbit', 'bird'].includes(p)) {
            animalFilter = p;
          } else if (['dry', 'wet', 'treat', 'supplement'].includes(p)) {
            typeFilter = p;
          }
        }
      }
    }

    const list = mockProducts
      .filter(p => {
        if (animalFilter && p.animal_type !== animalFilter) return false;
        if (typeFilter && p.food_type !== typeFilter) return false;
        if (searchFilter && !p.name.toLowerCase().includes(searchFilter)) return false;
        return true;
      })
      .map(p => {
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
        const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'PetStore Kenya').map(sp => sp.price);
        const competitor_min = compPrices.length > 0 ? Math.min(...compPrices) : null;
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight_kg: p.weight_kg,
          animal_type: p.animal_type,
          food_type: p.food_type,
          image_url: p.image_url,
          our_price: bbp ? bbp.price : null,
          competitor_min
        };
      })
      .filter(item => item.our_price !== null)
      .sort((a, b) => {
        const diffA = (a.competitor_min || 0) - (a.our_price || 0);
        const diffB = (b.competitor_min || 0) - (b.our_price || 0);
        if (diffB !== diffA) return diffB - diffA;
        return a.name.localeCompare(b.name);
      });

    return { rows: list, rowCount: list.length };
  }

  // 4. Product detail query
  if (queryText.includes("json_agg") && queryText.includes("sp.product_id = p.id") && queryText.includes("p.id = $1")) {
    const id = Number(params[0]);
    const p = mockProducts.find(x => x.id === id);
    if (!p) {
      return { rows: [], rowCount: 0 };
    }

    const prices = mockStorePrices
      .filter(sp => sp.product_id === p.id)
      .map(sp => ({
        store: sp.store_name,
        price: sp.price,
        url: sp.product_url,
        in_stock: sp.in_stock,
        last_updated: sp.last_updated
      }))
      .sort((a, b) => {
        if (a.store === 'PetStore Kenya' && b.store !== 'PetStore Kenya') return -1;
        if (a.store !== 'PetStore Kenya' && b.store === 'PetStore Kenya') return 1;
        return a.price - b.price;
      });

    return {
      rows: [{
        ...p,
        prices
      }],
      rowCount: 1
    };
  }

  // 5. Admin Products list
  if (queryText.includes("FROM products p LEFT JOIN store_prices bbp") && queryText.includes("ORDER BY p.name")) {
    const list = mockProducts
      .map(p => {
        const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
        return {
          ...p,
          our_price: bbp ? bbp.price : null
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return { rows: list, rowCount: list.length };
  }

  // 6. Admin prices audit query
  if (queryText.includes("json_object_agg") && queryText.includes("sp.product_id = p.id")) {
    const list = mockProducts
      .map(p => {
        const store_data: Record<string, any> = {};
        mockStorePrices
          .filter(sp => sp.product_id === p.id)
          .forEach(sp => {
            store_data[sp.store_name] = {
              price: sp.price,
              in_stock: sp.in_stock,
              last_updated: sp.last_updated,
              url: sp.product_url
            };
          });
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          animal_type: p.animal_type,
          food_type: p.food_type,
          weight_kg: p.weight_kg,
          store_data
        };
      })
      .sort((a, b) => {
        const typeA = a.animal_type || '';
        const typeB = b.animal_type || '';
        if (typeA !== typeB) return typeA.localeCompare(typeB);
        return a.name.localeCompare(b.name);
      });
    return { rows: list, rowCount: list.length };
  }

  // 7. Admin Dashboard Overview stats
  if (queryText === "SELECT COUNT(*) FROM orders") {
    return { rows: [{ count: mockOrders.length }], rowCount: 1 };
  }
  if (queryText.includes("SUM(total_kes) FROM orders WHERE status != 'cancelled'")) {
    const total = mockOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_kes), 0);
    return { rows: [{ sum: total }], rowCount: 1 };
  }
  if (queryText.includes("COUNT(*) FROM orders WHERE status = 'pending'")) {
    const count = mockOrders.filter(o => o.status === 'pending').length;
    return { rows: [{ count }], rowCount: 1 };
  }
  if (queryText === "SELECT COUNT(*) FROM products") {
    return { rows: [{ count: mockProducts.length }], rowCount: 1 };
  }
  if (queryText.includes("COUNT(DISTINCT p.id) as count") && queryText.includes("comp.price < bbp.price")) {
    const alerts = mockProducts.filter(p => {
      const bbp = mockStorePrices.find(sp => sp.product_id === p.id && sp.store_name === 'PetStore Kenya');
      const compPrices = mockStorePrices.filter(sp => sp.product_id === p.id && sp.store_name !== 'PetStore Kenya').map(sp => sp.price);
      return bbp && compPrices.some(price => price < bbp.price);
    }).length;
    return { rows: [{ count: alerts }], rowCount: 1 };
  }
  if (queryText.includes("FROM orders ORDER BY created_at DESC LIMIT 10")) {
    const recent = mockOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    return { rows: recent, rowCount: recent.length };
  }

  // 8. Admin Orders list
  if (queryText.includes("FROM orders o LEFT JOIN order_items oi")) {
    const statusFilter = params[0] || '';
    const filtered = statusFilter
      ? mockOrders.filter(o => o.status === statusFilter)
      : mockOrders;

    const list = filtered
      .map(o => {
        const items = mockOrderItems
          .filter(oi => oi.order_id === o.id)
          .map(oi => ({
            product_name: oi.product_name,
            qty: oi.qty,
            unit_price: oi.unit_price,
            total_price: oi.total_price
          }));
        return {
          ...o,
          items
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { rows: list, rowCount: list.length };
  }

  // 9. INSERT / UPDATE / DELETE operations (Mutations)

  // Insert customer (Upsert)
  if (queryText.includes("INSERT INTO customers")) {
    const phone = params[0];
    const email = params[1];
    const name = params[2];
    let cust = mockCustomers.find(c => c.phone === phone);
    if (cust) {
      if (email !== null) cust.email = email;
      if (name !== null) cust.name = name;
      cust.created_at = new Date().toISOString();
    } else {
      mockCustomers.push({
        id: mockCustomers.length + 1,
        phone,
        email,
        name,
        created_at: new Date().toISOString()
      });
    }
    return { rows: [], rowCount: 1 };
  }

  // Insert order
  if (queryText.includes("INSERT INTO orders") && queryText.includes("RETURNING id")) {
    const newId = mockOrders.length > 0 ? Math.max(...mockOrders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
      id: newId,
      customer_name: params[0],
      customer_phone: params[1],
      customer_email: params[2],
      delivery_area: params[3],
      subtotal_kes: Number(params[4]),
      delivery_fee_kes: Number(params[5]),
      total_kes: Number(params[6]),
      payment_method: params[7],
      notes: params[8],
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockOrders.push(newOrder);
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  // Insert order item
  if (queryText.includes("INSERT INTO order_items")) {
    const newId = mockOrderItems.length > 0 ? Math.max(...mockOrderItems.map(oi => oi.id)) + 1 : 1;
    mockOrderItems.push({
      id: newId,
      order_id: params[0],
      product_id: params[1],
      product_name: params[2],
      qty: params[3],
      unit_price: params[4],
      total_price: params[5]
    });
    return { rows: [], rowCount: 1 };
  }

  // Update order status
  if (queryText.includes("UPDATE orders SET status = $1 WHERE id = $2")) {
    const status = params[0];
    const id = Number(params[1]);
    const order = mockOrders.find(o => o.id === id);
    if (order) {
      order.status = status;
    }
    return { rows: [], rowCount: 1 };
  }

  // Insert product
  if (queryText.includes("INSERT INTO products") && queryText.includes("RETURNING id")) {
    const newId = mockProducts.length > 0 ? Math.max(...mockProducts.map(p => p.id)) + 1 : 1;
    mockProducts.push({
      id: newId,
      name: params[0],
      brand: params[1],
      weight_kg: params[2],
      animal_type: params[3],
      food_type: params[4],
      image_url: params[5],
      description: params[6],
      key_ingredients: params[7],
      feeding_guide: params[8],
      replaces_brand: params[9],
      replaces_reason: params[10],
      nutrition_protein: params[11],
      nutrition_fat: params[12],
      nutrition_fibre: params[13],
      nutrition_moisture: params[14],
      created_at: new Date().toISOString()
    });
    return { rows: [{ id: newId }], rowCount: 1 };
  }

  // Insert store_prices
  if (queryText.includes("INSERT INTO store_prices")) {
    const newId = mockStorePrices.length > 0 ? Math.max(...mockStorePrices.map(sp => sp.id)) + 1 : 1;
    mockStorePrices.push({
      id: newId,
      product_id: params[0],
      store_name: params[1],
      price: params[2],
      product_url: params[3] || null,
      in_stock: true,
      last_updated: new Date().toISOString()
    });
    return { rows: [], rowCount: 1 };
  }

  // Update store_prices price
  if (queryText.includes("UPDATE store_prices SET price = $1") && queryText.includes("store_name = 'PetStore Kenya'")) {
    const price = params[0];
    const pid = Number(params[1]);
    const sp = mockStorePrices.find(x => x.product_id === pid && x.store_name === 'PetStore Kenya');
    if (sp) {
      sp.price = price;
      sp.last_updated = new Date().toISOString();
    }
    return { rows: [], rowCount: 1 };
  }

  // Check store_prices
  if (queryText.includes("SELECT id FROM store_prices WHERE product_id = $1 AND store_name = 'PetStore Kenya'")) {
    const pid = Number(params[0]);
    const sp = mockStorePrices.find(x => x.product_id === pid && x.store_name === 'PetStore Kenya');
    return { rows: sp ? [{ id: sp.id }] : [], rowCount: sp ? 1 : 0 };
  }

  // Update product
  if (queryText.includes("UPDATE products SET name = $1")) {
    const pid = Number(params[15]);
    const p = mockProducts.find(x => x.id === pid);
    if (p) {
      p.name = params[0];
      p.brand = params[1];
      p.weight_kg = params[2];
      p.animal_type = params[3];
      p.food_type = params[4];
      p.image_url = params[5];
      p.description = params[6];
      p.key_ingredients = params[7];
      p.feeding_guide = params[8];
      p.replaces_brand = params[9];
      p.replaces_reason = params[10];
      p.nutrition_protein = params[11];
      p.nutrition_fat = params[12];
      p.nutrition_fibre = params[13];
      p.nutrition_moisture = params[14];
    }
    return { rows: [], rowCount: 1 };
  }

  // Delete product
  if (queryText.includes("DELETE FROM products WHERE id = $1")) {
    const pid = Number(params[0]);
    const idx = mockProducts.findIndex(x => x.id === pid);
    if (idx !== -1) {
      mockProducts.splice(idx, 1);
    }
    // Clean up prices
    for (let i = mockStorePrices.length - 1; i >= 0; i--) {
      if (mockStorePrices[i].product_id === pid) {
        mockStorePrices.splice(i, 1);
      }
    }
    return { rows: [], rowCount: 1 };
  }

  // 10. Fallback for unhandled/general queries (just print warning and return empty)
  console.warn("⚠️ Unhandled mock query:", text, "with params:", params);
  return { rows: [], rowCount: 0 };
}
`;

fs.writeFileSync('app/db.mock.ts', code);
console.log("Generated app/db.mock.ts successfully with " + parsedProducts.length + " products and " + parsedPrices.length + " prices!");
