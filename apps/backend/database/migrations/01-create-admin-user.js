const bcrypt = require('bcryptjs');

module.exports = {
  async up(knex) {
    // Check if admin user already exists
    const existingAdmin = await knex('admin_users').where({ email: 'admin@example.com' }).first();
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
      
      await knex('admin_users').insert({
        firstname: 'Admin',
        lastname: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        is_active: true,
        blocked: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
      
      console.log('✅ Admin user created: admin@example.com / AdminPassword123!');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  },

  async down(knex) {
    await knex('admin_users').where({ email: 'admin@example.com' }).del();
  }
};