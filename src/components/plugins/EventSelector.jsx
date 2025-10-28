import React from 'react';
import { Input } from "@/components/ui/input";
import { PLUGIN_EVENTS } from '@/constants/PluginEvents';

/**
 * EventSelector - Reusable event selection component
 * Shows searchable list of available events with descriptions
 */
export default function EventSelector({
  searchQuery,
  onSearchChange,
  selectedEvent,
  onSelectEvent,
  showConfirmation = true
}) {
  // Get all events from centralized constants
  const allEvents = Object.entries(PLUGIN_EVENTS);

  // Filter events by search query
  const filteredEvents = allEvents.filter(([eventName, eventData]) =>
    eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eventData.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query is a custom event (not in predefined list)
  const isCustomEvent = searchQuery && !allEvents.some(([name]) => name === searchQuery);

  return (
    <div>
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search events..."
        className="w-full mb-2"
      />

      <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
        {filteredEvents.map(([eventName, eventData]) => (
          <div
            key={eventName}
            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedEvent === eventName ? 'bg-blue-100 font-medium' : ''}`}
            onClick={() => onSelectEvent(eventName)}
          >
            <div className="text-sm font-medium text-gray-900">{eventName}</div>
            <div className="text-xs text-gray-500">{eventData.description}</div>
          </div>
        ))}

        {/* Custom Event Option */}
        {isCustomEvent && (
          <div
            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 border-t ${selectedEvent === searchQuery ? 'bg-blue-100 font-medium' : ''}`}
            onClick={() => onSelectEvent(searchQuery)}
          >
            <div className="text-sm font-medium text-gray-900">✨ Use custom: {searchQuery}</div>
            <div className="text-xs text-gray-500">Create a custom event listener</div>
          </div>
        )}

        {filteredEvents.length === 0 && !isCustomEvent && (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No events found. Type to create custom event.
          </div>
        )}
      </div>

      {selectedEvent && showConfirmation && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          ✓ Selected: <strong>{selectedEvent}</strong>
        </div>
      )}
    </div>
  );
}
