import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import Category from "./model/Category.js";
import Brand from "./model/Brand.js";
import Product from "./model/Product.js";
import User from "./model/User.js";

// ─────────────────────────────────────────────────────────────────────────────
// Catalog seed with MULTIPLE images per product.
//
// Photos are real, openly-licensed images served directly from Wikimedia
// Commons (thumb.wikimedia.org / upload.wikimedia.org). The Product.images
// array stores { url, publicId }; for these external URLs the publicId is a
// stable synthetic id (mirrors the pattern already used in seed_rich_catalog).
//
// Idempotent: upserts categories, brands, an admin author, and products by
// name. Existing documents are updated in place (images are replaced with the
// multi-photo set below). Nothing is deleted.
// ─────────────────────────────────────────────────────────────────────────────

const W = (path) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`;
const U = (path) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

// Curated per-product photo sets (3-4 distinct real photos each).
const PHOTOS = {
  // ── Motorcycles ───────────────────────────────────────────────────────────
  "Honda Click 125i V3": [
    W("6/61/2022_Honda_Click_125.jpg/960px-2022_Honda_Click_125.jpg"),
    W("1/1f/Honda_Click_150_version_2_model_2019.jpg/960px-Honda_Click_150_version_2_model_2019.jpg"),
    W("9/90/Honda_Click%2C_Trang%2C_Thailand.jpg/960px-Honda_Click%2C_Trang%2C_Thailand.jpg"),
    U("c/cc/Honda_Click_150.jpg"),
  ],
  "Yamaha NMAX 155 ABS": [
    W("7/74/2020_Yamaha_NMAX_155_ABS_%2820200810%29_01.jpg/960px-2020_Yamaha_NMAX_155_ABS_%2820200810%29_01.jpg"),
    W("7/72/2020_Yamaha_NMAX_155_ABS_%2820200810%29_02.jpg/960px-2020_Yamaha_NMAX_155_ABS_%2820200810%29_02.jpg"),
    W("6/63/2025_Yamaha_NMAX_155_Standard.jpg/960px-2025_Yamaha_NMAX_155_Standard.jpg"),
    W("8/87/Yamaha_Nmax_155_front.jpg/960px-Yamaha_Nmax_155_front.jpg"),
  ],
  "Yamaha Aerox 155 S Version": [
    W("d/d6/2019_Yamaha_Aerox_155_VVA_S-Version_%2820191018%29.jpg/960px-2019_Yamaha_Aerox_155_VVA_S-Version_%2820191018%29.jpg"),
    W("7/7c/2021_Yamaha_Aerox_155_ABS.jpg/960px-2021_Yamaha_Aerox_155_ABS.jpg"),
    W("b/b6/2021_Yamaha_Aerox_155_VVA_%2820220519%29.jpg/960px-2021_Yamaha_Aerox_155_VVA_%2820220519%29.jpg"),
    W("7/7e/2025_Yamaha_Aerox_155_ABS.jpg/960px-2025_Yamaha_Aerox_155_ABS.jpg"),
  ],
  "Honda PCX 160": [
    W("d/d8/2021_Honda_PCX_160_Standard.jpg/960px-2021_Honda_PCX_160_Standard.jpg"),
    W("c/cc/2022_Honda_PCX_160_Gray_Black.jpg/960px-2022_Honda_PCX_160_Gray_Black.jpg"),
    U("7/76/2022_Honda_PCX_160.jpg"),
    W("2/2d/Honda_Beat_%283720658046%29.jpg/960px-Honda_Beat_%283720658046%29.jpg"),
  ],
  "Suzuki Raider R150 Fi": [
    U("4/4d/Suzuki_Raider_150.jpg"),
    W("0/09/Suzuki_Raider_150_Thailand.jpg/960px-Suzuki_Raider_150_Thailand.jpg"),
    W("9/9e/Customized_Suzuki_Raider_150R_New_Breed_%282013_Model%29.jpg/960px-Customized_Suzuki_Raider_150R_New_Breed_%282013_Model%29.jpg"),
  ],
  "Kawasaki Ninja 400 SE": [
    W("8/8f/Kawasaki_Ninja_400_June_2022.jpg/960px-Kawasaki_Ninja_400_June_2022.jpg"),
    W("b/b5/Kawasaki_Ninja_400_KRT_SlantView.jpg/960px-Kawasaki_Ninja_400_KRT_SlantView.jpg"),
    W("b/b9/Kawasaki_Ninja_400.jpg/960px-Kawasaki_Ninja_400.jpg"),
    W("5/56/Kawasaki_Ninja_400_%2854940590053%29.jpg/960px-Kawasaki_Ninja_400_%2854940590053%29.jpg"),
  ],
  "CFMOTO 450SR Sport": [
    W("c/ce/%E6%98%A5%E9%A3%8E250SR%E6%91%A9%E6%89%98%E8%BD%A6.jpg/960px-%E6%98%A5%E9%A3%8E250SR%E6%91%A9%E6%89%98%E8%BD%A6.jpg"),
    W("2/2b/CFMOTO_700_MT_2024.jpg/960px-CFMOTO_700_MT_2024.jpg"),
    W("7/7c/Moscow%2C_CFMoto_SR-S_750%2C_Sept_2026_01.jpg/960px-Moscow%2C_CFMoto_SR-S_750%2C_Sept_2026_01.jpg"),
  ],

  // ── Engine Parts ──────────────────────────────────────────────────────────
  "Yamaha Genuine V-Belt & Roller Weight Kit (NMAX/Aerox)": [
    W("1/13/Motorcycle_Engine_Block.jpg/960px-Motorcycle_Engine_Block.jpg"),
    U("4/4f/Keihin_carburetor.jpg"),
    W("6/64/Anzani_motorcycle_engine_%287730998634%29.jpg/960px-Anzani_motorcycle_engine_%287730998634%29.jpg"),
  ],
  "Honda Genuine PGM-FI Fuel Injector Nozzle (Click/Beat)": [
    U("4/4f/Keihin_carburetor.jpg"),
    W("7/7a/Honda_VTX_1800_C_2007_-_engine_side_view.jpg/960px-Honda_VTX_1800_C_2007_-_engine_side_view.jpg"),
    W("1/13/Motorcycle_Engine_Block.jpg/960px-Motorcycle_Engine_Block.jpg"),
  ],
  "Suzuki Raider 150 DOHC Valve Spring & Shim Set": [
    W("1/13/Motorcycle_Engine_Block.jpg/960px-Motorcycle_Engine_Block.jpg"),
    W("6/64/Anzani_motorcycle_engine_%287730998634%29.jpg/960px-Anzani_motorcycle_engine_%287730998634%29.jpg"),
    W("7/7a/Honda_VTX_1800_C_2007_-_engine_side_view.jpg/960px-Honda_VTX_1800_C_2007_-_engine_side_view.jpg"),
  ],
  "Kawasaki Iridium Spark Plug CR9EIA-9": [
    W("6/64/Anzani_motorcycle_engine_%287730998634%29.jpg/960px-Anzani_motorcycle_engine_%287730998634%29.jpg"),
    W("1/13/Motorcycle_Engine_Block.jpg/960px-Motorcycle_Engine_Block.jpg"),
    U("4/4f/Keihin_carburetor.jpg"),
  ],

  // ── Brakes ────────────────────────────────────────────────────────────────
  "Brembo Sintered Brake Pads Front Caliper": [
    W("c/cd/Brembo_Disc_brake.jpg/960px-Brembo_Disc_brake.jpg"),
    W("a/a5/Brembo_motorcycle_brake.jpg/960px-Brembo_motorcycle_brake.jpg"),
    W("1/1b/Detail_of_disk_brake_of_motorbike_Honda_CBR_1000_%282023%29.jpg/960px-Detail_of_disk_brake_of_motorbike_Honda_CBR_1000_%282023%29.jpg"),
  ],
  "Honda Genuine Front Disc Rotor 220mm (Click 125/150)": [
    W("a/ab/Aprilia_disc_brake.jpg/960px-Aprilia_disc_brake.jpg"),
    W("c/cd/Brembo_Disc_brake.jpg/960px-Brembo_Disc_brake.jpg"),
    W("1/1b/Detail_of_disk_brake_of_motorbike_Honda_CBR_1000_%282023%29.jpg/960px-Detail_of_disk_brake_of_motorbike_Honda_CBR_1000_%282023%29.jpg"),
  ],
  "Kawasaki Braided Steel Brake Line Hose Kit": [
    W("1/1b/Detail_of_disk_brake_of_motorbike_Honda_CBR_1000_%282023%29.jpg/960px-Detail_of_disk_brake_of_motorbike_Honda_CBR_1000_%282023%29.jpg"),
    W("a/a5/Brembo_motorcycle_brake.jpg/960px-Brembo_motorcycle_brake.jpg"),
    W("a/ab/Aprilia_disc_brake.jpg/960px-Aprilia_disc_brake.jpg"),
  ],

  // ── Tires and Wheels ──────────────────────────────────────────────────────
  "Pirelli Angel Scooter Tubeless Tire (110/70-14 Front)": [
    U("4/40/Dunlop_TT100_tyre.JPG"),
    W("1/17/Motorcycle_tire_in_tire_warmer_%281%29.jpg/960px-Motorcycle_tire_in_tire_warmer_%281%29.jpg"),
    W("c/ce/74_R90s_Front_Wheel.JPG/960px-74_R90s_Front_Wheel.JPG"),
  ],
  "Michelin City Grip 2 All-Weather Tire (130/70-13 Rear)": [
    W("1/17/Motorcycle_tire_in_tire_warmer_%281%29.jpg/960px-Motorcycle_tire_in_tire_warmer_%281%29.jpg"),
    U("4/40/Dunlop_TT100_tyre.JPG"),
    W("5/51/Honda_CB_1000R_wheel.jpg/960px-Honda_CB_1000R_wheel.jpg"),
  ],
  "Suzuki Enkei Lightweight Alloy Wheel Set (Front & Rear 17-inch)": [
    W("5/51/Honda_CB_1000R_wheel.jpg/960px-Honda_CB_1000R_wheel.jpg"),
    W("c/ce/74_R90s_Front_Wheel.JPG/960px-74_R90s_Front_Wheel.JPG"),
    U("4/40/Dunlop_TT100_tyre.JPG"),
  ],

  // ── Helmets ───────────────────────────────────────────────────────────────
  "HJC C10 Full-Face Helmet ECE 22.06 Matte Black": [
    W("d/de/HJC_Helmet_RPHA_11.jpg/960px-HJC_Helmet_RPHA_11.jpg"),
    W("9/90/Full-Face_Helmet_9274.jpg/960px-Full-Face_Helmet_9274.jpg"),
    U("c/c4/BlackFullCoverageMotorcycleHelmet.jpg"),
  ],
  "LS2 Stream II Dual Visor Helmet Gloss White": [
    U("a/a9/White_full-face-helmet.jpg"),
    W("9/90/Full-Face_Helmet_9274.jpg/960px-Full-Face_Helmet_9274.jpg"),
    U("8/88/Scorpion_motorcycle_helmet_%281%29.jpg"),
  ],
  "MT Helmets Thunder 4 SV Solid Titanium": [
    U("8/88/Scorpion_motorcycle_helmet_%281%29.jpg"),
    W("d/de/HJC_Helmet_RPHA_11.jpg/960px-HJC_Helmet_RPHA_11.jpg"),
    U("a/a9/White_full-face-helmet.jpg"),
  ],

  // ── Riding Gear ───────────────────────────────────────────────────────────
  "Komine Armored Mesh Riding Jacket JK-128": [
    W("a/aa/Black_worn_leather_jacket_detail_1.jpg/960px-Black_worn_leather_jacket_detail_1.jpg"),
    W("a/a8/Metal_Motorcycle_Gloves.jpg/960px-Metal_Motorcycle_Gloves.jpg"),
    W("9/95/MotorcycleRacingGlove.jpg/960px-MotorcycleRacingGlove.jpg"),
  ],
  "Taichi Carbon Protective Summer Gloves RST448": [
    W("6/64/Dainese_racing_gloves.jpg/960px-Dainese_racing_gloves.jpg"),
    W("a/a8/Metal_Motorcycle_Gloves.jpg/960px-Metal_Motorcycle_Gloves.jpg"),
    W("9/95/MotorcycleRacingGlove.jpg/960px-MotorcycleRacingGlove.jpg"),
  ],
  "Alpinestars S-MX Riding Boots": [
    W("5/56/Alpinestars_S-MX_Motorcycle_boots.jpg/960px-Alpinestars_S-MX_Motorcycle_boots.jpg"),
    W("9/95/MotorcycleRacingGlove.jpg/960px-MotorcycleRacingGlove.jpg"),
    W("6/64/Dainese_racing_gloves.jpg/960px-Dainese_racing_gloves.jpg"),
  ],

  // ── Accessories ───────────────────────────────────────────────────────────
  "Givi B32N Bold Monolock 32-Liter Top Box": [
    W("c/cc/Piaggio_Liberty_with_Top_Box.jpg/960px-Piaggio_Liberty_with_Top_Box.jpg"),
    W("6/6f/Panniers_5467.jpg/960px-Panniers_5467.jpg"),
    W("1/15/KTM_Adventure_motorcycle_with_panniers.jpg/960px-KTM_Adventure_motorcycle_with_panniers.jpg"),
  ],
  "Shad Soft Side Pannier Bags (Pair)": [
    W("6/6f/Panniers_5467.jpg/960px-Panniers_5467.jpg"),
    W("1/15/KTM_Adventure_motorcycle_with_panniers.jpg/960px-KTM_Adventure_motorcycle_with_panniers.jpg"),
    W("c/cc/Piaggio_Liberty_with_Top_Box.jpg/960px-Piaggio_Liberty_with_Top_Box.jpg"),
  ],

  // ── Lubricants ────────────────────────────────────────────────────────────
  "Motul 7100 4T 10W-40 100% Synthetic 1-Liter": [
    U("b/bb/Mobil_1_motor_oil.jpg"),
    W("6/6c/Motor_oil_for_cars_and_motorcycles_from_various_producers_in_German_hardware_store.jpg/960px-Motor_oil_for_cars_and_motorcycles_from_various_producers_in_German_hardware_store.jpg"),
    U("a/a2/Castrol_gtx_motoroil.jpg"),
  ],
  "Yamalube AT 10W-40 Fully Synthetic Scooter Oil 800ml": [
    W("6/6c/Motor_oil_for_cars_and_motorcycles_from_various_producers_in_German_hardware_store.jpg/960px-Motor_oil_for_cars_and_motorcycles_from_various_producers_in_German_hardware_store.jpg"),
    U("4/4a/LUBTROL_JSE_EDGE_5W-40_Motor_Oil_4L_Bottle.jpg"),
    U("b/bb/Mobil_1_motor_oil.jpg"),
  ],
  "Honda Genuine Pro 4-Stroke Scooter Oil 10W-30 SL/MB 1L": [
    U("4/4a/LUBTROL_JSE_EDGE_5W-40_Motor_Oil_4L_Bottle.jpg"),
    U("a/a2/Castrol_gtx_motoroil.jpg"),
    W("6/6c/Motor_oil_for_cars_and_motorcycles_from_various_producers_in_German_hardware_store.jpg/960px-Motor_oil_for_cars_and_motorcycles_from_various_producers_in_German_hardware_store.jpg"),
  ],
};

const PRODUCTS = [
  // ── Motorcycles ───────────────────────────────────────────────────────────
  { name: "Honda Click 125i V3", category: "Motorcycles", brand: "Honda", price: 81400, stock: 5, ratings: 4.8, numOfReviews: 34, installmentEligible: true, minInstallmentPrice: 16280,
    description: "Liquid-cooled 125cc PGM-FI eSP engine with Honda Smart Key and a full digital meter panel." },
  { name: "Yamaha NMAX 155 ABS", category: "Motorcycles", brand: "Yamaha", price: 151900, stock: 4, ratings: 4.9, numOfReviews: 58, installmentEligible: true, minInstallmentPrice: 30380,
    description: "Premium maxi-scooter powered by a 155cc Blue Core engine with VVA and dual-channel ABS." },
  { name: "Yamaha Aerox 155 S Version", category: "Motorcycles", brand: "Yamaha", price: 145000, stock: 3, ratings: 4.7, numOfReviews: 42, installmentEligible: true, minInstallmentPrice: 29000,
    description: "Aggressive sporty design with a 155cc liquid-cooled VVA engine, ABS, and a smart key system." },
  { name: "Honda PCX 160", category: "Motorcycles", brand: "Honda", price: 166900, stock: 2, ratings: 4.9, numOfReviews: 29, installmentEligible: true, minInstallmentPrice: 33380,
    description: "Refined 160cc eSP+ maxi-scooter with Honda Smart Key, traction control, and a large underseat compartment." },
  { name: "Suzuki Raider R150 Fi", category: "Motorcycles", brand: "Suzuki", price: 119900, stock: 6, ratings: 4.6, numOfReviews: 38, installmentEligible: true, minInstallmentPrice: 23980,
    description: "The Underbone King. A 147.3cc DOHC 4-valve fuel-injected engine delivering class-leading acceleration." },
  { name: "Kawasaki Ninja 400 SE", category: "Motorcycles", brand: "Kawasaki", price: 340000, stock: 2, ratings: 5.0, numOfReviews: 19, installmentEligible: true, minInstallmentPrice: 68000,
    description: "High-performance twin-cylinder 399cc sports machine equipped with an assist and slipper clutch." },
  { name: "CFMOTO 450SR Sport", category: "Motorcycles", brand: "CFMOTO", price: 299900, stock: 3, ratings: 4.7, numOfReviews: 15, installmentEligible: true, minInstallmentPrice: 59980,
    description: "Aerodynamic race-developed supersport with a 449cc parallel-twin 270-degree crankshaft and Brembo brakes." },

  // ── Engine Parts ──────────────────────────────────────────────────────────
  { name: "Yamaha Genuine V-Belt & Roller Weight Kit (NMAX/Aerox)", category: "Engine Parts", brand: "Yamaha", price: 1850, stock: 15, ratings: 4.8, numOfReviews: 45, installmentEligible: false,
    description: "Official OEM reinforced drive belt and calibrated 13g slider rollers for the Blue Core 155cc engine.",
    compatibleModels: ["Yamaha NMAX 155", "Yamaha Aerox 155"] },
  { name: "Honda Genuine PGM-FI Fuel Injector Nozzle (Click/Beat)", category: "Engine Parts", brand: "Honda", price: 1450, stock: 12, ratings: 4.5, numOfReviews: 18, installmentEligible: false,
    description: "High-precision replacement injector nozzle ensuring optimal fuel atomization and air-fuel ratio.",
    compatibleModels: ["Honda Click 125i", "Honda Beat"] },
  { name: "Suzuki Raider 150 DOHC Valve Spring & Shim Set", category: "Engine Parts", brand: "Suzuki", price: 2200, stock: 8, ratings: 4.4, numOfReviews: 11, installmentEligible: false,
    description: "Hardened steel high-RPM valve spring assembly for high-compression builds or engine rebuilds.",
    compatibleModels: ["Suzuki Raider R150"] },
  { name: "Kawasaki Iridium Spark Plug CR9EIA-9", category: "Engine Parts", brand: "Kawasaki", price: 650, stock: 30, ratings: 4.9, numOfReviews: 62, installmentEligible: false,
    description: "Long-life fine-wire iridium center electrode ensuring instant ignition and improved throttle response." },

  // ── Brakes ────────────────────────────────────────────────────────────────
  { name: "Brembo Sintered Brake Pads Front Caliper", category: "Brakes", brand: "Yamaha", price: 1890, stock: 20, ratings: 4.9, numOfReviews: 73, installmentEligible: false,
    description: "High-friction sintered metallic compound offering progressive bite and thermal fade resistance." },
  { name: "Honda Genuine Front Disc Rotor 220mm (Click 125/150)", category: "Brakes", brand: "Honda", price: 1350, stock: 10, ratings: 4.6, numOfReviews: 24, installmentEligible: false,
    description: "Precision-ground stainless steel front disc brake rotor with heat-dissipating ventilation holes.",
    compatibleModels: ["Honda Click 125i", "Honda Click 150"] },
  { name: "Kawasaki Braided Steel Brake Line Hose Kit", category: "Brakes", brand: "Kawasaki", price: 2800, stock: 7, ratings: 4.7, numOfReviews: 16, installmentEligible: false,
    description: "Zero-expansion PTFE core with a braided stainless steel casing for firm, precise lever feel." },

  // ── Tires and Wheels ──────────────────────────────────────────────────────
  { name: "Pirelli Angel Scooter Tubeless Tire (110/70-14 Front)", category: "Tires and Wheels", brand: "Yamaha", price: 2650, stock: 14, ratings: 4.8, numOfReviews: 41, installmentEligible: false,
    description: "Reinforced structure with cross grooves for maximum wet grip, braking confidence, and stability." },
  { name: "Michelin City Grip 2 All-Weather Tire (130/70-13 Rear)", category: "Tires and Wheels", brand: "Honda", price: 3200, stock: 12, ratings: 4.9, numOfReviews: 53, installmentEligible: false,
    description: "Silica-based rubber compound designed to conquer slippery painted road markings and wet asphalt." },
  { name: "Suzuki Enkei Lightweight Alloy Wheel Set (Front & Rear 17-inch)", category: "Tires and Wheels", brand: "Suzuki", price: 6800, stock: 4, ratings: 4.6, numOfReviews: 12, installmentEligible: false,
    description: "Aerodynamic lightweight alloy wheels that reduce unsprung weight and sharpen cornering response." },

  // ── Helmets ───────────────────────────────────────────────────────────────
  { name: "HJC C10 Full-Face Helmet ECE 22.06 Matte Black", category: "Helmets", brand: "Yamaha", price: 5490, stock: 8, ratings: 4.8, numOfReviews: 67, installmentEligible: false,
    description: "Advanced polycarbonate composite shell with the ACS channeling ventilation system and Pinlock readiness." },
  { name: "LS2 Stream II Dual Visor Helmet Gloss White", category: "Helmets", brand: "Honda", price: 4300, stock: 11, ratings: 4.7, numOfReviews: 39, installmentEligible: false,
    description: "KPA kinetic polymer alloy shell with an integrated drop-down sun visor and laser-cut comfort foam." },
  { name: "MT Helmets Thunder 4 SV Solid Titanium", category: "Helmets", brand: "CFMOTO", price: 6200, stock: 5, ratings: 4.9, numOfReviews: 22, installmentEligible: false,
    description: "ECE 22.06 certified shell with a quick-release aerodynamic rear spoiler and hypoallergenic liners." },

  // ── Riding Gear ───────────────────────────────────────────────────────────
  { name: "Komine Armored Mesh Riding Jacket JK-128", category: "Riding Gear", brand: "Honda", price: 6900, stock: 7, ratings: 4.8, numOfReviews: 31, installmentEligible: false,
    description: "Full CE Level 2 shoulder, elbow, chest, and back protectors with breathable textile mesh ventilation." },
  { name: "Taichi Carbon Protective Summer Gloves RST448", category: "Riding Gear", brand: "Yamaha", price: 3450, stock: 16, ratings: 4.7, numOfReviews: 48, installmentEligible: false,
    description: "Carbon knuckle protection with touchscreen-compatible fingertips and perforated leather ventilation." },
  { name: "Alpinestars S-MX Riding Boots", category: "Riding Gear", brand: "Kawasaki", price: 8200, stock: 9, ratings: 4.8, numOfReviews: 27, installmentEligible: false,
    description: "Reinforced racing boots with TPU shin and ankle protection, replaceable toe sliders, and a breathable lining." },

  // ── Accessories ───────────────────────────────────────────────────────────
  { name: "Givi B32N Bold Monolock 32-Liter Top Box", category: "Accessories", brand: "Honda", price: 3100, stock: 18, ratings: 4.6, numOfReviews: 54, installmentEligible: false,
    description: "Heavy-duty 32L square top case that holds one modular full-face helmet, with the base plate included." },
  { name: "Shad Soft Side Pannier Bags (Pair)", category: "Accessories", brand: "Yamaha", price: 2600, stock: 22, ratings: 4.5, numOfReviews: 33, installmentEligible: false,
    description: "Weather-resistant saddlebags with reflective trim and hook-and-loop mounting straps for weekend touring." },

  // ── Lubricants ────────────────────────────────────────────────────────────
  { name: "Motul 7100 4T 10W-40 100% Synthetic 1-Liter", category: "Lubricants", brand: "Kawasaki", price: 750, stock: 40, ratings: 4.9, numOfReviews: 120, installmentEligible: false,
    description: "Ester-technology 4-stroke engine oil meeting JASO MA2 specifications for optimum wet-clutch response." },
  { name: "Yamalube AT 10W-40 Fully Synthetic Scooter Oil 800ml", category: "Lubricants", brand: "Yamaha", price: 380, stock: 35, ratings: 4.8, numOfReviews: 95, installmentEligible: false,
    description: "Specially formulated for automatic scooters, meeting the JASO MB standard with low-friction performance." },
  { name: "Honda Genuine Pro 4-Stroke Scooter Oil 10W-30 SL/MB 1L", category: "Lubricants", brand: "Honda", price: 295, stock: 50, ratings: 4.7, numOfReviews: 110, installmentEligible: false,
    description: "Recommended by Honda R&D for Click, Beat, and ADV scooters, ensuring superior fuel efficiency." },
];

const DEFAULT_CATEGORIES = [
  { name: "Motorcycles", description: "Full motorcycle units" },
  { name: "Engine Parts", description: "Engine components and internals" },
  { name: "Brakes", description: "Brake pads, calipers, and discs" },
  { name: "Tires and Wheels", description: "Tires, rims, and wheel components" },
  { name: "Helmets", description: "Full-face, open-face, and modular helmets" },
  { name: "Riding Gear", description: "Jackets, gloves, boots, and protection" },
  { name: "Accessories", description: "Bags, phone mounts, and add-ons" },
  { name: "Lubricants", description: "Engine oils and lubricants" },
];

const DEFAULT_BRANDS = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "CFMOTO"];

const publicIdFor = (name, url, index) =>
  `seed-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${index}-${url
    .split("/")
    .pop()
    .replace(/[^a-z0-9.]+/gi, "_")
    .slice(0, 40)}`;

async function ensureAdmin() {
  let admin = await User.findOne({ role: "admin" });
  if (admin) return admin;

  admin = await User.findOne();
  if (admin) {
    admin.role = "admin";
    await admin.save();
    return admin;
  }

  const password = await bcrypt.hash("Admin@12345", 10);
  return User.create({
    firstName: "Seed",
    lastName: "Admin",
    email: "seed.admin@motorshop.local",
    password,
    role: "admin",
    contactNumber: "09000000000",
    profilePicture: "https://placehold.co/256x256?text=Admin",
    validId: "https://placehold.co/800x500?text=Valid+ID",
    proofOfIncome: "https://placehold.co/800x500?text=Proof+of+Income",
  });
}

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB.");

    // 1) Categories & brands (idempotent upsert so this works on a fresh DB)
    const catMap = {};
    for (const cat of DEFAULT_CATEGORIES) {
      const doc = await Category.findOneAndUpdate(
        { name: cat.name },
        { $set: { ...cat, isArchived: false } },
        { upsert: true, returnDocument: "after" },
      );
      catMap[doc.name] = doc._id;
    }
    const brandMap = {};
    for (const name of DEFAULT_BRANDS) {
      const doc = await Brand.findOneAndUpdate(
        { name },
        { $set: { name, isArchived: false } },
        { upsert: true, returnDocument: "after" },
      );
      brandMap[doc.name] = doc._id;
    }
    console.log(`Categories: ${Object.keys(catMap).length}, brands: ${Object.keys(brandMap).length}`);

    // 2) Author for products
    const admin = await ensureAdmin();
    console.log(`Author: ${admin.email} (${admin.role})`);

    // 3) Products with multiple photos each
    let upserted = 0;
    let missing = 0;
    for (const p of PRODUCTS) {
      const catId = catMap[p.category];
      const brandId = brandMap[p.brand];
      const photos = PHOTOS[p.name];

      if (!catId || !brandId) {
        console.warn(`Skipping ${p.name}: category or brand not found`);
        missing++;
        continue;
      }
      if (!photos || photos.length < 2) {
        console.warn(`Skipping ${p.name}: needs 2+ photos`);
        missing++;
        continue;
      }

      await Product.findOneAndUpdate(
        { name: p.name },
        {
          $set: {
            name: p.name,
            description: p.description,
            category: catId,
            brand: brandId,
            compatibleModels: p.compatibleModels || [],
            price: p.price,
            stock: p.stock,
            ratings: p.ratings,
            numOfReviews: p.numOfReviews,
            installmentEligible: p.installmentEligible,
            minInstallmentPrice:
              p.minInstallmentPrice || Math.round(p.price * 0.2),
            images: photos.map((url, i) => ({
              url,
              publicId: publicIdFor(p.name, url, i),
            })),
            user: admin._id,
            isArchived: false,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      upserted++;
    }

    const total = await Product.countDocuments();
    const withMulti = await Product.countDocuments({ "images.1": { $exists: true } });
    console.log(`\nUpserted ${upserted} products (${missing} skipped).`);
    console.log(`Total products in DB: ${total}. Products with 2+ photos: ${withMulti}.`);
    console.log("Sample:", PRODUCTS.slice(0, 3).map((p) => `${p.name} [${PHOTOS[p.name].length} photos]`).join("; "));

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
