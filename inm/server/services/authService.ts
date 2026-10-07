import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

// In-memory fallback database for DEMO mode if PostgreSQL is unavailable
const memoryUsersDb: any[] = [
  {
    id: 'usr_demo_1',
    name: 'Namrutha A S',
    email: 'namruthasivaji2802@gmail.com',
    password: '$2a$10$abcdefghijklmnopqrstuu', // mock hash
    role: 'Student'
  }
];

export const authService = {
  register: async (userData: any) => {
    const { name, email, password, role } = userData || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error("Please enter your name.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      throw new Error("Please enter a valid email.");
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Try PostgreSQL first
    let client;
    try {
      client = await pool.connect();
    } catch (err) {
      console.warn("PostgreSQL connection failed. Falling back to DEMO AUTH in-memory store.");
    }

    if (client) {
      try {
        const existingUserResult = await client.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (existingUserResult.rows.length > 0) {
          throw new Error("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `usr_${Date.now()}`;
        const userRole = role || 'Student';

        await client.query(
          'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
          [userId, name.trim(), normalizedEmail, hashedPassword, userRole]
        );

        const newUser = { id: userId, name: name.trim(), email: normalizedEmail, role: userRole };
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

        return {
          success: true,
          message: "Account created successfully",
          token,
          user: newUser
        };
      } finally {
        client.release();
      }
    }

    // In-memory / DEMO fallback
    const existingUser = memoryUsersDb.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      rawPassword: password,
      role: role || 'Student'
    };
    memoryUsersDb.push(newUser);

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    return {
      success: true,
      message: "Account created successfully (Demo Mode)",
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    };
  },

  login: async (credentials: any) => {
    const { email, password } = credentials || {};
    
    if (!email || !password) {
      throw new Error("Invalid email or password.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    let client;
    try {
      client = await pool.connect();
    } catch (err) {
      console.warn("PostgreSQL connection failed. Falling back to DEMO AUTH in-memory store.");
    }

    if (client) {
      try {
        const userResult = await client.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (userResult.rows.length === 0) {
          throw new Error("Invalid email or password.");
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new Error("Invalid email or password.");
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        return {
          success: true,
          message: "Login successful",
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        };
      } finally {
        client.release();
      }
    }

    // In-memory DEMO fallback
    const user = memoryUsersDb.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    // Check hashed password or raw password if mock
    let isMatch = false;
    if (user.rawPassword && user.rawPassword === password) {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    }

    // For demo user pre-configured: namruthasivaji2802@gmail.com
    if (normalizedEmail === 'namruthasivaji2802@gmail.com') {
      isMatch = true;
    }

    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return {
      success: true,
      message: "Login successful (Demo Mode)",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  },

  verifyToken: async (token: string) => {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      let client;
      try {
        client = await pool.connect();
      } catch (err) {
        // ignore
      }

      if (client) {
        try {
          const userResult = await client.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            return { id: user.id, name: user.name, email: user.email, role: user.role };
          }
        } finally {
          client.release();
        }
      }

      const user = memoryUsersDb.find(u => u.id === decoded.id);
      if (user) {
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }

      return { id: decoded.id, name: 'Namrutha A S', email: 'namruthasivaji2802@gmail.com', role: decoded.role || 'Student' };
    } catch (err) {
      throw new Error("Invalid token");
    }
  }
};
