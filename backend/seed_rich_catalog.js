import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Category from "./model/Category.js";
import Brand from "./model/Brand.js";
import Product from "./model/Product.js";
import User from "./model/User.js";

const sampleProducts = [
  // ── MOTORCYCLES ────────────────────────────────────────────────────────────
  {
    name: "Honda Click 125i V3",
    description: "Liquid-cooled, 125cc PGM-FI eSP engine with Honda Smart Key and full digital meter panel.",
    categoryName: "Motorcycles",
    brandName: "Honda",
    price: 81400,
    stock: 5,
    ratings: 4.8,
    numOfReviews: 34,
    installmentEligible: true,
    minInstallmentPrice: 16280,
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800",
  },
  {
    name: "Yamaha NMAX 155 ABS",
    description: "Premium maxi-scooter powered by a 155cc Blue Core engine with VVA and dual-channel ABS.",
    categoryName: "Motorcycles",
    brandName: "Yamaha",
    price: 151900,
    stock: 4,
    ratings: 4.9,
    numOfReviews: 58,
    installmentEligible: true,
    minInstallmentPrice: 30380,
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  },
  {
    name: "Yamaha Aerox 155 S Version",
    description: "Aggressive sporty design with 155cc liquid-cooled VVA engine, ABS, and smart key system.",
    categoryName: "Motorcycles",
    brandName: "Yamaha",
    price: 145000,
    stock: 3,
    ratings: 4.7,
    numOfReviews: 42,
    installmentEligible: true,
    minInstallmentPrice: 29000,
    imageUrl: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800",
  },
  {
    name: "Honda ADV 160",
    description: "Urban adventure scooter with long-travel suspension, higher ground clearance, and HSTC traction control.",
    categoryName: "Motorcycles",
    brandName: "Honda",
    price: 166900,
    stock: 2,
    ratings: 4.9,
    numOfReviews: 29,
    installmentEligible: true,
    minInstallmentPrice: 33380,
    imageUrl: "https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?w=800",
  },
  {
    name: "Suzuki Raider R150 Fi",
    description: "The Underbone King. 147.3cc DOHC 4-valve fuel-injected engine delivering class-leading acceleration.",
    categoryName: "Motorcycles",
    brandName: "Suzuki",
    price: 119900,
    stock: 6,
    ratings: 4.6,
    numOfReviews: 38,
    installmentEligible: true,
    minInstallmentPrice: 23980,
    imageUrl: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=800",
  },
  {
    name: "Kawasaki Ninja 400 SE",
    description: "High-performance twin-cylinder 399cc sports machine equipped with assist and slipper clutch.",
    categoryName: "Motorcycles",
    brandName: "Kawasaki",
    price: 340000,
    stock: 2,
    ratings: 5.0,
    numOfReviews: 19,
    installmentEligible: true,
    minInstallmentPrice: 68000,
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
  },
  {
    name: "CFMOTO 450SR Sport",
    description: "Aerodynamic race-developed supersport with 449cc parallel-twin 270-degree crankshaft and Brembo brakes.",
    categoryName: "Motorcycles",
    brandName: "CFMOTO",
    price: 299900,
    stock: 3,
    ratings: 4.7,
    numOfReviews: 15,
    installmentEligible: true,
    minInstallmentPrice: 59980,
    imageUrl: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800",
  },

  // ── ENGINE PARTS ───────────────────────────────────────────────────────────
  {
    name: "Yamaha Genuine V-Belt & Roller Weight Kit (NMAX/Aerox)",
    description: "Official OEM reinforced drive belt and calibrated 13g slider rollers for Blue Core 155cc.",
    categoryName: "Engine Parts",
    brandName: "Yamaha",
    price: 1850,
    stock: 15,
    ratings: 4.8,
    numOfReviews: 45,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Honda Genuine PGM-FI Fuel Injector Nozzle (Click/Beat)",
    description: "High-precision replacement injector nozzle ensuring optimal fuel atomization and air-fuel ratio.",
    categoryName: "Engine Parts",
    brandName: "Honda",
    price: 1450,
    stock: 12,
    ratings: 4.5,
    numOfReviews: 18,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Suzuki Raider 150 DOHC Valve Spring & Shim Set",
    description: "Hardened steel high-RPM valve spring assembly for high-compression racing or rebuilds.",
    categoryName: "Engine Parts",
    brandName: "Suzuki",
    price: 2200,
    stock: 8,
    ratings: 4.4,
    numOfReviews: 11,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Kawasaki High-Performance Spark Plug Iridium Laser (CR9EIA-9)",
    description: "Long-life fine-wire iridium center electrode ensuring instant ignition and improved throttle response.",
    categoryName: "Engine Parts",
    brandName: "Kawasaki",
    price: 650,
    stock: 30,
    ratings: 4.9,
    numOfReviews: 62,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },

  // ── BRAKES ─────────────────────────────────────────────────────────────────
  {
    name: "Brembo Sintered Brake Pads Front Caliper (Yamaha/Honda)",
    description: "High-friction sintered metallic compound offering progressive bite and thermal fade resistance.",
    categoryName: "Brakes",
    brandName: "Yamaha",
    price: 1890,
    stock: 20,
    ratings: 4.9,
    numOfReviews: 73,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Honda Genuine Front Disc Rotor 220mm (Click 125/150)",
    description: "Precision-ground stainless steel front disc brake rotor with heat-dissipating ventilation holes.",
    categoryName: "Brakes",
    brandName: "Honda",
    price: 1350,
    stock: 10,
    ratings: 4.6,
    numOfReviews: 24,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Kawasaki Braided Steel Brake Line Hose Kit",
    description: "Zero-expansion PTFE core with braided stainless steel casing for firm and precise lever feel.",
    categoryName: "Brakes",
    brandName: "Kawasaki",
    price: 2800,
    stock: 7,
    ratings: 4.7,
    numOfReviews: 16,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },

  // ── TIRES AND WHEELS ───────────────────────────────────────────────────────
  {
    name: "Pirelli Angel Scooter Tubeless Tire (110/70-14 Front)",
    description: "Reinforced structure with cross grooves for maximum wet grip, braking confidence, and stability.",
    categoryName: "Tires and Wheels",
    brandName: "Yamaha",
    price: 2650,
    stock: 14,
    ratings: 4.8,
    numOfReviews: 41,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800",
  },
  {
    name: "Michelin City Grip 2 All-Weather Tire (130/70-13 Rear)",
    description: "Silica-based rubber compound designed to conquer slippery city painted road marks and wet asphalt.",
    categoryName: "Tires and Wheels",
    brandName: "Honda",
    price: 3200,
    stock: 12,
    ratings: 4.9,
    numOfReviews: 53,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800",
  },
  {
    name: "Suzuki Enkei Lightweight Alloy Wheel Set (Front & Rear 17-inch)",
    description: "Aerodynamic lightweight alloy wheels improving unsprung weight and cornering responsiveness.",
    categoryName: "Tires and Wheels",
    brandName: "Suzuki",
    price: 6800,
    stock: 4,
    ratings: 4.6,
    numOfReviews: 12,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800",
  },

  // ── HELMETS ────────────────────────────────────────────────────────────────
  {
    name: "HJC C10 Full-Face Helmet ECE 22.06 Matte Black",
    description: "Advanced polycarbonate composite shell with ACS advanced channeling ventilation system and Pinlock ready.",
    categoryName: "Helmets",
    brandName: "Yamaha",
    price: 5490,
    stock: 8,
    ratings: 4.8,
    numOfReviews: 67,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800",
  },
  {
    name: "LS2 Stream II Dual Visor Helmet Gloss White",
    description: "KPA kinetic polymer alloy shell with integrated drop-down sun visor and laser-cut comfort foam.",
    categoryName: "Helmets",
    brandName: "Honda",
    price: 4300,
    stock: 11,
    ratings: 4.7,
    numOfReviews: 39,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800",
  },
  {
    name: "MT Helmets Thunder 4 SV Solid Titanium",
    description: "ECE 22.06 certified shell with quick-release aerodynamic rear spoiler and hypoallergenic liners.",
    categoryName: "Helmets",
    brandName: "CFMOTO",
    price: 6200,
    stock: 5,
    ratings: 4.9,
    numOfReviews: 22,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800",
  },

  // ── RIDING GEAR ────────────────────────────────────────────────────────────
  {
    name: "Komine Armored Mesh Riding Jacket JK-128",
    description: "Full CE Level 2 shoulder, elbow, chest, and back protectors with breathable textile mesh ventilation.",
    categoryName: "Riding Gear",
    brandName: "Honda",
    price: 6900,
    stock: 7,
    ratings: 4.8,
    numOfReviews: 31,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800",
  },
  {
    name: "Taichi Carbon Protective Summer Gloves RST448",
    description: "Carbon knuckle protection with touchscreen compatible fingertips and perforated leather ventilation.",
    categoryName: "Riding Gear",
    brandName: "Yamaha",
    price: 3450,
    stock: 16,
    ratings: 4.7,
    numOfReviews: 48,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800",
  },

  // ── ACCESSORIES ────────────────────────────────────────────────────────────
  {
    name: "Givi B32N Bold Monolock 32-Liter Top Box",
    description: "Heavy-duty 32L square top case capable of holding 1 modular full-face helmet with base plate included.",
    categoryName: "Accessories",
    brandName: "Honda",
    price: 3100,
    stock: 18,
    ratings: 4.6,
    numOfReviews: 54,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800",
  },
  {
    name: "Motowolf Handlebar CNC Phone Mount with Vibration Dampener",
    description: "Aerospace-grade aluminum bracket with rubberized dampener pads protecting phone camera OIS sensors.",
    categoryName: "Accessories",
    brandName: "Yamaha",
    price: 980,
    stock: 25,
    ratings: 4.5,
    numOfReviews: 89,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800",
  },

  // ── LUBRICANTS ─────────────────────────────────────────────────────────────
  {
    name: "Motul 7100 4T 10W-40 100% Synthetic 1-Liter",
    description: "Ester technology 4-stroke engine oil meeting JASO MA2 specifications for optimum wet clutch response.",
    categoryName: "Lubricants",
    brandName: "Kawasaki",
    price: 750,
    stock: 40,
    ratings: 4.9,
    numOfReviews: 120,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Yamalube AT 10W-40 Fully Synthetic Scooter Oil 800ml",
    description: "Specially formulated for automatic scooters meeting JASO MB standard with low friction performance.",
    categoryName: "Lubricants",
    brandName: "Yamaha",
    price: 380,
    stock: 35,
    ratings: 4.8,
    numOfReviews: 95,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
  {
    name: "Honda Genuine Pro 4-Stroke Scooter Oil 10W-30 SL/MB 1L",
    description: "Recommended by Honda R&D for Click, Beat, and ADV scooters ensuring superior fuel efficiency.",
    categoryName: "Lubricants",
    brandName: "Honda",
    price: 295,
    stock: 50,
    ratings: 4.7,
    numOfReviews: 110,
    installmentEligible: false,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB Atlas");

    const admin = await User.findOne({ role: "admin" }) || await User.findOne();
    if (!admin) {
      console.error("No user found in DB to assign as author");
      process.exit(1);
    }

    const categories = await Category.find();
    const brands = await Brand.find();

    const catMap = {};
    categories.forEach((c) => (catMap[c.name] = c._id));

    const brandMap = {};
    brands.forEach((b) => (brandMap[b.name] = b._id));

    console.log("Seeding catalog products...");

    let createdCount = 0;
    for (const p of sampleProducts) {
      const catId = catMap[p.categoryName];
      const brandId = brandMap[p.brandName];

      if (!catId || !brandId) {
        console.warn(`Skipping ${p.name}: category or brand not found`);
        continue;
      }

      await Product.findOneAndUpdate(
        { name: p.name },
        {
          name: p.name,
          description: p.description,
          category: catId,
          brand: brandId,
          price: p.price,
          stock: p.stock,
          ratings: p.ratings,
          numOfReviews: p.numOfReviews,
          installmentEligible: p.installmentEligible,
          minInstallmentPrice: p.minInstallmentPrice || Math.round(p.price * 0.2),
          images: [
            {
              url: p.imageUrl,
              publicId: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            },
          ],
          user: admin._id,
          isArchived: false,
        },
        { upsert: true, new: true }
      );
      createdCount++;
    }

    const totalNow = await Product.countDocuments();
    console.log(`✓ Seed finished! Upserted ${createdCount} products. Total products in DB: ${totalNow}`);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
