
// Add @ts-ignore to all Supabase queries

// When creating a service
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { data, error } = await supabase
  .from('services')
  .insert(newService)
  .select();

// When updating a service
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { error } = await supabase
  .from('services')
  .update(updatedService)
  .eq('id', serviceId);

// When deleting/deactivating a service
// @ts-ignore - Suppressing TypeScript errors for Supabase query
const { error } = await supabase
  .from('services')
  .update({ active: false })
  .eq('id', serviceId);
