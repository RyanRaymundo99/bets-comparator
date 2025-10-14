/**
 * Script to initialize the admin user
 * Run this script to create the default admin user in the database
 */

async function initAdmin() {
  try {
    console.log("🔧 Initializing admin user...\n");

    const response = await fetch(
      "http://localhost:3000/api/auth/create-admin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Success!\n");
      console.log("Admin user details:");
      console.log("─────────────────────────────");
      console.log(`ID:       ${result.admin.id}`);
      console.log(`Email:    ${result.admin.email}`);
      console.log(`Name:     ${result.admin.name}`);
      if (result.admin.defaultPassword) {
        console.log(`Password: ${result.admin.defaultPassword}`);
      }
      console.log("─────────────────────────────\n");

      console.log("📝 Next steps:");
      console.log("1. Go to http://localhost:3000/admin/login");
      console.log("2. Login with the credentials above");
      console.log("3. Change the default password immediately\n");
    } else {
      console.log("ℹ️ ", result.message || result.error);
      if (result.admin) {
        console.log("\nExisting admin user:");
        console.log("─────────────────────────────");
        console.log(`ID:    ${result.admin.id}`);
        console.log(`Email: ${result.admin.email}`);
        console.log(`Name:  ${result.admin.name}`);
        console.log("─────────────────────────────\n");
      }
    }
  } catch (error) {
    console.error("❌ Error initializing admin user:");
    console.error(error.message);
    console.error("\n⚠️  Make sure the development server is running:");
    console.error("   npm run dev");
  }
}

initAdmin();


