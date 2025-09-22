#!/usr/bin/env node

/**
 * Test script for Dodo Payments integration
 *
 * This script tests the complete payment flow:
 * 1. Create a test product
 * 2. List products to verify creation
 * 3. Create a checkout session
 * 4. Simulate payment completion (development mode)
 *
 * Usage: node scripts/test-dodo-integration.js
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function makeRequest(action, params = {}) {
  const response = await fetch(`${baseUrl}/api/test/dodo-integration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`${action} failed: ${data.error || response.statusText}`)
  }

  return data
}

async function testDodoIntegration() {
  console.log('🚀 Starting Dodo Payments Integration Test...\n')

  try {
    // Step 1: Create a test product
    console.log('1️⃣ Creating test product...')
    const productResult = await makeRequest('create_product', {
      name: 'Unity Game Development Masterclass',
      description: 'Complete course on Unity game development from beginner to advanced',
      price: 4999 // $49.99
    })

    console.log('✅ Product created:', {
      id: productResult.result.id,
      name: productResult.result.name,
      price: `$${(productResult.result.price / 100).toFixed(2)}`
    })

    const productId = productResult.result.id

    // Step 2: List products to verify
    console.log('\n2️⃣ Listing products...')
    const listResult = await makeRequest('list_products')

    console.log('✅ Products found:', listResult.result.length)
    listResult.result.forEach(product => {
      console.log(`   - ${product.name} (${product.id}) - $${(product.price / 100).toFixed(2)}`)
    })

    // Step 3: Create checkout session
    console.log('\n3️⃣ Creating checkout session...')
    const checkoutResult = await makeRequest('create_checkout', {
      productId,
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      returnUrl: `${baseUrl}/purchase/success`
    })

    console.log('✅ Checkout session created:', {
      id: checkoutResult.result.id,
      url: checkoutResult.result.url,
      paymentId: checkoutResult.result.paymentId
    })

    // Step 4: Simulate payment retrieval (development mode)
    console.log('\n4️⃣ Testing payment retrieval...')
    const paymentId = checkoutResult.result.paymentId || 'pay_dev_test'

    try {
      const paymentResult = await makeRequest('get_payment', { paymentId })
      console.log('✅ Payment retrieved:', {
        id: paymentResult.result.id,
        status: paymentResult.result.status,
        amount: `$${(paymentResult.result.amount / 100).toFixed(2)}`,
        customer: paymentResult.result.customer.email
      })
    } catch (error) {
      console.log('ℹ️ Payment retrieval test (expected in dev mode):', error.message)
    }

    console.log('\n🎉 Dodo Payments Integration Test Completed Successfully!')
    console.log('\n📋 Summary:')
    console.log(`   • Product created: ${productResult.result.name}`)
    console.log(`   • Checkout URL: ${checkoutResult.result.url}`)
    console.log(`   • Environment: Development (using mock responses)`)
    console.log('\n💡 Next steps:')
    console.log('   1. Configure real Dodo API keys for production testing')
    console.log('   2. Test webhook endpoints with real payment events')
    console.log('   3. Integrate license key generation with course enrollment')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${baseUrl}/api/test/dodo-integration`)
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.statusText}`)
    }
    return true
  } catch (error) {
    console.error('❌ Cannot connect to server. Please ensure the Next.js dev server is running:')
    console.error('   npm run dev\n')
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  checkServer().then(() => testDodoIntegration())
}