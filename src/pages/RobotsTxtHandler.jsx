import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function RobotsTxtHandler() {
  const { storeCode } = useParams();

  useEffect(() => {
    const fetchRobotsTxt = async () => {
      try {
        // Fetch robots.txt content from API as plain text
        const response = await fetch(`/api/robots/store/${storeCode}`);
        const text = await response.text();

        // Replace entire document with plain text robots.txt
        document.documentElement.innerHTML = `<pre style="margin:0;font-family:monospace;white-space:pre-wrap;word-wrap:break-word;">${text}</pre>`;

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
