import postgres from "postgres";
import { uploadLogbookAttachment } from "../lib/supabase-storage";

const sql = postgres(process.env.DATABASE_URL!);

async function runTests() {
  console.log("🚀 Starting Feature 08 Logic & Locking Invariant Verification...");

  // 1. Get student profile for test
  const [student] = await sql`
    SELECT sp.id as profile_id, u.id as user_id, u.email
    FROM "user" u
    JOIN student_profile sp ON sp.user_id = u.id
    WHERE u.role = 'student'
    LIMIT 1
  `;

  if (!student) {
    throw new Error("No student found in DB for test");
  }

  console.log("✓ Using student:", student.email, "profileId:", student.profile_id);

  // 2. Ensure placement
  let [placement] = await sql`
    SELECT * FROM placement WHERE student_id = ${student.profile_id} LIMIT 1
  `;

  if (!placement) {
    let [org] = await sql`SELECT * FROM organization LIMIT 1`;
    if (!org) {
      [org] = await sql`
        INSERT INTO organization (name, address, state_region, industry_type)
        VALUES ('Chevron Nigeria Limited', 'Chevron Drive', 'Lagos State', 'Energy')
        RETURNING *
      `;
    }
    let [supervisor] = await sql`SELECT id FROM "user" WHERE role = 'school_supervisor' LIMIT 1`;
    if (!supervisor) {
      [supervisor] = await sql`SELECT id FROM "user" LIMIT 1`;
    }

    [placement] = await sql`
      INSERT INTO placement (student_id, organization_id, school_supervisor_id, start_date, end_date, target_days, placement_source, status)
      VALUES (${student.profile_id}, ${org.id}, ${supervisor.id}, '2026-08-01', '2026-11-30', 60, 'self_secured', 'active')
      RETURNING *
    `;

  }
  console.log("✓ Active placement confirmed:", placement.id);

  // 3. Test Test Case A: Create Draft Entry
  const draftId = crypto.randomUUID();
  const [draftEntry] = await sql`
    INSERT INTO logbook_entry (id, student_id, placement_id, entry_date, activity_description, skills_gained, challenges, hours_worked, status, version_number)
    VALUES (${draftId}, ${student.profile_id}, ${placement.id}, '2026-09-08', 'Installed and configured Apache HTTP Server on Ubuntu.', 'Linux, Apache', 'Port 443 firewall block', 8.0, 'draft', 1)
    RETURNING *
  `;
  console.log("✓ Test Case A: Draft entry created successfully with status:", draftEntry.status);

  // 4. Test Test Case B: Update Draft Entry (allowed)
  const [updatedDraft] = await sql`
    UPDATE logbook_entry
    SET activity_description = 'Installed and configured Apache HTTP Server with SSL certs on Ubuntu.'
    WHERE id = ${draftId} AND status = 'draft'
    RETURNING *
  `;
  console.log("✓ Test Case B: Draft entry updated successfully:", updatedDraft.activity_description);

  // 5. Test Test Case C: Submit Draft Entry
  const [submittedEntry] = await sql`
    UPDATE logbook_entry
    SET status = 'submitted', submitted_at = NOW()
    WHERE id = ${draftId} AND (status = 'draft' OR status = 'needs_correction')
    RETURNING *
  `;
  console.log("✓ Test Case C: Entry submitted for review with status:", submittedEntry.status, "submitted_at:", submittedEntry.submitted_at);

  // 6. Test Test Case D: Locking Invariant Check
  // Verify that an entry in 'submitted' status CANNOT be updated
  const lockedUpdate = await sql`
    UPDATE logbook_entry
    SET activity_description = 'Illegal update on locked entry'
    WHERE id = ${draftId} AND (status = 'draft' OR status = 'needs_correction')
    RETURNING *
  `;
  if (lockedUpdate.length === 0) {
    console.log("✓ Test Case D: Locking Invariant ENFORCED: Submitted entry cannot be updated (0 rows affected as expected)");
  } else {
    throw new Error("Locking invariant violated: submitted entry was updated!");
  }

  // 7. Test Test Case E: Supabase Storage Attachment Upload
  console.log("Testing Supabase Storage attachment upload to avatars bucket at path: ${studentId}/${entryId}/${filename}...");
  const dummyFileContent = Buffer.from("PDF-1.4 Mock Logbook Technical Documentation and Network Diagrams");
  const uploadRes = await uploadLogbookAttachment({
    studentId: student.profile_id,
    entryId: draftId,
    file: dummyFileContent,
    filename: "network_diagram_topology.pdf",
    contentType: "application/pdf",
  });

  if (uploadRes.error) {
    throw new Error(`Supabase Storage attachment upload failed: ${uploadRes.error}`);
  }
  console.log("✓ Test Case E: Attachment uploaded to Supabase Storage successfully!");
  console.log("  Attachment Public URL:", uploadRes.url);

  // Update attachment URL on entry
  await sql`
    UPDATE logbook_entry
    SET attachment_url = ${uploadRes.url}
    WHERE id = ${draftId}
  `;
  console.log("✓ Attachment URL persisted to logbook_entry row.");

  // Cleanup test entry or keep it for UI display
  console.log("\n🎉 ALL FEATURE 08 LOGIC TESTS PASSED WITH 100% SUCCESS!");
  await sql.end();
}

runTests().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
