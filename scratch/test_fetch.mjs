async function run() {
  const url = 'https://petstore.co.ke/product/bonnie-adult-dog-food-beef-15kg/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    // Extract categories block
    const postedInMatch = html.match(/<span class="posted_in">([\s\S]*?)<\/span>/i);
    const categories = [];
    if (postedInMatch) {
      const catHtml = postedInMatch[1];
      const catRegex = /\/product-category\/([^/"]+)/gi;
      let catMatch;
      while ((catMatch = catRegex.exec(catHtml)) !== null) {
        categories.push(catMatch[1]);
      }
    }
    console.log('Product Categories from posted_in:', categories);

    // Extract tags block
    const taggedAsMatch = html.match(/<span class="tagged_as">([\s\S]*?)<\/span>/i);
    const tags = [];
    if (taggedAsMatch) {
      const tagHtml = taggedAsMatch[1];
      const tagRegex = /\/product-tag\/([^/"]+)/gi;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(tagHtml)) !== null) {
        tags.push(tagMatch[1]);
      }
    }
    console.log('Product Tags from tagged_as:', tags);

    // Let's refine animal_type classification based on categories & tags
    let animal_type = 'dog';
    const allLabels = [...categories, ...tags].map(x => x.toLowerCase());
    
    if (allLabels.some(l => l.includes('cat') || l.includes('kitten'))) {
      animal_type = 'cat';
    } else if (allLabels.some(l => l.includes('dog') || l.includes('puppy'))) {
      animal_type = 'dog';
    } else if (allLabels.some(l => l.includes('bird') || l.includes('parrot'))) {
      animal_type = 'bird';
    } else if (allLabels.some(l => l.includes('rabbit'))) {
      animal_type = 'rabbit';
    } else if (allLabels.some(l => l.includes('fish'))) {
      animal_type = 'fish';
    }
    
    // Let's refine food_type classification
    let food_type = 'dry';
    if (allLabels.some(l => l.includes('wet') || l.includes('can') || l.includes('pouch') || l.includes('gravy') || l.includes('jelly') || l.includes('pate') || l.includes('loaf'))) {
      food_type = 'wet';
    } else if (allLabels.some(l => l.includes('treat') || l.includes('biscuit') || l.includes('chew'))) {
      food_type = 'treat';
    }
    
    console.log({ animal_type, food_type });

  } catch (err) {
    console.error(err);
  }
}

run();
