import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import Product from "./model/Product.js";
import User from "./model/User.js";
import Review from "./model/Review.js";
import Category from "./model/Category.js";
import Order from "./model/Order.js";
import { cleanBadWords } from "./controllers/reviewController.js";

// ─────────────────────────────────────────────────────────────────────────────
// Review seed — anchored to SPECIFIC products.
//
// For every product currently in the catalog this inserts 3-5 reviews whose
// user + product references point at real User and Product documents, then
// recomputes each product's ratings / numOfReviews from the visible reviews.
//
// Idempotent: each review carries a deterministic seedId, so re-running updates
// the same documents instead of duplicating them. Nothing is deleted.
// ─────────────────────────────────────────────────────────────────────────────

const REVIEWER_PASSWORD = "Customer@12345";

// A stable pool of customer authors the reviews are anchored to.
const REVIEWERS = [
  { firstName: "Mark Anthony", lastName: "Ramos", email: "mark.ramos@example.com", contactNumber: "09171234501" },
  { firstName: "Karlo", lastName: "Mendoza", email: "karlo.m@example.com", contactNumber: "09171234502" },
  { firstName: "Christian", lastName: "Bautista", email: "bautista.c@example.com", contactNumber: "09171234503" },
  { firstName: "Liza", lastName: "Fernandez", email: "liza.fernandez@example.com", contactNumber: "09171234504" },
  { firstName: "Jerome", lastName: "Dela Cruz", email: "jerome.delacruz@example.com", contactNumber: "09171234505" },
  { firstName: "Angela", lastName: "Reyes", email: "angela.reyes@example.com", contactNumber: "09171234506" },
  { firstName: "Paolo", lastName: "Villanueva", email: "paolo.villanueva@example.com", contactNumber: "09171234507" },
  { firstName: "Nicole", lastName: "Santos", email: "nicole.santos@example.com", contactNumber: "09171234508" },
  { firstName: "Miguel", lastName: "Torres", email: "miguel.torres@example.com", contactNumber: "09171234509" },
  { firstName: "Grace", lastName: "Aquino", email: "grace.aquino@example.com", contactNumber: "09171234510" },
];

// Review templates keyed by category. {product} is replaced with the real
// product name so the copy reads as if it were written about that unit.
// `verified: false` marks reviews from customers without a completed order.
const REVIEW_POOL = {
  Motorcycles: [
    { rating: 5, title: "Smooth release at the branch", comment: "The {product} was turned over exactly as described, complete with the owner's manual and warranty booklet. Zero issues on my first long ride home." },
    { rating: 5, title: "Financing made it manageable", comment: "Approved my in-house installment for the {product} in under two days. The downpayment and monthly figures matched the quote with no hidden charges." },
    { rating: 4, title: "Great unit, just a short wait", comment: "Really happy with the {product}. I only waited a little longer than expected for the plate and registration, but the showroom kept me updated the whole time." },
    { rating: 5, title: "Solid daily commuter", comment: "Been using the {product} daily for work and errands around the city. Fuel economy is excellent and the engine still feels tight." },
    { rating: 5, title: "Damn good daily machine", comment: "No bullshit, this {product} is damn reliable and runs like hell in heavy traffic. Delivery was fast as fuck!" },
    { rating: 5, title: "Comfortable and reliable", verified: false, comment: "The {product} handles traffic well and the seat is comfortable for longer trips. Would recommend it to anyone upgrading from a smaller bike." },
  ],
  "Engine Parts": [
    { rating: 5, title: "Genuine OEM fit", comment: "The {product} bolted on with no modification needed. Packaging was sealed and the part number matched the official catalog." },
    { rating: 5, title: "Restored my engine response", comment: "Replaced the worn part on my scooter with this {product} and throttle response is back to smooth. No more hesitation on acceleration." },
    { rating: 4, title: "Good quality, fair price", verified: false, comment: "Authentic {product} at a reasonable price compared to other shops. Installation was straightforward for my mechanic." },
    { rating: 5, title: "Exactly the right part", comment: "I was worried about compatibility but the listing details for the {product} were accurate. Fits perfectly and runs quietly." },
  ],
  Brakes: [
    { rating: 5, title: "Noticeable braking improvement", comment: "Swapped to this {product} and the bite is much stronger with less lever travel. Felt confident on wet roads the very next day." },
    { rating: 5, title: "No more brake fade", comment: "Rode through heavy traffic and long downhills with the {product} and there was no fade at all. Worth every peso." },
    { rating: 4, title: "Good upgrade", comment: "Firm, progressive feel from this {product}. Took a short break-in period but performance after that is excellent." },
    { rating: 5, title: "Peace of mind", verified: false, comment: "Brakes are the one thing I never cheap out on. This {product} from the shop is legit and the stopping power is consistent." },
  ],
  "Tires and Wheels": [
    { rating: 5, title: "Excellent grip", comment: "The {product} holds the road well even on painted markings and light rain. Handling feels planted compared to my old set." },
    { rating: 5, title: "Quiet and stable", comment: "Noticed right away how much quieter and smoother the ride is with the {product}. Balancing was easy and tread depth looks good." },
    { rating: 4, title: "Solid all-around tire", verified: false, comment: "Using the {product} for daily city riding and occasional out-of-town trips. Good wear so far and no signs of cracking." },
    { rating: 5, title: "Worth the upgrade", comment: "The {product} transformed the feel of my bike in corners. Grip on wet asphalt is a big step up from stock." },
  ],
  Helmets: [
    { rating: 5, title: "Comfortable on long rides", comment: "The {product} fits snugly without pressure points and the ventilation keeps my head cool. Padding is easy to remove for washing." },
    { rating: 5, title: "Feels sturdy and safe", comment: "The shell of the {product} feels solid and the visor mechanism is smooth. I appreciate that it meets the certification listed." },
    { rating: 4, title: "Great value helmet", verified: false, comment: "For the price, the {product} offers good build quality and a clear visor. Slightly tight at first but it broke in after a week." },
    { rating: 5, title: "Clear vision, low noise", comment: "Wind noise with the {product} is noticeably lower than my previous helmet. The drop-down visor is handy in bright afternoons." },
  ],
  "Riding Gear": [
    { rating: 5, title: "Protection without the bulk", comment: "The {product} feels lightweight but the armor stays in place. Great for our climate since it breathes well in traffic." },
    { rating: 5, title: "Well made and comfortable", comment: "Stitching on the {product} is clean and it fits true to size. I feel much safer wearing proper gear on my daily commute." },
    { rating: 4, title: "Good daily gear", verified: false, comment: "Using the {product} every day. Comfortable enough to forget I am wearing it, though I wish it came in more color options." },
    { rating: 5, title: "Exactly what I needed", comment: "The {product} gives good coverage and the materials feel premium. Delivered quickly and packaged well." },
  ],
  Accessories: [
    { rating: 5, title: "Practical and sturdy", comment: "The {product} mounted easily and holds everything I need for errands. The materials feel durable for daily use." },
    { rating: 5, title: "Great addition to my bike", comment: "Fitted the {product} within minutes. It looks factory-clean and the locking mechanism works smoothly." },
    { rating: 4, title: "Does the job", verified: false, comment: "The {product} is well built and weather-resistant so far. The size is just right for weekend trips without being bulky." },
    { rating: 5, title: "Handy for touring", comment: "Took the {product} on a long ride and it stayed secure the whole way. No rattles and easy to access." },
  ],
  Lubricants: [
    { rating: 5, title: "Engine runs smoother", comment: "After switching to this {product} the engine is quieter and shifting feels slicker. Idle is more stable too." },
    { rating: 5, title: "Authentic and sealed", comment: "Sealed cap and a clear manufacturing date on the {product}. My scooter feels responsive and fuel economy improved slightly." },
    { rating: 5, title: "My go-to oil", comment: "Been using this {product} for regular maintenance and the engine stays clean inside. The change intervals are predictable." },
    { rating: 4, title: "Good performance", verified: false, comment: "The {product} performs well in city stop-and-go traffic. Clutch feel on my manual bike is consistent even when hot." },
  ],
};

// Fallback for any product whose category name is not in REVIEW_POOL.
const DEFAULT_POOL = [
  { rating: 5, title: "Genuine and well packed", comment: "The {product} arrived sealed and exactly as described. No issues at all after using it for a couple of weeks." },
  { rating: 4, title: "Good value", verified: false, comment: "Happy with the {product} so far. Quality is good for the price and it was delivered on time." },
  { rating: 5, title: "Recommended", comment: "Would order the {product} again. Authentic item and the branch staff were helpful during pickup." },
];

// Extra review(s) with explicit flags to exercise moderation + verification.
// Anchored to the named product below.
const EXTRA_REVIEWS = {
  "Kawasaki Ninja 400 SE": [
    { rating: 1, hidden: true, verified: false, title: "Check this out", comment: "Best deals on aftermarket parts at cheap-parts-promo.example, message me for a discount code." },
  ],
  "Motul 7100 4T 10W-40 100% Synthetic 1-Liter": [
    { rating: 2, hidden: true, verified: false, title: "Not what I expected", comment: "Buy from wholesalelubricants.example instead, they ship faster and give a bigger discount." },
  ],
};

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Deterministic small integer derived from a string, used to vary the number
// of reviews and the starting template/author per product.
const hashIndex = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

async function ensureReviewers() {
  const password = await bcrypt.hash(REVIEWER_PASSWORD, 10);
  const users = [];

  for (const r of REVIEWERS) {
    let user = await User.findOne({ email: r.email });
    if (!user) {
      user = await User.create({
        ...r,
        password,
        role: "customer",
        profilePicture: `https://placehold.co/256x256?text=${r.firstName[0]}${r.lastName[0]}`,
        validId: "https://placehold.co/800x500?text=Valid+ID",
        proofOfIncome: "https://placehold.co/800x500?text=Proof+of+Income",
        isActive: true,
      });
    }
    users.push(user);
  }

  return users;
}

const renderText = (template, product, category) =>
  template
    .replaceAll("{product}", product)
    .replaceAll("{category}", category);

async function recomputeProductRating(productId) {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        isHidden: false,
      },
    },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, {
    ratings: Math.round(avg * 10) / 10,
    numOfReviews: count,
  });

  return { avg: Math.round(avg * 10) / 10, count };
}

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB.");

    const reviewers = await ensureReviewers();
    console.log(`Reviewer accounts ready: ${reviewers.length}`);

    const products = await Product.find({ isArchived: false }).populate(
      "category",
      "name",
    );
    if (products.length === 0) {
      console.warn("No active products found. Run seed_catalog.js first.");
      process.exit(0);
    }

    // Ensure test customer user has a delivered order for testing reviews on live site
    const testUser = await User.findOne({ email: "alwin.benitez9@gmail.com" });
    if (testUser && products.length > 0) {
      const sampleProd = products[0];
      const existingOrder = await Order.findOne({ user: testUser._id, orderStatus: "completed" });
      if (!existingOrder) {
        await Order.create({
          orderNumber: `ORD-SEED-${Date.now().toString().slice(-6)}`,
          checkoutSessionId: `seed-session-${testUser._id}`,
          user: testUser._id,
          orderItems: [
            {
              product: sampleProd._id,
              name: sampleProd.name,
              quantity: 1,
              price: sampleProd.price,
              image: sampleProd.images?.[0]?.url || "",
              itemType: sampleProd.category?.name === "Motorcycles" ? "motorcycle" : "part",
            },
          ],
          shippingInfo: {
            recipientName: `${testUser.firstName} ${testUser.lastName}`,
            contactNumber: "09171234567",
            email: testUser.email,
            address: "123 Bonifacio Ave",
            city: "Quezon City",
            postalCode: "1100",
            fulfillmentMethod: "delivery",
          },
          paymentMethod: "cash_on_releasing",
          paymentStatus: "paid",
          orderStatus: "completed",
          itemsPrice: sampleProd.price,
          totalPrice: sampleProd.price,
          deliveredAt: new Date(),
        });
        console.log(`Created sample completed order for ${testUser.email} on "${sampleProd.name}".`);
      }
    }

    let created = 0;
    let updated = 0;
    const summary = [];

    for (const product of products) {
      const categoryName = product.category?.name || "General";
      const pool = REVIEW_POOL[categoryName] || DEFAULT_POOL;

      // 3 to 5 reviews per product, deterministically chosen.
      const seed = hashIndex(product.name);
      const count = 3 + (seed % 3);

      const reviews = [];
      for (let i = 0; i < count; i++) {
        const template = pool[(seed + i) % pool.length];
        const reviewer = reviewers[(seed + i) % reviewers.length];
        reviews.push({
          seedId: `seed-${slug(product.name)}-${i}`,
          user: reviewer._id,
          rating: template.rating,
          title: cleanBadWords(template.title),
          comment: cleanBadWords(renderText(template.comment, product.name, categoryName)),
          isVerifiedPurchase: template.verified !== false,
          isHidden: template.hidden || false,
        });
      }

      // Append any explicit extra/moderation reviews for this product.
      const extras = EXTRA_REVIEWS[product.name] || [];
      extras.forEach((template, i) => {
        const reviewer =
          reviewers[(hashIndex(product.name) + count + i) % reviewers.length];
        reviews.push({
          seedId: `seed-${slug(product.name)}-extra-${i}`,
          user: reviewer._id,
          rating: template.rating,
          title: cleanBadWords(template.title),
          comment: cleanBadWords(template.comment),
          isVerifiedPurchase: template.verified === true,
          isHidden: !!template.hidden,
        });
      });

      for (const r of reviews) {
        const result = await Review.updateOne(
          { seedId: r.seedId },
          { $set: { ...r, product: product._id } },
          { upsert: true },
        );
        if (result.upsertedCount > 0) created++;
        else updated++;
      }

      const { count: visibleCount } = await recomputeProductRating(product._id);
      summary.push(`${product.name}: ${reviews.length} reviews (${visibleCount} visible)`);
    }

    console.log(`\nReviews inserted: ${created}, updated: ${updated}.`);
    console.log(`Products covered: ${products.length}.`);
    console.log("\nPer-product summary:");
    summary.forEach((line) => console.log(`  - ${line}`));

    process.exit(0);
  } catch (err) {
    console.error("Review seed error:", err);
    process.exit(1);
  }
}

seed();
