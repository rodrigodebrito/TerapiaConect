import React, { useRef, useEffect, useState } from 'react';

const DailyFrame = ({ roomUrl, onLoad }) => {
  const iframeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Modify the URL to disable the prejoin UI (waiting room)
  // and handle PIP mode
  const enhancedUrl = () => {
    // Start with the base URL
    let url = roomUrl;
    
    // Create URL with all parameters to forcefully disable prejoin UI
    const params = new URLSearchParams();
    
    // Critical parameters to disable Daily.co's waiting room
    params.append('prejoin', 'false');       // Explicitly disable prejoin UI
    params.append('waiting_room', 'false');  // Disable waiting room
    params.append('auto_join', 'true');      // Auto join the meeting
    params.append('skip_prejoin', 'true');   // Skip the prejoin UI completely
    params.append('show_prejoin_ui', 'false'); // Another way to hide prejoin
    params.append('show_call_leave_button', 'true'); // Show leave button
    params.append('pip', 'true');            // Enable PIP support
    
    // Append the parameters to the URL
    if (url.includes('?')) {
      url = `${url}&${params.toString()}`;
    } else {
      url = `${url}?${params.toString()}`;
    }
    
    console.log('Enhanced Daily.co URL with force disable waiting room:', url);
    return url;
  };
  
  // Handle postMessage communication with Daily.co iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Make sure the message is from Daily.co
      if (!event.data || typeof event.data !== 'object') return;
      
      // If we receive the 'ready-to-join' event or anything similar, force join
      if (event.data.action === 'ready-to-join' || 
          event.data.action === 'prejoin-loaded' || 
          event.data.action === 'waiting-room-loaded') {
        
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            // Try to send a force-join message
            iframeRef.current.contentWindow.postMessage({
              action: 'join-meeting',
              force: true
            }, '*');
            
            console.log('Sent force-join message to Daily.co iframe');
          }
        } catch (err) {
          console.error('Error forcing join:', err);
        }
      }
    };
    
    // Listen for messages from the iframe
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  useEffect(() => {
    if (iframeRef.current) {
      setIsLoaded(true);
      onLoad && onLoad(iframeRef.current);
      
      // After iframe loads, try to join directly
      setTimeout(() => {
        try {
          if (iframeRef.current.contentWindow) {
            // Try to bypass prejoin UI by sending direct join command
            iframeRef.current.contentWindow.postMessage({
              action: 'join-meeting',
              force: true
            }, '*');
          }
        } catch (err) {
          console.error('Error sending join command:', err);
        }
      }, 1000);
    }
  }, [onLoad]);
  
  return (
    <iframe
      ref={iframeRef}
      title="Daily.co Meeting"
      className={`daily-iframe ${isLoaded ? 'loaded' : ''}`}
      src={enhancedUrl()}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#1a1a1a'
      }}
    />
  );
};

export default DailyFrame; 