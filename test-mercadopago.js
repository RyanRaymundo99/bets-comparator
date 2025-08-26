// Test script for Mercado Pago integration
// Run this with: node test-mercadopago.js

const { MercadoPagoService } = require("./src/lib/mercadopago.ts");

async function testMercadoPago() {
  console.log("🧪 Testing Mercado Pago Integration...\n");

  // Test 1: Check if credentials are configured
  console.log("1️⃣ Checking credentials...");
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    console.log("❌ MERCADO_PAGO_ACCESS_TOKEN not configured");
    console.log(
      "   Set this environment variable to test real PIX generation\n"
    );
    return;
  } else {
    console.log("✅ MERCADO_PAGO_ACCESS_TOKEN configured");
  }

  if (!process.env.MERCADO_PAGO_PUBLIC_KEY) {
    console.log("❌ MERCADO_PAGO_PUBLIC_KEY not configured");
    console.log(
      "   Set this environment variable to test real PIX generation\n"
    );
    return;
  } else {
    console.log("✅ MERCADO_PAGO_PUBLIC_KEY configured\n");
  }

  // Test 2: Try to create a payment
  console.log("2️⃣ Testing payment creation...");
  try {
    const service = new MercadoPagoService();

    const payment = await service.createPayment({
      amount: 10.0,
      description: "Test PIX Payment - R$ 10,00",
      externalReference: `test_${Date.now()}`,
      payerEmail: "test@example.com",
    });

    console.log("✅ Payment created successfully!");
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Status: ${payment.status}`);

    if (payment.point_of_interaction?.transaction_data?.qr_code) {
      console.log("✅ PIX QR Code generated!");
      console.log(
        `   QR Code data length: ${payment.point_of_interaction.transaction_data.qr_code.length} characters`
      );

      if (payment.point_of_interaction.transaction_data.qr_code_base64) {
        console.log("✅ QR Code base64 image generated!");
      } else {
        console.log("⚠️  QR Code base64 image not provided by API");
      }
    } else {
      console.log("❌ PIX QR Code not found in response");
    }

    console.log(
      "\n📱 The QR Code should now be scannable by Brazilian banking apps!"
    );
  } catch (error) {
    console.log("❌ Payment creation failed:");
    console.log(`   Error: ${error.message}`);

    if (error.response?.data) {
      console.log(
        `   API Response: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }
  }

  console.log("\n🔍 Check the console above for detailed results");
  console.log("📖 For setup instructions, see MERCADO_PAGO_SETUP.md");
}

// Load environment variables if .env file exists
try {
  require("dotenv").config();
} catch (error) {
  console.log("⚠️  dotenv not installed, using system environment variables");
}

testMercadoPago().catch(console.error);
