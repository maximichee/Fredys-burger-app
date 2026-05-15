import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { slug: 'palta',          name: 'La Palta de Fredys',  order: 1 },
  { slug: 'super-promo',    name: 'Super Promo',          order: 2 },
  { slug: 'muzzarella',     name: 'Opción Muzzarella',    order: 3 },
  { slug: 'burger-especial',name: 'Burger Especial',      order: 4 },
  { slug: 'promos',         name: 'Promos',               order: 5 },
  { slug: 'kids',           name: 'Burger Kids',          order: 6 },
  { slug: 'burgers',        name: 'Burgers',              order: 7 },
  { slug: 'papas',          name: 'Papas',                order: 8 },
  { slug: 'salsas',         name: 'Dip de Salsa',         order: 9 },
  { slug: 'bebidas',        name: 'Bebidas',              order: 10 },
];

const SIZES = (s:number,d:number,t:number,c:number,q:number) => [
  { label:'simple',    price:s, order:0 },
  { label:'doble',     price:d, order:1 },
  { label:'triple',    price:t, order:2 },
  { label:'cuádruple', price:c, order:3 },
  { label:'quíntuple', price:q, order:4 },
];

const products: {
  slug: string; name: string; description: string;
  images: string[]; categorySlug: string;
  prices: {label:string;price:number;order:number}[];
  featured?: boolean;
}[] = [
  // ─── La Palta de Fredys ─────────────────────────────────────────────────────
  {
    slug:'cebolla-crispy', name:'Cebolla Crispy',
    description:'Pan de papa, carne, cheddar, salsa de palta, cebolla crispy, bacon y huevo',
    images:['img/la-palta/crispy.png'], categorySlug:'palta',
    prices: SIZES(7000,8000,9000,10000,11000),
  },
  {
    slug:'lechuga-repollada', name:'Lechuga Repollada',
    description:'Pan, carne, lechuga repollada, cheddar',
    images:['img/la-palta/repo.png'], categorySlug:'palta',
    prices: SIZES(7000,8000,9000,10000,11000),
  },

  // ─── Super Promo ────────────────────────────────────────────────────────────
  {
    slug:'triple-carne-cl', name:'Triple Carne CL (con papas)',
    description:'Pan de papa, carne, cheddar, bacon, salsa cuarto de libra',
    images:['img/promo.png'], categorySlug:'super-promo',
    prices:[{ label:'promo', price:9000, order:0 }],
  },
  {
    slug:'triple-carne-st', name:'Triple Carne ST (con papas)',
    description:'Pan de papa, carne, cheddar, bacon, salsa tasty',
    images:['img/promo.png'], categorySlug:'super-promo',
    prices:[{ label:'promo', price:11000, order:0 }],
  },
  {
    slug:'burger-doble-cl', name:'Burger Doble CL (con papas)',
    description:'Pan de papa, carne, cheddar, bacon, salsa cuarto de libra',
    images:['img/promo.png'], categorySlug:'super-promo',
    prices:[{ label:'promo', price:8000, order:0 }],
  },

  // ─── Muzzarella ─────────────────────────────────────────────────────────────
  {
    slug:'fredys-muzz', name:'Fredys (MUZZ)',
    description:'Pan de papa, carne, doble muzzarella, bacon, champiñón, cebolla caramelizada, queso roquefort, salsa FDB',
    images:['img/fredys-muzz.jpg'], categorySlug:'muzzarella',
    prices:[{label:'doble',price:11000,order:0},{label:'triple',price:12700,order:1},{label:'cuádruple',price:13200,order:2}],
  },
  {
    slug:'crispy-muzz', name:'Crispy (MUZZ)',
    description:'Pan de papa, carne, doble queso muzzarella, bacon, cebolla crispy, salsa cuarto de libra',
    images:['img/crispy-muzz.jpg'], categorySlug:'muzzarella',
    prices:[{label:'doble',price:9900,order:0},{label:'triple',price:11000,order:1},{label:'cuádruple',price:12500,order:2}],
  },
  {
    slug:'big-muzz', name:'Big (MUZZ)',
    description:'Pan de papa, carne, doble queso muzzarella, bacon, cebolla caramelizada, morrones asados, huevo frito, salsa alioli',
    images:['img/big-muzz.jpg'], categorySlug:'muzzarella',
    prices:[{label:'doble',price:9500,order:0},{label:'triple',price:10700,order:1},{label:'cuádruple',price:11900,order:2}],
  },
  {
    slug:'green-muzz', name:'Green (MUZZ)',
    description:'Pan de papa, carne, doble queso muzzarella, bacon, salsa de rúcula, cebolla crispy, cebolla morada',
    images:['img/green-muzz.jpg'], categorySlug:'muzzarella',
    prices:[{label:'doble',price:10000,order:0},{label:'triple',price:11500,order:1},{label:'cuádruple',price:12700,order:2}],
  },

  // ─── Burger Especial ────────────────────────────────────────────────────────
  {
    slug:'hallfredys', name:'Hallfredys',
    description:'Salsa misteriosa, cheddar, bacon, lechuga repollada, pepinos, cebolla crispy',
    images:['img/hallfredys.jpg'], categorySlug:'burger-especial',
    prices:[{label:'doble',price:9500,order:0},{label:'triple',price:11000,order:1},{label:'cuádruple',price:12900,order:2}],
    featured: true,
  },
  {
    slug:'burger-a-eleccion', name:'Burger a Elección',
    description:'Cheddar y bacon garantizado, el resto lo elegís vos',
    images:['img/burger-eleccion.jpg'], categorySlug:'burger-especial',
    prices:[{label:'doble',price:7800,order:0}],
  },

  // ─── Promos ─────────────────────────────────────────────────────────────────
  {slug:'promo-2-bacon-dobles',name:'2 Bacon Cheeseburger dobles',description:'Con papas',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:18000,order:0}]},
  {slug:'promo-2-crispy-triples',name:'2 Crispy Burger triples',description:'Con papas',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:20500,order:0}]},
  {slug:'promo-2-crispy-dobles',name:'2 Crispy Burger dobles',description:'Con las papitas más ricas',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:18000,order:0}]},
  {slug:'promo-2-onion-dobles',name:'2 Onion Burger dobles',description:'Con papas',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:18000,order:0}]},
  {slug:'promo-2-fredys-dobles',name:'2 Fredys Burger dobles',description:'',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:21000,order:0}]},
  {slug:'promo-2-fredys-papas',name:'2 Fredys Dobles + Papas C/Cheddar y Bacon',description:'',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:26000,order:0}]},
  {slug:'promo-super-muzza',name:'Burger Doble Súper Muzza',description:'Pan de papa, doble carne, doble muzzarella, crispy y salsa alioli',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:9500,order:0}]},
  {slug:'promo-2-big-fredys',name:'2 Big Fredy dobles',description:'',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:18700,order:0}]},
  {slug:'promo-3-best-doble',name:'3 Best Burger doble',description:'',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:27600,order:0}]},
  {slug:'promo-3-big-fredys',name:'3 Big Fredys dobles',description:'',images:['img/promo.png'],categorySlug:'promos',prices:[{label:'promo',price:26700,order:0}]},

  // ─── Burger Kids ────────────────────────────────────────────────────────────
  {slug:'kids-1',name:'Kids 1',description:'Pan / carne / cheddar / papas',images:['img/kids1.jpg'],categorySlug:'kids',prices:[{label:'único',price:7800,order:0}]},
  {slug:'kids-2',name:'Kids 2',description:'Pan / carne / cheddar / huevo / papas',images:['img/kids2.jpg'],categorySlug:'kids',prices:[{label:'único',price:8000,order:0}]},
  {slug:'kids-3',name:'Kids 3',description:'Pan de papa, carne, queso muzzarella. Sale con papas',images:['img/kids3.jpg'],categorySlug:'kids',prices:[{label:'único',price:7500,order:0}]},

  // ─── Burgers ────────────────────────────────────────────────────────────────
  {slug:'bacon-cheeseburger',name:'Bacon Cheeseburger',description:'Pan de papa, 110gr carne, doble cheddar, bacon, salsa tasty',images:['img/b/b1.1.png','img/b/b1.2.png','img/b/b1.3.png'],categorySlug:'burgers',prices:SIZES(8100,9700,10900,11900,12900),featured:true},
  {slug:'mushroom-burger',name:'Mushroom Burger',description:'Pan de papa, 110gr carne, cheddar, bacon, champiñón, cebolla crispy, salsa tasty',images:['img/b/b2.1.png','img/b/b2.2.png','img/b/b2.3.png'],categorySlug:'burgers',prices:SIZES(8400,10400,12100,13800,14500)},
  {slug:'fredys-burger',name:"Fredy's Burger",description:'Pan de papa, 110gr carne, cheddar, bacon, champiñón, cebolla caramelizada, queso roquefort, salsa fdb',images:['img/b/b3.1.png','img/b/b3.2.png','img/b/b3.3.png'],categorySlug:'burgers',prices:SIZES(8900,11200,12900,13500,14700),featured:true},
  {slug:'demente-burger',name:'Demente Burger',description:'Pan de papa, 110gr carne, cheddar, bacon, huevo frito, cebolla caramelizada, morrones asados, pepino, salsa tasty',images:['img/b/b4.1.png','img/b/b4.2.png','img/b/b4.3.png'],categorySlug:'burgers',prices:SIZES(8500,10400,11800,13100,14500)},
  {slug:'onion-burger',name:'Onion Burger',description:'Pan de papa, 110gr carne, cheddar, panceta, mucha cebolla caramelizada, salsa cuarto de libra',images:['img/b/b5.1.png','img/b/b5.2.png','img/b/b5.3.png'],categorySlug:'burgers',prices:SIZES(8000,10100,11600,12900,14100)},
  {slug:'crispy-burger',name:'Crispy Burger',description:'Pan de papa, 110gr carne, cheddar, bacon, cebolla crispy, salsa cuarto de libra',images:['img/b/b6.1.png','img/b/b6.2.png','img/b/b6.3.png'],categorySlug:'burgers',prices:SIZES(8100,11000,11200,12700,13900)},
  {slug:'best-burger',name:'Best Burger',description:'Pan de papa, 110gr carne, cheddar, bacon, huevo frito, cebolla caramelizada, salsa fdb',images:['img/b/b7.1.png','img/b/b7.2.png','img/b/b7.3.png'],categorySlug:'burgers',prices:SIZES(8300,10200,11600,12900,14000)},
  {slug:'big-fredy',name:'Big Fredy',description:'Pan de papa, 110gr carne, cheddar, bacon, cebolla caramelizada, morrones asados, huevo frito, salsa alioli',images:['img/b/b8.1.png','img/b/b8.2.png','img/b/b8.3.png'],categorySlug:'burgers',prices:SIZES(8500,9900,10900,11900,13200)},
  {slug:'green-burger',name:'Green Burger',description:'Cheddar, salsa de rúcula, crispy, bacon, cebolla morada',images:['img/b/b9.1.png','img/b/b9.2.png','img/b/b9.3.png'],categorySlug:'burgers',prices:SIZES(8200,10000,11500,12700,13900)},
  {slug:'thefresh-burger',name:'THEFRESH Burger',description:'Doble carne, cheddar, bacon, lechuga repollada, cebolla picada, salsa Sweetfred',images:['img/b/b10.1.png','img/b/b10.2.png','img/b/b10.3.png'],categorySlug:'burgers',prices:SIZES(8300,10800,12100,13300,14100)},
  {slug:'burger-provolone',name:'Burger Provolone',description:'Doble queso provolone, salsa alioli, cebolla caramelizada, morrones asados',images:['img/b/b11.1.png','img/b/b11.2.png','img/b/b11.3.png'],categorySlug:'burgers',prices:SIZES(8600,13000,11900,13200,14900)},

  // ─── Papas ──────────────────────────────────────────────────────────────────
  {slug:'papas',name:'Papas',description:'',images:['img/papas/papas 3.png'],categorySlug:'papas',prices:[{label:'único',price:6500,order:0}]},
  {slug:'papas-con-cheddar',name:'Papas con Cheddar',description:'',images:['img/papas/papas 2.png'],categorySlug:'papas',prices:[{label:'único',price:7000,order:0}]},
  {slug:'papas-con-cheddar-y-bacon',name:'Papas con Cheddar y Bacon',description:'',images:['img/papas/papas 1.png'],categorySlug:'papas',prices:[{label:'único',price:7500,order:0}]},

  // ─── Salsas ─────────────────────────────────────────────────────────────────
  {slug:'salsa-rucula',name:'Salsa de Rúcula',description:'',images:['img/salsa/salsa.png'],categorySlug:'salsas',prices:[{label:'dip',price:1000,order:0}]},
  {slug:'salsa-fdb',name:'Salsa FDB',description:'',images:['img/salsa/image (6).png'],categorySlug:'salsas',prices:[{label:'dip',price:1000,order:0}]},
  {slug:'salsa-tasty',name:'Salsa Tasty',description:'',images:['img/salsa/image (1).png'],categorySlug:'salsas',prices:[{label:'dip',price:1000,order:0}]},
  {slug:'salsa-sweetfred',name:'Salsa SweetFred',description:'',images:['img/salsa/image (2).png'],categorySlug:'salsas',prices:[{label:'dip',price:1000,order:0}]},
  {slug:'salsa-cuarto-libra',name:'Salsa Cuarto de Libra',description:'',images:['img/salsa/image (3).png'],categorySlug:'salsas',prices:[{label:'dip',price:1000,order:0}]},
  {slug:'salsa-alioli',name:'Salsa Alioli',description:'',images:['img/salsa/image (4).png'],categorySlug:'salsas',prices:[{label:'dip',price:1000,order:0}]},
  {slug:'dip-cheddar',name:'Dip de Cheddar',description:'',images:['img/salsa/image (5).png'],categorySlug:'salsas',prices:[{label:'dip',price:1200,order:0}]},

  // ─── Bebidas ────────────────────────────────────────────────────────────────
  {slug:'coca-cola-lata',name:'Lata Coca Cola',description:'',images:['img/bebidas/image (3).png'],categorySlug:'bebidas',prices:[{label:'lata',price:1800,order:0}]},
  {slug:'sprite-lata',name:'Lata Sprite',description:'',images:['img/bebidas/image (4).png'],categorySlug:'bebidas',prices:[{label:'lata',price:1800,order:0}]},
  {slug:'fanta-lata',name:'Lata Fanta',description:'',images:['img/bebidas/image (5).png'],categorySlug:'bebidas',prices:[{label:'lata',price:1800,order:0}]},
  {slug:'coca-cola-15l',name:'Coca Cola 1.5L',description:'',images:['img/bebidas/image (6).png'],categorySlug:'bebidas',prices:[{label:'botella',price:3200,order:0}]},
  {slug:'sprite-15l',name:'Sprite 1.5L',description:'',images:['img/bebidas/image (7).png'],categorySlug:'bebidas',prices:[{label:'botella',price:3200,order:0}]},
  {slug:'fanta-15l',name:'Fanta 1.5L',description:'',images:['img/bebidas/image (8).png'],categorySlug:'bebidas',prices:[{label:'botella',price:3200,order:0}]},
  {slug:'coca-vidrio-125l',name:'Coca Vidrio 1.25L',description:'',images:['img/bebidas/image (9).png'],categorySlug:'bebidas',prices:[{label:'botella',price:3000,order:0}]},
];

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hash = await bcrypt.hash('fredys2026admin', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@fredysburger.com' },
    update: {},
    create: { email: 'admin@fredysburger.com', password: hash, name: 'Admin Fredys' },
  });
  console.log('✅ Admin creado: admin@fredysburger.com / fredys2026admin');

  // Categorías
  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug }, update: cat, create: cat,
    });
    catMap[cat.slug] = created.id;
  }
  console.log(`✅ ${categories.length} categorías creadas`);

  // Productos
  for (const p of products) {
    const { categorySlug, prices, ...rest } = p;
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await prisma.productPrice.deleteMany({ where: { productId: existing.id } });
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...rest, categoryId: catMap[categorySlug], prices: { create: prices } },
      });
    } else {
      await prisma.product.create({
        data: { ...rest, categoryId: catMap[categorySlug], prices: { create: prices } },
      });
    }
  }
  console.log(`✅ ${products.length} productos creados`);
  console.log('🍔 Seed completo!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
