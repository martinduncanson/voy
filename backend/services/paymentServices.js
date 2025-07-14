function simulatePayment(amount) {
  // Mock charge
  return { success: true, transactionId: 'mock-' + Date.now(), amount };
}

module.exports = { simulatePayment };