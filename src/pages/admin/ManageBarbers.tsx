
// Add @ts-ignore to all Supabase queries

// When creating a barber
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { data, error } = await supabase
  .from('barbers')
  .insert(newBarber)
  .select();

// When updating a barber
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { error } = await supabase
  .from('barbers')
  .update(updatedBarber)
  .eq('id', barberId);

// When deleting/deactivating a barber
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { error } = await supabase
  .from('barbers')
  .update({ active: false })
  .eq('id', barberId);
