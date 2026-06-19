import fs from 'fs';

// Read petfood_seed.sql
const sql = fs.readFileSync('petfood_seed.sql', 'utf8');

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
`;

fs.writeFileSync('app/db.mock.ts', code);
console.log("Generated app/db.mock.ts successfully with " + parsedProducts.length + " products and " + parsedPrices.length + " prices!");
