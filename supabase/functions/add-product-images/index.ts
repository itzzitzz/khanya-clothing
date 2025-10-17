import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mysqlHost = Deno.env.get('MYSQL_HOST');
    const mysqlDatabase = Deno.env.get('MYSQL_DATABASE');
    const mysqlUsername = Deno.env.get('MYSQL_USERNAME');
    const mysqlPassword = Deno.env.get('MYSQL_PASSWORD');

    if (!mysqlHost || !mysqlDatabase || !mysqlUsername || !mysqlPassword) {
      throw new Error('Missing database configuration');
    }

    console.log(`Connecting to MySQL database ${mysqlDatabase} at ${mysqlHost}...`);

    const mysql = await import('https://deno.land/x/mysql@v2.12.1/mod.ts');
    
    const client = await new mysql.Client().connect({
      hostname: mysqlHost,
      username: mysqlUsername,
      password: mysqlPassword,
      db: mysqlDatabase,
      port: 3306,
    });

    console.log('Connected to MySQL successfully');

    // Fetch products to get their IDs and names
    const productsResult = await client.query(
      `SELECT id, name, image_path FROM products WHERE is_active = 1`
    );

    const products = Array.isArray(productsResult) ? productsResult : (productsResult.rows || []);

    // Log all product names for debugging
    console.log('Available products in database:');
    products.forEach((p: any) => console.log(`- ID ${p.id}: "${p.name}"`));

    // Define new images to add for each product - using keywords for matching
    const newImages: Array<{
      keywords: string[];
      displayName: string;
      images: Array<{
        path: string;
        altText: string;
        displayOrder: number;
      }>;
    }> = [
      {
        keywords: ['ripped', 'jeans', 'men'],
        displayName: "Men's Ripped Jeans",
        images: [
          { path: 'public/product-images/mens-ripped-jeans-2.jpg', altText: 'Men\'s ripped denim jeans in various shades arranged on wooden surface', displayOrder: 2 },
          { path: 'public/product-images/mens-ripped-jeans-3.jpg', altText: 'Stack of men\'s distressed jeans showing different washes', displayOrder: 3 },
          { path: 'public/product-images/mens-ripped-jeans-4.jpg', altText: 'Close-up of men\'s ripped jeans showing fabric texture and distressed details', displayOrder: 4 },
          { path: 'public/product-images/mens-ripped-jeans-5.jpg', altText: 'Men\'s ripped jeans arranged in circular pattern overhead view', displayOrder: 5 },
        ]
      },
      {
        keywords: ['tshirt', 't-shirt', 'men'],
        displayName: "Men's T-Shirts",
        images: [
          { path: 'public/product-images/mens-tshirts-2.jpg', altText: 'Men\'s casual t-shirts in various colors neatly folded and stacked', displayOrder: 2 },
          { path: 'public/product-images/mens-tshirts-3.jpg', altText: 'Collection of men\'s printed t-shirts with various graphic designs', displayOrder: 3 },
          { path: 'public/product-images/mens-tshirts-4.jpg', altText: 'Men\'s t-shirts hanging on hangers variety of solid colors', displayOrder: 4 },
          { path: 'public/product-images/mens-tshirts-5.jpg', altText: 'Stack of men\'s polo and crew neck t-shirts multiple colors', displayOrder: 5 },
        ]
      },
      {
        keywords: ['tshirt', 't-shirt', 'women', 'ladies'],
        displayName: "Women's T-Shirts",
        images: [
          { path: 'public/product-images/womens-tshirts-2.jpg', altText: 'Women\'s casual t-shirts in pastel and bright colors variety of styles', displayOrder: 2 },
          { path: 'public/product-images/womens-tshirts-3.jpg', altText: 'Collection of women\'s graphic print t-shirts with floral patterns', displayOrder: 3 },
          { path: 'public/product-images/womens-tshirts-4.jpg', altText: 'Women\'s t-shirts hanging on display variety of colors and sleeve lengths', displayOrder: 4 },
          { path: 'public/product-images/womens-tshirts-5.jpg', altText: 'Stack of women\'s fitted and loose t-shirts mixed solid colors', displayOrder: 5 },
        ]
      },
      {
        keywords: ['jacket', 'zipper', 'women', 'ladies'],
        displayName: "Women's Zipper Jackets",
        images: [
          { path: 'public/product-images/womens-zipper-jackets-2.jpg', altText: 'Women\'s zipper jackets in various styles hoodies track jackets', displayOrder: 2 },
          { path: 'public/product-images/womens-zipper-jackets-3.jpg', altText: 'Collection of women\'s zip-up hoodies and athletic jackets colorful', displayOrder: 3 },
          { path: 'public/product-images/womens-zipper-jackets-4.jpg', altText: 'Women\'s zipper jackets hanging variety of materials fleece cotton', displayOrder: 4 },
          { path: 'public/product-images/womens-zipper-jackets-5.jpg', altText: 'Stack of women\'s lightweight jackets with zippers folded neatly', displayOrder: 5 },
        ]
      },
      {
        keywords: ['children', 'kids', 'summer'],
        displayName: "Children's Summer Wear",
        images: [
          { path: 'public/product-images/childrens-summer-wear-2.jpg', altText: 'Children\'s summer clothing colorful shorts tank tops sundresses', displayOrder: 2 },
          { path: 'public/product-images/childrens-summer-wear-3.jpg', altText: 'Collection of children\'s summer outfits boys and girls clothing', displayOrder: 3 },
          { path: 'public/product-images/childrens-summer-wear-4.jpg', altText: 'Children\'s summer wear on small hangers organized by size', displayOrder: 4 },
          { path: 'public/product-images/childrens-summer-wear-5.jpg', altText: 'Stack of children\'s summer clothing bright cheerful colors', displayOrder: 5 },
        ]
      }
    ];

    let totalInserted = 0;
    const insertResults = [];

    // Insert images for each product
    for (const productImages of newImages) {
      // Find the product by checking if any keywords match the product name
      const productNameLower = (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const product = products.find((p: any) => {
        const normalizedName = productNameLower(p);
        return productImages.keywords.some(keyword => 
          normalizedName.includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );
      });

      if (!product) {
        console.log(`Product not found for: ${productImages.displayName}`);
        console.log(`Searched keywords: ${productImages.keywords.join(', ')}`);
        insertResults.push({
          productName: productImages.displayName,
          status: 'skipped',
          reason: 'Product not found in database'
        });
        continue;
      }

      console.log(`Adding images for product: ${product.name} (ID: ${product.id})`);

      for (const image of productImages.images) {
        const insertQuery = `
          INSERT INTO product_images (product_id, image_path, image_alt_text, is_primary, display_order)
          VALUES (?, ?, ?, 0, ?)
        `;
        
        await client.execute(insertQuery, [
          product.id,
          image.path,
          image.altText,
          image.displayOrder
        ]);

        totalInserted++;
      }

      insertResults.push({
        productName: product.name,
        productId: product.id,
        status: 'success',
        imagesAdded: productImages.images.length
      });
    }

    await client.close();

    console.log(`Successfully inserted ${totalInserted} new product images`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Added ${totalInserted} new product images`,
        results: insertResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error adding product images:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
