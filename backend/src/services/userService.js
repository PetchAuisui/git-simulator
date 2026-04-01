const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

class UserService {
  async createUser(username, password) {
    const userId = uuidv4();
    try {
      await db.run(
        'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
        [userId, username, password]
      );
      return { id: userId, username };
    } catch (error) {
      throw new Error('User already exists or database error');
    }
  }

  async getUserByUsername(username) {
    const user = await db.get(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return user;
  }

  async getUserById(userId) {
    const user = await db.get(
      'SELECT id, username, "createdAt" FROM users WHERE id = $1',
      [userId]
    );
    return user;
  }

  async authenticateUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }
    // In production, use bcrypt for password hashing
    if (user.password !== password) {
      throw new Error('Invalid password');
    }
    return { id: user.id, username: user.username };
  }
}

module.exports = new UserService();
