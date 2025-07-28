// Comprehensive list of timezones with their display names and UTC offsets
export const TIMEZONES = [
  // UTC and GMT
  { value: 'UTC', label: 'UTC - Coordinated Universal Time', offset: '+00:00' },
  { value: 'GMT', label: 'GMT - Greenwich Mean Time', offset: '+00:00' },
  
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (New York)', offset: '-05:00/-04:00' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)', offset: '-06:00/-05:00' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)', offset: '-07:00/-06:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', offset: '-08:00/-07:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)', offset: '-09:00/-08:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)', offset: '-10:00' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)', offset: '-05:00/-04:00' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)', offset: '-08:00/-07:00' },
  { value: 'America/Mexico_City', label: 'Central Time (Mexico City)', offset: '-06:00/-05:00' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (São Paulo)', offset: '-03:00/-02:00' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (Buenos Aires)', offset: '-03:00' },
  { value: 'America/Lima', label: 'Peru Time (Lima)', offset: '-05:00' },
  { value: 'America/Bogota', label: 'Colombia Time (Bogotá)', offset: '-05:00' },
  { value: 'America/Caracas', label: 'Venezuela Time (Caracas)', offset: '-04:00' },
  
  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)', offset: '+00:00/+01:00' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)', offset: '+01:00/+02:00' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)', offset: '+01:00/+02:00' },
  { value: 'Europe/Rome', label: 'Central European Time (Rome)', offset: '+01:00/+02:00' },
  { value: 'Europe/Madrid', label: 'Central European Time (Madrid)', offset: '+01:00/+02:00' },
  { value: 'Europe/Amsterdam', label: 'Central European Time (Amsterdam)', offset: '+01:00/+02:00' },
  { value: 'Europe/Brussels', label: 'Central European Time (Brussels)', offset: '+01:00/+02:00' },
  { value: 'Europe/Vienna', label: 'Central European Time (Vienna)', offset: '+01:00/+02:00' },
  { value: 'Europe/Zurich', label: 'Central European Time (Zurich)', offset: '+01:00/+02:00' },
  { value: 'Europe/Stockholm', label: 'Central European Time (Stockholm)', offset: '+01:00/+02:00' },
  { value: 'Europe/Copenhagen', label: 'Central European Time (Copenhagen)', offset: '+01:00/+02:00' },
  { value: 'Europe/Oslo', label: 'Central European Time (Oslo)', offset: '+01:00/+02:00' },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (Helsinki)', offset: '+02:00/+03:00' },
  { value: 'Europe/Warsaw', label: 'Central European Time (Warsaw)', offset: '+01:00/+02:00' },
  { value: 'Europe/Prague', label: 'Central European Time (Prague)', offset: '+01:00/+02:00' },
  { value: 'Europe/Budapest', label: 'Central European Time (Budapest)', offset: '+01:00/+02:00' },
  { value: 'Europe/Athens', label: 'Eastern European Time (Athens)', offset: '+02:00/+03:00' },
  { value: 'Europe/Istanbul', label: 'Turkey Time (Istanbul)', offset: '+03:00' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time', offset: '+03:00' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)', offset: '+04:00' },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time (Karachi)', offset: '+05:00' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Mumbai)', offset: '+05:30' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (Dhaka)', offset: '+06:00' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (Bangkok)', offset: '+07:00' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time', offset: '+08:00' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)', offset: '+08:00' },
  { value: 'Asia/Taipei', label: 'Taipei Standard Time', offset: '+08:00' },
  { value: 'Asia/Manila', label: 'Philippines Standard Time (Manila)', offset: '+08:00' },
  { value: 'Asia/Jakarta', label: 'Western Indonesia Time (Jakarta)', offset: '+07:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)', offset: '+09:00' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (Seoul)', offset: '+09:00' },
  { value: 'Asia/Pyongyang', label: 'Korea Standard Time (Pyongyang)', offset: '+09:00' },
  
  // Australia & Oceania
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)', offset: '+10:00/+11:00' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (Melbourne)', offset: '+10:00/+11:00' },
  { value: 'Australia/Brisbane', label: 'Australian Eastern Time (Brisbane)', offset: '+10:00' },
  { value: 'Australia/Perth', label: 'Australian Western Time (Perth)', offset: '+08:00' },
  { value: 'Australia/Adelaide', label: 'Australian Central Time (Adelaide)', offset: '+09:30/+10:30' },
  { value: 'Australia/Darwin', label: 'Australian Central Time (Darwin)', offset: '+09:30' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (Auckland)', offset: '+12:00/+13:00' },
  { value: 'Pacific/Fiji', label: 'Fiji Time', offset: '+12:00/+13:00' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Eastern European Time (Cairo)', offset: '+02:00' },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time', offset: '+02:00' },
  { value: 'Africa/Lagos', label: 'West Africa Time (Lagos)', offset: '+01:00' },
  { value: 'Africa/Nairobi', label: 'East Africa Time (Nairobi)', offset: '+03:00' },
  { value: 'Africa/Casablanca', label: 'Western European Time (Casablanca)', offset: '+00:00/+01:00' },
  
  // Additional commonly used zones
  { value: 'Atlantic/Reykjavik', label: 'Greenwich Mean Time (Reykjavik)', offset: '+00:00' },
  { value: 'America/Phoenix', label: 'Mountain Standard Time (Phoenix)', offset: '-07:00' },
  { value: 'America/Indiana/Indianapolis', label: 'Eastern Time (Indianapolis)', offset: '-05:00/-04:00' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Standard Time (Puerto Rico)', offset: '-04:00' },
  { value: 'Pacific/Guam', label: 'Chamorro Standard Time (Guam)', offset: '+10:00' },
];

// Group timezones by region for better organization
export const TIMEZONE_GROUPS = {
  'UTC': TIMEZONES.filter(tz => tz.value === 'UTC' || tz.value === 'GMT'),
  'North America': TIMEZONES.filter(tz => 
    tz.value.startsWith('America/') && 
    (tz.value.includes('New_York') || tz.value.includes('Chicago') || 
     tz.value.includes('Denver') || tz.value.includes('Los_Angeles') || 
     tz.value.includes('Anchorage') || tz.value.includes('Toronto') || 
     tz.value.includes('Vancouver') || tz.value.includes('Mexico_City') ||
     tz.value.includes('Phoenix') || tz.value.includes('Indianapolis')) ||
    tz.value.startsWith('Pacific/Honolulu') || tz.value.includes('Puerto_Rico')
  ),
  'South America': TIMEZONES.filter(tz => 
    tz.value.includes('Sao_Paulo') || tz.value.includes('Buenos_Aires') || 
    tz.value.includes('Lima') || tz.value.includes('Bogota') || 
    tz.value.includes('Caracas')
  ),
  'Europe': TIMEZONES.filter(tz => tz.value.startsWith('Europe/') || tz.value.includes('Reykjavik')),
  'Asia': TIMEZONES.filter(tz => tz.value.startsWith('Asia/')),
  'Australia & Oceania': TIMEZONES.filter(tz => 
    tz.value.startsWith('Australia/') || 
    tz.value.startsWith('Pacific/') && !tz.value.includes('Honolulu')
  ),
  'Africa': TIMEZONES.filter(tz => tz.value.startsWith('Africa/')),
  'Other': TIMEZONES.filter(tz => tz.value.includes('Guam'))
};

// Helper function to get current time in a timezone
export const getCurrentTimeInTimezone = (timezone) => {
  try {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    return 'Invalid timezone';
  }
};

// Helper function to get timezone offset
export const getTimezoneOffset = (timezone) => {
  try {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (getTimezoneOffsetInMinutes(timezone) * 60000));
    const offset = (targetTime.getTime() - utcTime) / (1000 * 60 * 60);
    return offset >= 0 ? `+${offset.toString().padStart(2, '0')}:00` : `${offset.toString().padStart(3, '0')}:00`;
  } catch (error) {
    return '+00:00';
  }
};

const getTimezoneOffsetInMinutes = (timezone) => {
  const date = new Date();
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (localDate.getTime() - utcDate.getTime()) / (1000 * 60);
};