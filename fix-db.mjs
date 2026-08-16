import fs from 'fs';

let f = 'lib/supabase/tasks.ts';
let c = fs.readFileSync(f, 'utf-8');
c = c.replace(/await supabase\.from\('tasks'\)\.insert\(/, "await supabase.from('tasks').upsert(");
c = c.replace(/export async function updateTask\(id: string, updates: Partial<Task>\) \{[\s\S]+?const dbUpdates: any = \{ updated_at: new Date\(\)\.toISOString\(\) \};/, `export async function updateTask(id: string, updates: Partial<Task>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUpdates: any = { id, user_id: user.id, updated_at: new Date().toISOString() };`);
c = c.replace(/await supabase\.from\('tasks'\)\.update\(dbUpdates\)\.eq\('id', id\)/, "await supabase.from('tasks').upsert(dbUpdates)");
fs.writeFileSync(f, c);

f = 'lib/supabase/events.ts';
c = fs.readFileSync(f, 'utf-8');
c = c.replace(/await supabase\.from\('events'\)\.insert\(/, "await supabase.from('events').upsert(");
fs.writeFileSync(f, c);

f = 'lib/supabase/medicines.ts';
c = fs.readFileSync(f, 'utf-8');
c = c.replace(/await supabase\.from\('medicines'\)\.insert\(/, "await supabase.from('medicines').upsert(");
fs.writeFileSync(f, c);

f = 'lib/supabase/habits.ts';
c = fs.readFileSync(f, 'utf-8');
c = c.replace(/await supabase\.from\('habits'\)\.insert\(/, "await supabase.from('habits').upsert(");
fs.writeFileSync(f, c);

console.log("Fixed upserts");
