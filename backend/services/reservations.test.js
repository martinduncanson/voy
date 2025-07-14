const request = require('supertest');
const app = require('../index'); // Adjusted for test

describe('Reservations API', () => {
  it('should get reservations', async () => {
    const res = await request(app).get('/api/reservations');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});