// Seeds demo users and a starter drug catalog.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Drug } = require('./infrastructure/database/models');

const drugs = [
  { code: 'PCM-500', name: 'Paracetamol 500mg', category: 'Analgesic', unit: 'tablet', stock: 500, minStock: 100 },
  { code: 'AMX-500', name: 'Amoxicillin 500mg', category: 'Antibiotic', unit: 'capsule', stock: 300, minStock: 60 },
  { code: 'IBU-400', name: 'Ibuprofen 400mg', category: 'Analgesic', unit: 'tablet', stock: 250, minStock: 50 },
  { code: 'OMZ-20', name: 'Omeprazole 20mg', category: 'Antacid', unit: 'capsule', stock: 180, minStock: 40 },
  { code: 'CTM-4', name: 'Chlorpheniramine 4mg', category: 'Antihistamine', unit: 'tablet', stock: 400, minStock: 80 },
  { code: 'NS-500', name: 'NaCl 0.9% 500ml', category: 'IV Fluid', unit: 'bottle', stock: 120, minStock: 30 },
  { code: 'DEX-5', name: 'Dexamethasone 5mg/ml', category: 'Corticosteroid', unit: 'ampoule', stock: 90, minStock: 20 },
  { code: 'INS-100', name: 'Insulin 100 IU/ml', category: 'Antidiabetic', unit: 'vial', stock: 45, minStock: 15 },
  { code: 'SAL-2', name: 'Salbutamol 2mg', category: 'Bronchodilator', unit: 'tablet', stock: 8, minStock: 40 },
  { code: 'MFN-500', name: 'Metformin 500mg', category: 'Antidiabetic', unit: 'tablet', stock: 350, minStock: 70 },
];

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const password = await bcrypt.hash('password123', 10);
  await User.bulkCreate(
    [
      { name: 'Pharmacy Admin', email: 'pharmacy@hospital.test', password, role: 'pharmacy' },
      { name: 'ER Staff', email: 'er@hospital.test', password, role: 'department', departmentName: 'Emergency Room' },
      { name: 'ICU Staff', email: 'icu@hospital.test', password, role: 'department', departmentName: 'Intensive Care Unit' },
    ],
    { ignoreDuplicates: true }
  );

  for (const d of drugs) {
    await Drug.findOrCreate({ where: { code: d.code }, defaults: d });
  }

  console.log('Seed complete.');
  console.log('Logins (password for all: password123):');
  console.log('  pharmacy@hospital.test  — pharmacy');
  console.log('  er@hospital.test        — department (Emergency Room)');
  console.log('  icu@hospital.test       — department (ICU)');
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
