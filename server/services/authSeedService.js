import User from '../models/User.js';

const createUserIfMissing = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    return null;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return existingUser;
  }

  return User.create({ name, email, password, role });
};

export const seedDefaultUsers = async () => {
  await createUserIfMissing({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'Admin'
  });

  await createUserIfMissing({
    name: process.env.STUDENT_NAME,
    email: process.env.STUDENT_EMAIL,
    password: process.env.STUDENT_PASSWORD,
    role: 'Student'
  });
};