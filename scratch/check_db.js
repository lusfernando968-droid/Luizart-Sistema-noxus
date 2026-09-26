import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrwjsqizpiutfoheriuv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyd2pzcWl6cGl1dGZvaGVyaXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzE5MjIsImV4cCI6MjEwMDEwNzkyMn0.b2K2v1IK5nE9aDW7bj5tIsQIPklVqIvBCdo2quxDGtU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data, error } = await supabase.from('nx_financial_transactions').select('*').limit(0);
  // data should be an empty array, but we can look at the network request if we had a browser, 
  // or we can just fetch one row if there is one. 
  // Better yet, insert a dummy record and get the columns:
  const { data: qData, error: qError } = await supabase.from('nx_financial_transactions').insert({ description: "Test", value: 10, type: "entrada" }).select();
  console.log(qData, qError);
}

checkTables();
