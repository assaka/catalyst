import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function RobotsPublic() {
    const { storeCode } = useParams();
    const [robotsContent, setRobotsContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRobotsContent = async () => {
            try {
                // Use the backend API endpoint for robots.txt
                const response = await fetch(`/api/robots/store/${storeCode}`, {
                    headers: {
                        'Accept': 'text/plain'
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    setRobotsContent(content);
                } else {
                    // Fallback robots.txt content
                    setRobotsContent(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /login`);
                }
            } catch (error) {
                console.error('Error fetching robots.txt:', error);
                // Fallback robots.txt content
                setRobotsContent(`User-agent: *
Allow: /
Disallow: /admin/`);
            } finally {
                setLoading(false);
            }
        };

        if (storeCode) {
            fetchRobotsContent();
        }
    }, [storeCode]);

    useEffect(() => {
        // Set document title and remove HTML styling for pure text output
        document.title = 'robots.txt';
        
        // Remove all meta tags that might interfere
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(tag => {
            if (tag.getAttribute('name') === 'robots' || 
                tag.getAttribute('name') === 'description' ||
                tag.getAttribute('property')?.startsWith('og:')) {
                tag.remove();
            }
        });

        // Set body style for plain text display
        document.body.style.fontFamily = 'monospace';
        document.body.style.fontSize = '12px';
        document.body.style.lineHeight = '1.2';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.backgroundColor = 'white';
        document.body.style.color = 'black';

        return () => {
            // Reset body styles when component unmounts
            document.body.style.fontFamily = '';
            document.body.style.fontSize = '';
            document.body.style.lineHeight = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
        };
    }, []);

    if (loading) {
        return <div>Loading robots.txt...</div>;
    }

    // Return plain text content as pre-formatted text
    return (
        <pre style={{
            margin: 0,
            padding: 0,
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.2',
            whiteSpace: 'pre-wrap',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            outline: 'none'
        }}>
            {robotsContent}
        </pre>
    );
}