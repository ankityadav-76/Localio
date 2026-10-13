import type { Listing, MenuItem } from "../types";

/**
 * Local demo menu used only when a listing has no menu configured on the API.
 * These are illustrative defaults, not vendor-confirmed products or prices.
 */
export function buildSampleMenu(listing: Listing): MenuItem[] {
  const identity = `${listing.name} ${listing.famous_for ?? ""} ${listing.description ?? ""}`.toLowerCase();
  let choices: Array<[string, string, number]>;

  if (/sandwich|toast|grill|burger/.test(identity)) {
    choices = [
      ["Classic Veg Sandwich", "Fresh vegetables, chutney and house masala.", 70],
      ["Cheese Grilled Sandwich", "Grilled bread with melted cheese and seasoning.", 100],
      ["Spicy Masala Toast", "Crisp toast with a spicy Indian potato filling.", 80],
      ["Loaded Cheese Sandwich", "A hearty grilled sandwich with extra cheese.", 120],
      ["Fresh Lime Soda", "Refreshing lime soda, sweet or salted.", 40],
    ];
  } else if (/gujarati|thali|dining|unlimited|punjabi|north indian/.test(identity)) {
    choices = [
      ["Gujarati Mini Thali", "Rotli, seasonal sabzi, dal, rice and accompaniments.", 150],
      ["Special Unlimited Thali", "A filling traditional thali with rotating daily dishes.", 220],
      ["Khaman Dhokla", "Soft steamed gram-flour snack with green chutney.", 60],
      ["Masala Chaas", "Chilled buttermilk with roasted cumin.", 35],
      ["Gulab Jamun", "Classic syrup-soaked dessert.", 50],
    ];
  } else if (/chaat|pani puri|golgappa|bhel|pav|vada/.test(identity)) {
    choices = [
      ["Pani Puri", "Crisp puris served with tangy spiced water.", 50],
      ["Sev Puri", "Crisp puris topped with chutneys, potato and sev.", 60],
      ["Bhel Puri", "Puffed rice tossed with vegetables and chutneys.", 60],
      ["Dahi Puri", "Puris filled with yogurt, chutneys and spices.", 70],
      ["Masala Chaas", "Chilled buttermilk with roasted cumin.", 35],
    ];
  } else if (/tea|chai|coffee|cafe|beverage|juice/.test(identity)) {
    choices = [
      ["Masala Chai", "Freshly brewed tea with warming spices.", 20],
      ["Ginger Tea", "Hot tea brewed with fresh ginger.", 25],
      ["Filter Coffee", "Rich coffee with a smooth, frothy finish.", 40],
      ["Veg Toast", "Toasted bread with vegetables and seasoning.", 50],
      ["Bun Maska", "Soft bun served with a buttery spread.", 35],
    ];
  } else if (/dosa|idli|south indian|uttapam|sambar/.test(identity)) {
    choices = [
      ["Plain Dosa", "Crisp dosa served with chutney and sambar.", 80],
      ["Masala Dosa", "Dosa filled with seasoned potato masala.", 110],
      ["Idli Sambar", "Steamed idlis with sambar and chutney.", 60],
      ["Medu Vada", "Crisp lentil fritters served with chutney.", 60],
      ["Filter Coffee", "Traditional South Indian filter coffee.", 40],
    ];
  } else {
    choices = [
      ["House Special Snack", "A popular-style local snack with house spices.", 70],
      ["Classic Masala Special", "A flavourful Indian street-food favourite.", 90],
      ["Cheese Special", "A rich, cheesy take on a local favourite.", 110],
      ["Crispy Snack Plate", "A crunchy snack served with chutney.", 60],
      ["Fresh Lime Soda", "Refreshing lime soda, sweet or salted.", 40],
    ];
  }

  return choices.map(([name, description, price], index) => ({
    id: -(listing.id * 100 + index + 1),
    listing_id: listing.id,
    name,
    description,
    price,
    image_url: null,
    is_available: true,
  }));
}
