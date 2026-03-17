/**
 * Seed script — insert all CityAssist city tenants (Pharr + Edinburg).
 *
 * Idempotent: each tenant and department is only inserted if it does not
 * already exist.  Safe to re-run at any time.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   npx tsx scripts/seed.ts --city pharr
 *   npx tsx scripts/seed.ts --city edinburg
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env") });
import { randomBytes, randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants, departments } from "../server/db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Location {
  street?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

interface DeptConfig {
  name: string;
  phone: string | null;
  email: string | null;
  keywords: string;
  location: Location;
  hours: string;
}

interface CityConfig {
  name: string;
  slug: string;
  websiteDomain: string;
  searchDomains: string[];
  logoPath: string;
  departments: DeptConfig[];
}

// ── City definitions ──────────────────────────────────────────────────────────

const PHARR: CityConfig = {
  name: "City of Pharr",
  slug: "city-of-pharr",
  websiteDomain: "pharr-tx.gov",
  searchDomains: ["pharr-tx.gov", "cityofpharr.com", "pharredc.com", "pharrpd.com"],
  logoPath: "logos/city-of-pharr.png",
  departments: [
    {
      name: "Innovation & Technology",
      phone: "(956) 402-4900",
      email: null,
      keywords: "technology,IT,software,computers,network,digital,wifi,innovation,tech support",
      location: { street: "104 W Polk Ave", city: "Pharr", state: "TX", zipcode: "78577", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Public Works",
      phone: "(956) 402-4350",
      email: null,
      keywords: "roads,potholes,streets,trash,garbage,drainage,sidewalks,infrastructure,street lights,signs",
      location: { street: "1015 E Ferguson Ave", city: "Pharr", state: "TX", zipcode: "78577", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Saturday: 8 AM – 12 PM | Sunday: Closed",
    },
    {
      name: "Public Utilities",
      phone: "(956) 402-4300",
      email: null,
      keywords: "utilities,water,electricity,gas,billing,meter,utility bill,service outage,water leak,sewage",
      location: { street: "801 E Sam Houston", city: "Pharr", state: "TX", zipcode: "78577", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Parks and Recreation",
      phone: "(956) 402-4550",
      email: null,
      keywords: "parks,recreation,sports,events,pool,swimming,playground,community center,facilities,leagues,fitness",
      location: { street: "1011 W Kelly Ave", city: "Pharr", state: "TX", zipcode: "78577", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
  ],
};

const EDINBURG: CityConfig = {
  name: "City of Edinburg",
  slug: "city-of-edinburg",
  websiteDomain: "cityofedinburg.com",
  searchDomains: [
    "cityofedinburg.com",
    "edinburg.com",
    "ecisd.us",
    "edinburg.recdesk.com",
  ],
  logoPath: "logos/city-of-edinburg.png",
  departments: [
    // Public Safety
    {
      name: "Police Department",
      phone: "(956) 289-7700",
      email: null,
      keywords: "police,law enforcement,crime,safety,emergency,SWAT,K-9,investigations,detective,patrol,911,report,stolen,assault,theft,traffic stop,accident report",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "24 / 7 — Emergency: 911 | Non-emergency: (956) 289-7700",
    },
    {
      name: "Fire Department",
      phone: "(956) 289-7960",
      email: null,
      keywords: "fire,firefighter,emergency,rescue,ambulance,EMS,hazmat,inspection,fire safety,smoke alarm,fire prevention,arson",
      location: { street: "120 E Cano St", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "24 / 7",
    },
    // Planning & Growth
    {
      name: "Planning & Zoning",
      phone: "(956) 388-8203",
      email: null,
      keywords: "planning,zoning,land use,permit,rezoning,variance,plat,subdivision,comprehensive plan,future land use,setback,ordinance,development review",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Engineering",
      phone: "(956) 388-8200",
      email: null,
      keywords: "engineering,infrastructure,capital improvement,construction,drainage,stormwater design,traffic engineering,bridge,road design,CIP,project management",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Economic Development",
      phone: "(956) 388-8219",
      email: null,
      keywords: "economic development,business,incentive,grant,relocation,retail,commercial,investment,enterprise zone,tax abatement,business license,new business,start up",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Building Safety",
      phone: "(956) 388-8210",
      email: null,
      keywords: "building permit,construction permit,inspection,certificate of occupancy,contractor,building code,residential permit,commercial permit,plan review,CO,electrical permit,plumbing permit,mechanical permit",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    // Operations & Utilities
    {
      name: "Public Works",
      phone: "(956) 289-7950",
      email: null,
      keywords: "public works,streets,potholes,road repair,traffic signal,stormwater,flooding,drainage ditch,sidewalk,streetlight,sign,pavement,curb,asphalt,street maintenance",
      location: { street: "1102 W Freddy Gonzalez Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 7 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Solid Waste Management",
      phone: "(956) 289-7950",
      email: null,
      keywords: "solid waste,garbage,trash,recycling,bulk pickup,yard waste,dumpster,refuse,collection schedule,missed pickup,composting,waste disposal,junk removal",
      location: { street: "1102 W Freddy Gonzalez Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 7 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Water Resources",
      phone: "(956) 289-7930",
      email: null,
      keywords: "water,utility,water bill,water meter,water leak,water pressure,sewer,wastewater,sewage,billing,service,outage,new service,disconnect,reconnect,water quality",
      location: { street: "1102 W Freddy Gonzalez Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 7:30 AM – 5:30 PM | After-hours emergencies: (956) 289-7930",
    },
    // Governance & Business
    {
      name: "City Attorney",
      phone: "(956) 388-8201",
      email: null,
      keywords: "city attorney,legal,lawsuit,ordinance,contract,public records,legal advice,litigation,claims",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "City Secretary",
      phone: "(956) 388-8202",
      email: null,
      keywords: "city secretary,public records,FOIA,open records,city council,agenda,minutes,election,municipal records,ordinance,resolution,notary",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Finance",
      phone: "(956) 388-8220",
      email: null,
      keywords: "finance,budget,tax,payment,billing,accounts payable,accounts receivable,audit,purchasing,bonds,fiscal,annual budget,property tax",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Human Resources",
      phone: "(956) 388-8215",
      email: null,
      keywords: "human resources,HR,civil service,employment,job,hiring,benefits,payroll,personnel,employee relations,civil service,careers,job opening,application",
      location: { street: "415 W University Dr", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    // Leisure & Culture
    {
      name: "Library & Cultural Arts",
      phone: "(956) 383-6246",
      email: null,
      keywords: "library,books,cultural arts,museum,gallery,programs,story time,computer lab,research,reading,art,culture,exhibition,events,community programs",
      location: { street: "401 E Cano St", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Mon – Thu: 9 AM – 8 PM | Fri – Sat: 9 AM – 6 PM | Sun: 1 PM – 5 PM",
    },
    {
      name: "Parks and Recreation",
      phone: "(956) 289-7970",
      email: null,
      keywords: "parks,recreation,sports,events,pool,swimming,playground,fitness,leagues,community center,athletic fields,tennis,basketball,softball,pavilion,rentals",
      location: { street: "2402 N Raul Longoria Rd", city: "Edinburg", state: "TX", zipcode: "78542", country: "USA" },
      hours: "Mon – Fri: 8 AM – 5 PM | Sat – Sun: Closed",
    },
    {
      name: "Los Lagos Golf Course",
      phone: "(956) 381-0941",
      email: null,
      keywords: "golf,golf course,tee time,driving range,pro shop,Los Lagos,golf lessons,tournament,greens,fairway,club rental,golf cart",
      location: { street: "3100 S Bus 281", city: "Edinburg", state: "TX", zipcode: "78539", country: "USA" },
      hours: "Daily: 7 AM – Dusk",
    },
  ],
};

// ── Seed logic ────────────────────────────────────────────────────────────────

async function seedCity(city: CityConfig): Promise<void> {
  console.log(`\n${city.name}`);
  console.log("─".repeat(40));

  // Find or create tenant
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, city.slug))
    .limit(1);

  let tenantId: string;

  if (existing) {
    tenantId = existing.id;
    console.log(`  Tenant: already exists`);
    console.log(`    id      : ${tenantId}`);
    console.log(`    api_key : ${existing.apiKey}`);
  } else {
    const apiKey = randomBytes(32).toString("hex");
    const [created] = await db
      .insert(tenants)
      .values({
        id: randomUUID(),
        name: city.name,
        slug: city.slug,
        apiKey,
        websiteDomain: city.websiteDomain,
        searchDomains: city.searchDomains,
        logoPath: city.logoPath,
        isActive: true,
        dailyRequestQuota: 1000,
      })
      .returning();

    tenantId = created!.id;
    const envKey = city.slug.toUpperCase().replace(/-/g, "_") + "_API_KEY";
    console.log(`  Tenant: created`);
    console.log(`    id             : ${tenantId}`);
    console.log(`    website_domain : ${city.websiteDomain}`);
    console.log(`    api_key        : ${apiKey}`);
    console.log(`\n  Add to .env → ${envKey}="${apiKey}"`);
  }

  // Seed departments
  let created = 0;
  let skipped = 0;

  console.log(`\n  Departments:`);
  for (const dept of city.departments) {
    const [existingDept] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.tenantId, tenantId), eq(departments.name, dept.name)))
      .limit(1);

    if (existingDept) {
      console.log(`    [skip] ${dept.name}`);
      skipped++;
    } else {
      await db.insert(departments).values({
        id: randomUUID(),
        tenantId,
        name: dept.name,
        phone: dept.phone,
        email: dept.email,
        keywords: dept.keywords,
        location: dept.location,
        hours: dept.hours,
      });
      console.log(`    [add]  ${dept.name}`);
      created++;
    }
  }

  console.log(`\n  → ${created} created, ${skipped} already existed.`);
}

// ── Entrypoint ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cityArg =
    process.argv.find((a) => a.startsWith("--city="))?.split("=")[1] ??
    (process.argv.includes("--city")
      ? process.argv[process.argv.indexOf("--city") + 1]
      : undefined);

  const citiesToSeed: CityConfig[] =
    cityArg === "pharr"
      ? [PHARR]
      : cityArg === "edinburg"
        ? [EDINBURG]
        : [PHARR, EDINBURG];

  console.log("CityAssist seed script");
  console.log("======================");

  for (const city of citiesToSeed) {
    await seedCity(city);
  }

  console.log("\nAll done.");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
