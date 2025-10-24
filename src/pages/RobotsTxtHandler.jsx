import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/api/client';

export default function RobotsTxtHandler() {
  const { storeCode } = useParams();

  useEffect(() => {
    const fetchRobotsTxt = async () => {
      try {
        // Fetch robots.txt content from API
        const response = await apiClient.publicRequest('GET', `robots/store/${storeCode}`);

        // Set content type and render as plain text
        document.documentElement.innerHTML = `<pre style="margin:0;font-family:monospace;white-space:pre-wrap;word-wrap:break-word;">${response}</pre>`;
        document.contentType = 'text/plain';

      } catch (error) {
        console.error('Error fetching robots.txt:', error);
        // Serve basic robots.txt on error
        document.documentElement.innerHTML = `<pre style="margin:0;font-family:monospace;">User-agent: *
Allow: /
Disallow: /admin/</pre>`;
      }
    };

    fetchRobotsTxt();
  }, [storeCode]);

  // Return null while loading, content will be replaced
  return null;
}
