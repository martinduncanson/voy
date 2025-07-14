describe('Guest Booking', () => {
  it('loads booking page', () => {
    cy.visit('/booking');
    cy.contains('Welcome to Booking');
  });
});