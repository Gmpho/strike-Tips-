import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Hero: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const [activeTrack, setActiveTrack] = useState('Kenilworth');
    const [is3dEnabled, setIs3dEnabled] = useState(true);
    const [isRotating, setIsRotating] = useState(true);

    useEffect(() => {
        if (!mountRef.current || !is3dEnabled) {
            return;
        }

        const currentMount = mountRef.current;
        let animationFrameId: number;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 7);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.minDistance = 4;
        controls.maxDistance = 15;
        controls.autoRotate = false; // We control rotation manually
        controlsRef.current = controls;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(5, 3, 5);
        scene.add(dirLight);
        const pointLight1 = new THREE.PointLight(0x00aaff, 1.5, 100);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);
        const pointLight2 = new THREE.PointLight(0xff00aa, 1.0, 100);
        pointLight2.position.set(-10, -10, -10);
        scene.add(pointLight2);
        
        // Holographic Globe
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const wireframeGeometry = new THREE.SphereGeometry(2.0, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        globeGroup.add(wireframeMesh);
        
        const innerGlowGeometry = new THREE.SphereGeometry(1.8, 32, 32);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        globeGroup.add(innerGlowMesh);

        // Resize handler
        const handleResize = () => {
            if (currentMount) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            if (isRotating) {
                globeGroup.rotation.y += 0.002;
            }
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (currentMount) {
                 // Check if the renderer's DOM element is still a child before removing
                if (renderer.domElement.parentNode === currentMount) {
                    currentMount.removeChild(renderer.domElement);
                }
            }
        };
    }, [is3dEnabled, isRotating]); // Rerun effect when 3D is enabled/disabled or rotation changes


    const handleToggle3D = () => {
        setIs3dEnabled(prev => !prev);
    };

    const handleToggleRotation = () => {
        setIsRotating(prev => !prev);
    };

    const handleResetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const handleGetStartedClick = () => {
        document.getElementById('predictions')?.scrollIntoView({ behavior: 'smooth' });
    };
    
    return (
        <section className="relative h-screen min-h-[700px] flex flex-col bg-white dark:bg-gradient-to-b dark:from-[#05060a] dark:to-[#071024] text-gray-900 dark:text-white overflow-hidden">
             {/* 3D Canvas Container */}
            <div 
                ref={mountRef} 
                className={`absolute top-0 left-0 w-full h-full z-0 transition-opacity duration-500 ${is3dEnabled ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* UI Overlay */}
            <div className="relative z-10 flex flex-col flex-grow h-full">
                
                <div className="flex-grow flex items-center justify-center text-center">
                    <div className="px-4">
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-500 dark:from-blue-400 dark:to-pink-500 leading-tight">
                           Global Performance Analytics
                        </h1>
                        <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Real-time horse racing data with predictive analytics and performance metrics
                        </p>
                        <button
                            onClick={handleGetStartedClick}
                            className="mt-8 px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-pink-500 rounded-md hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                        >
                            Get Started
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-[120px] left-0 right-0 px-4 sm:px-6 lg:px-8">
                     <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="hidden sm:flex items-center gap-2 p-1 bg-white dark:bg-black/20 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none">
                            {['Kenilworth', 'Ascot', 'Gulfstream', 'Sha Tin'].map(track => (
                                <button 
                                    key={track}
                                    onClick={() => setActiveTrack(track)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTrack === track ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                >
                                    {track}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-white dark:bg-black/20 backdrop-blur-sm rounded-full border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none">
                            <button onClick={handleResetView} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" aria-label="Reset View">↺</button>
                            <button onClick={handleToggleRotation} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" aria-label="Toggle Rotation">
                                {isRotating ? '⏸' : '▶️'}
                            </button>
                            <button onClick={handleToggle3D} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" aria-label="Toggle 3D">
                                {is3dEnabled ? '⧉' : '□'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md border-t border-gray-200 dark:border-white/10">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                             <div className="py-4 md:border-r border-gray-200 dark:border-white/10">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Track Statistics</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-400">Active Races</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">24</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-400">Horses Tracked</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">312</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-400">Betting Volume</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">$2.4M</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-400">Accuracy Rate</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">84.2%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="py-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-pink-500 dark:text-pink-400 mb-3 ml-0 md:ml-6">Next Race: Kentucky Derby</h4>
                                <div className="flex flex-col sm:flex-row gap-4 md:ml-6">
                                    <div className="flex-shrink-0">
                                        <p className="font-bold text-gray-900 dark:text-white">Kentucky Derby</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-400">1.25 miles • Fast track • 6:50 PM EST</p>
                                    </div>
                                    <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <div className="bg-white dark:bg-white/5 rounded p-2 text-center border border-gray-200 dark:border-white/10 shadow-sm">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Thunder Bolt</p>
                                            <p className="text-xs text-pink-500 dark:text-pink-400 font-bold">3/1</p>
                                        </div>
                                        <div className="bg-white dark:bg-white/5 rounded p-2 text-center border border-gray-200 dark:border-white/10 shadow-sm">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Midnight Run</p>
                                            <p className="text-xs text-pink-500 dark:text-pink-400 font-bold">5/2</p>
                                        </div>
                                        <div className="bg-white dark:bg-white/5 rounded p-2 text-center border border-gray-200 dark:border-white/10 shadow-sm">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Golden Spirit</p>
                                            <p className="text-xs text-pink-500 dark:text-pink-400 font-bold">7/2</p>
                                        </div>
                                        <div className="bg-white dark:bg-white/5 rounded p-2 text-center border border-gray-200 dark:border-white/10 shadow-sm">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Silver Streak</p>
                                            <p className="text-xs text-pink-500 dark:text-pink-400 font-bold">9/2</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;