/**
 * Fix active_filters slot by restoring the component field
 * Run with: node fix-active-filters-slot.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jqqfjfoigtwdpnlicjmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWZqZm9pZ3R3ZHBubGljam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MTU4OTUsImV4cCI6MjA0ODI5MTg5NX0.ps3_JSp4aXbfi1iztocs7zfVjPO1e72hLSc6SaR_3G0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixActiveFiltersSlot() {
  console.log('🔧 Fixing active_filters slot...\n');

  try {
    // First, get the current slot
    const { data: currentSlot, error: fetchError } = await supabase
      .from('slots')
      .select('*')
      .eq('slot_id', 'active_filters')
      .eq('slot_type', 'category_layout')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching slot:', fetchError);
      return;
    }

    if (!currentSlot) {
      console.log('ℹ️  No active_filters slot found in database');
      return;
    }

    console.log('📋 Current slot configuration:');
    console.log('   Type:', currentSlot.configuration?.type);
    console.log('   Component:', currentSlot.configuration?.component);
    console.log('   Has content:', !!currentSlot.configuration?.content);

    // Update the configuration to add component field
    const updatedConfiguration = {
      ...currentSlot.configuration,
      component: 'ActiveFilters'
    };

    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({ configuration: updatedConfiguration })
      .eq('slot_id', 'active_filters')
      .eq('slot_type', 'category_layout')
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating slot:', updateError);
      return;
    }

    console.log('\n✅ Successfully updated active_filters slot!');
    console.log('📋 Updated configuration:');
    console.log('   Type:', updatedSlot.configuration?.type);
    console.log('   Component:', updatedSlot.configuration?.component);
    console.log('\n🎉 The active_filters component should now render correctly on the storefront.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixActiveFiltersSlot();
