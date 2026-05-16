import React, { useEffect, useRef, useState } from 'react';
import { SoundService } from '../services/soundEffects';
import { Vibration } from '../services/vibrationService';

const NudgeManager: React.FC = () => {
    const lastActivity = useRef(Date.now());
    const [shake, setShake] = useState(false);

    useEffect(() => {
        const handleActivity = () => {
            lastActivity.current = Date.now();
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        const checkInactivity = setInterval(() => {
            if (Date.now() - lastActivity.current > 10000) { // 10s
                // Trigger Nudge
                console.log("[TRIGGER_MSN_NUDGE]");
                setShake(true);
                SoundService.playError(); // Use existing sound as placeholder
                Vibration.error();
                
                setTimeout(() => setShake(false), 500); // 500ms shake

                // Reset timer so it doesn't loop infinitely
                lastActivity.current = Date.now();
            }
        }, 2000);

        return () => {
             window.removeEventListener('mousemove', handleActivity);
             window.removeEventListener('keydown', handleActivity);
             window.removeEventListener('touchstart', handleActivity);
             clearInterval(checkInactivity);
        };
    }, []);

    return (
        <div className={`fixed inset-0 pointer-events-none z-[1000] ${shake ? 'animate-[shake_0.1s_infinite]' : ''}`}>
             {shake && <div className="absolute inset-0 bg-red-900/10 border-4 border-red-500"></div>}
        </div>
    );
};

export default NudgeManager;
