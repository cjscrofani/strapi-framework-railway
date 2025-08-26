#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  const migrationsDir = path.join(__dirname, '../database/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Creating migrations directory...');
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  try {
    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ️ No migrations found');
      return;
    }

    console.log(`📋 Found ${migrationFiles.length} migration(s)`);

    // Initialize Strapi instance for database access
    const strapi = require('@strapi/strapi')();
    await strapi.load();

    const knex = strapi.db.connection;

    // Ensure migrations table exists
    const migrationsTableExists = await knex.schema.hasTable('migrations');
    if (!migrationsTableExists) {
      await knex.schema.createTable('migrations', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamp('batch').notNullable();
        table.timestamp('migration_time').defaultTo(knex.fn.now());
      });
      console.log('✅ Created migrations table');
    }

    // Get already run migrations
    const completedMigrations = await knex('migrations').select('name');
    const completedNames = completedMigrations.map(m => m.name);

    // Run pending migrations
    let batch = 1;
    if (completedMigrations.length > 0) {
      const lastBatch = await knex('migrations').max('batch as maxBatch').first();
      batch = (lastBatch.maxBatch || 0) + 1;
    }

    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.js');
      
      if (completedNames.includes(migrationName)) {
        console.log(`⏭️ Skipping ${migrationName} (already run)`);
        continue;
      }

      console.log(`🔄 Running ${migrationName}...`);
      
      try {
        const migration = require(path.join(migrationsDir, file));
        
        if (typeof migration.up !== 'function') {
          throw new Error(`Migration ${migrationName} does not export an 'up' function`);
        }

        await migration.up(knex);
        
        // Record migration as completed
        await knex('migrations').insert({
          name: migrationName,
          batch: batch,
          migration_time: new Date(),
        });
        
        console.log(`✅ Completed ${migrationName}`);
        
      } catch (error) {
        console.error(`❌ Failed to run migration ${migrationName}:`, error.message);
        throw error;
      }
    }

    await strapi.destroy();
    console.log('🎉 All migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;