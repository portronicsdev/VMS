const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("🔍 SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Loaded" : "❌ Missing");
console.log("🔍 SUPABASE_KEY:", process.env.SUPABASE_KEY ? "✅ Loaded" : "❌ Missing");


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

console.log("✅ Supabase client initialized");

/** Map Supabase snake_case row to API camelCase + _id for frontend compatibility */
function toVisitRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    visitorId: row.visitor_id,
    phone: row.phone,
    name: row.name,
    purpose: row.purpose,
    personToMeet: row.person_to_meet,
    photoUrl: row.photo_url,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/** Map Supabase visitor row to API camelCase + _id */
function toVisitorRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    phone: row.phone,
    name: row.name,
    company: row.company,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/** Test connection on startup */
async function testConnection() {
  try {
    const { count, error } = await supabase
      .from("visitors")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    console.log("🔍 Visitors table check:", count ?? 0, "rows");
    console.log("✅ Supabase connection ready");
  } catch (err) {
console.error("❌ Full error:", JSON.stringify(err, null, 2));  }
}

testConnection();

module.exports = {
  supabase,
  toVisitRow,
  toVisitorRow
};
