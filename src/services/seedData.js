import { v4 as uuidv4 } from 'uuid';

// 12 demo items with multiple variants across all categories
const now = new Date().toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const seedItems = [
  {
    id: 'item-001', name: 'Floral Wrap Dress', type: 'long_dress',
    occasions: ['casual', 'festive'], price: 2499, fabric: 'Georgette',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-3', shelf: 'A',
    internal_notes: 'Supplier: FabIndia, Cost: ₹1200', created_at: daysAgo(2), updated_at: daysAgo(2),
  },
  {
    id: 'item-002', name: 'Classic Cotton Kurti', type: 'kurti',
    occasions: ['casual', 'office'], price: 899, fabric: 'Cotton',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-1', shelf: 'B',
    internal_notes: 'Bestseller', created_at: daysAgo(3), updated_at: daysAgo(3),
  },
  {
    id: 'item-003', name: 'Silk Palazzo Set', type: 'coord_set',
    occasions: ['festive', 'wedding'], price: 4999, fabric: 'Art Silk',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-2', rack_number: 'R-5', shelf: 'C',
    internal_notes: '', created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    id: 'item-004', name: 'Denim High-Waist Shorts', type: 'shorts',
    occasions: ['casual'], price: 1299, fabric: 'Denim',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-2', shelf: 'A',
    internal_notes: 'Limited stock', created_at: daysAgo(5), updated_at: daysAgo(5),
  },
  {
    id: 'item-005', name: 'Embroidered Anarkali', type: 'long_dress',
    occasions: ['festive', 'wedding', 'party'], price: 6499, fabric: 'Net + Silk',
    is_new_arrival: false, is_deleted: false,
    godown_number: 'GD-2', rack_number: 'R-7', shelf: 'B',
    internal_notes: 'Premium range', created_at: daysAgo(15), updated_at: daysAgo(10),
  },
  {
    id: 'item-006', name: 'Linen Crop Top', type: 'top',
    occasions: ['casual', 'party'], price: 799, fabric: 'Linen',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-1', shelf: 'C',
    internal_notes: '', created_at: daysAgo(4), updated_at: daysAgo(4),
  },
  {
    id: 'item-007', name: 'Wide-Leg Trousers', type: 'bottom',
    occasions: ['office', 'casual'], price: 1599, fabric: 'Poly-Blend',
    is_new_arrival: false, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-4', shelf: 'A',
    internal_notes: 'Reorder from Surat supplier', created_at: daysAgo(12), updated_at: daysAgo(8),
  },
  {
    id: 'item-008', name: 'Sequin Party Top', type: 'top',
    occasions: ['party'], price: 1899, fabric: 'Sequin Georgette',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-2', rack_number: 'R-2', shelf: 'B',
    internal_notes: '', created_at: daysAgo(6), updated_at: daysAgo(6),
  },
  {
    id: 'item-009', name: 'Chikankari Straight Kurti', type: 'kurti',
    occasions: ['casual', 'office', 'festive'], price: 1499, fabric: 'Cotton Lawn',
    is_new_arrival: false, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-3', shelf: 'C',
    internal_notes: 'Lucknowi handwork', created_at: daysAgo(20), updated_at: daysAgo(14),
  },
  {
    id: 'item-010', name: 'Velvet Co-ord Set', type: 'coord_set',
    occasions: ['party', 'wedding'], price: 3999, fabric: 'Velvet',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-2', rack_number: 'R-6', shelf: 'A',
    internal_notes: 'Winter collection', created_at: daysAgo(3), updated_at: daysAgo(3),
  },
  {
    id: 'item-011', name: 'Striped Office Shirt', type: 'top',
    occasions: ['office', 'casual'], price: 1099, fabric: 'Cotton Blend',
    is_new_arrival: false, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-1', shelf: 'A',
    internal_notes: '', created_at: daysAgo(18), updated_at: daysAgo(11),
  },
  {
    id: 'item-012', name: 'Pleated Midi Skirt', type: 'bottom',
    occasions: ['casual', 'office', 'party'], price: 1399, fabric: 'Crepe',
    is_new_arrival: true, is_deleted: false,
    godown_number: 'GD-1', rack_number: 'R-4', shelf: 'B',
    internal_notes: '', created_at: daysAgo(2), updated_at: daysAgo(2),
  },
];

// Generate variants for each item — multiple colours and sizes
const colourSets = {
  'item-001': [
    { name: 'Peach', hex: '#F4A261' },
    { name: 'Navy Blue', hex: '#264653' },
    { name: 'Dusty Rose', hex: '#D4A5A5' },
  ],
  'item-002': [
    { name: 'White', hex: '#FAFAFA' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Mint Green', hex: '#98D8C8' },
  ],
  'item-003': [
    { name: 'Maroon', hex: '#800020' },
    { name: 'Gold', hex: '#D4AF37' },
  ],
  'item-004': [
    { name: 'Classic Blue', hex: '#4169E1' },
    { name: 'Black', hex: '#1A1A2E' },
  ],
  'item-005': [
    { name: 'Wine Red', hex: '#722F37' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Blush Pink', hex: '#F5C6C6' },
  ],
  'item-006': [
    { name: 'Off White', hex: '#FAF0E6' },
    { name: 'Sage Green', hex: '#9DC183' },
    { name: 'Lavender', hex: '#B57EDC' },
  ],
  'item-007': [
    { name: 'Beige', hex: '#D4C5A9' },
    { name: 'Charcoal', hex: '#36454F' },
  ],
  'item-008': [
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Silver', hex: '#C0C0C0' },
  ],
  'item-009': [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Powder Blue', hex: '#B0C4DE' },
    { name: 'Lemon Yellow', hex: '#FFF44F' },
  ],
  'item-010': [
    { name: 'Deep Purple', hex: '#4A0E4E' },
    { name: 'Emerald Green', hex: '#046307' },
  ],
  'item-011': [
    { name: 'Blue Stripe', hex: '#4682B4' },
    { name: 'Pink Stripe', hex: '#DB7093' },
  ],
  'item-012': [
    { name: 'Coral', hex: '#FF6F61' },
    { name: 'Olive Green', hex: '#808000' },
    { name: 'Slate Blue', hex: '#6A5ACD' },
  ],
};

const sizeSets = {
  'item-001': ['S', 'M', 'L', 'XL'],
  'item-002': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'item-003': ['S', 'M', 'L', 'XL'],
  'item-004': ['XS', 'S', 'M', 'L'],
  'item-005': ['S', 'M', 'L', 'XL', 'XXL'],
  'item-006': ['XS', 'S', 'M', 'L'],
  'item-007': ['S', 'M', 'L', 'XL', 'XXL'],
  'item-008': ['XS', 'S', 'M', 'L'],
  'item-009': ['S', 'M', 'L', 'XL'],
  'item-010': ['S', 'M', 'L'],
  'item-011': ['S', 'M', 'L', 'XL'],
  'item-012': ['XS', 'S', 'M', 'L', 'XL'],
};

export const seedVariants = [];

seedItems.forEach(item => {
  const colours = colourSets[item.id] || [];
  const sizes = sizeSets[item.id] || [];
  colours.forEach(colour => {
    sizes.forEach(size => {
      // Mark a few variants as sold for demo
      const isSold = (
        (item.id === 'item-005' && colour.name === 'Blush Pink' && size === 'M') ||
        (item.id === 'item-007' && colour.name === 'Beige' && size === 'L') ||
        (item.id === 'item-009' && colour.name === 'White' && size === 'S')
      );
      seedVariants.push({
        id: uuidv4(),
        item_id: item.id,
        colour_name: colour.name,
        colour_hex: colour.hex,
        size,
        image_url: `https://picsum.photos/seed/${item.id}-${colour.name.replace(/\s/g, '')}/400/500`,
        status: isSold ? 'sold' : 'available',
        sold_at: isSold ? daysAgo(1) : null,
      });
    });
  });
});
