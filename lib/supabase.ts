import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aormnktrjugshvnpmobp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcm1ua3RyanVnc2h2bnBtb2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDU1MDMsImV4cCI6MjA4NDQyMTUwM30.1WynnlXsS-N-3-vt_EkdpyG3l9dfk3JiVnf6Qoq2GL4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
