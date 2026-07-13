import { loader } from './app/routes/shop.tsx';
import dotenv from 'dotenv';

dotenv.config();

async function testRoute(slug, isTagPage = false) {
  const url = isTagPage 
    ? `http://localhost/product-tag/${slug}` 
    : `http://localhost/product-category/${slug}`;
  
  const request = new Request(url);
  const params = { slug };

  try {
    const data = await loader({ request, params });
    console.log(`Route: ${url} | Slug: "${slug}" | Total products returned: ${data.totalResults}`);
  } catch (err) {
    console.error(`Error loading ${slug}:`, err);
  }
}

async function run() {
  await testRoute('cat-food-and-treats');
  await testRoute('dog-food-treats');
  await testRoute('accessories');
  await testRoute('cat-supplies-store');
  await testRoute('new-arrivals', true);
}

run();
