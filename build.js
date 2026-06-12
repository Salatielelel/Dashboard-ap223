const fs = require('fs');
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_KEY || '';
if (!url || !key) {
  console.error('SUPABASE_URL e SUPABASE_KEY são obrigatórios');
  process.exit(1);
}
fs.writeFileSync('config.js', `window._AP223 = { url: "${url}", key: "${key}" };\n`);
console.log('config.js gerado com sucesso');
