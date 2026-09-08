import postgres from "postgres";
const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!);

async function main() {
  const buckets = await sql`SELECT id, name, file_size_limit, allowed_mime_types FROM storage.buckets`;
  console.log("STORAGE_BUCKETS_SQL:", buckets);

  // Update avatars bucket in storage.buckets to allow all mime types and 10MB limit!
  await sql`
    UPDATE storage.buckets
    SET allowed_mime_types = NULL, file_size_limit = 10485760
    WHERE id = 'avatars'
  `;

  const updated = await sql`SELECT id, name, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'avatars'`;
  console.log("AFTER_UPDATE:", updated);

  await sql.end();
}

main().catch(console.error);
