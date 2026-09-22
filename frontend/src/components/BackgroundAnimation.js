import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Box } from "@mui/material";

const BackgroundAnimation = () => {
    const particlesInit = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    return (
        <>
        <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            zIndex: -2,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: '#050816', // Deep space dark background
        }}>
            {/* Subtle glow for depth */}
            <Box sx={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
                filter: 'blur(80px)',
                borderRadius: '50%',
            }} />
            
            <Box sx={{
                position: 'absolute',
                bottom: '10%',
                right: '5%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(79, 124, 255, 0.05) 0%, transparent 60%)',
                filter: 'blur(100px)',
                borderRadius: '50%',
            }} />

            {/* Micro grid for tech feel */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundSize: '40px 40px',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            }} />
        </Box>

        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fullScreen: { 
                    enable: true,
                    zIndex: -1
                },
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 60,
                particles: {
                    number: {
                        value: 50,
                        density: {
                            enable: true,
                            area: 800,
                        },
                    },
                    color: {
                        value: ["#3B82F6", "#4F7CFF", "#ffffff"],
                    },
                    shape: {
                        type: "circle",
                    },
                    opacity: {
                        value: { min: 0.1, max: 0.4 },
                        animation: {
                            enable: true,
                            speed: 0.5,
                            sync: false,
                        },
                    },
                    size: {
                        value: { min: 1, max: 2 },
                    },
                    links: {
                        enable: true,
                        distance: 140,
                        color: "#3B82F6",
                        opacity: 0.2,
                        width: 1,
                        triangles: {
                            enable: true,
                            color: "#4F7CFF",
                            opacity: 0.03
                        }
                    },
                    move: {
                        enable: true,
                        speed: 0.4,
                        direction: "none",
                        random: true,
                        straight: false,
                        outModes: {
                            default: "bounce",
                        },
                    },
                },
                interactivity: {
                    detectsOn: "canvas",
                    events: {
                        onHover: {
                            enable: true,
                            mode: "grab",
                        },
                        onClick: {
                            enable: true,
                            mode: "push",
                        },
                        resize: true,
                    },
                    modes: {
                        grab: {
                            distance: 180,
                            links: {
                                opacity: 0.4,
                                color: "#3B82F6"
                            },
                        },
                        push: {
                            quantity: 2,
                        },
                    },
                },
                detectRetina: true,
            }}
        />
        </>
    );
};

export default BackgroundAnimation;
