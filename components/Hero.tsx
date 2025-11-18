
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Helper to get a random point on a sphere
const getRandomPointOnSphere = (radius: number) => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
};

const Hero: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const globeMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);
    const linesGroupRef = useRef<THREE.Group | null>(null);

    const [activeRegion, setActiveRegion] = useState('Kenilworth');
    const [isRotating, setIsRotating] = useState(true);
    const [showLines, setShowLines] = useState(true);
    
    const regionColors: { [key: string]: number } = {
        'Kenilworth': 0x00aaff, // Blue
        'Ascot': 0xff00aa,      // Pink
        'Gulfstream': 0x00ffaa, // Green
        'Sha Tin': 0xffaa00,    // Orange
    };

    useEffect(() => {
        if (!mountRef.current) return;

        const currentMount = mountRef.current;
        let animationFrameId: number;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 8);

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
        controls.autoRotate = false;
        controlsRef.current = controls;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        // Holographic Globe
        const GLOBE_RADIUS = 2;
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // Main sphere
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        const globeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: regionColors[activeRegion],
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.2,
            shininess: 100,
        });
        globeMaterialRef.current = globeMaterial;
        const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
        globeGroup.add(globeMesh);
        
        // Wireframe overlay
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const wireframeMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS * 1.01, 32, 32), wireframeMaterial);
        globeGroup.add(wireframeMesh);
        
        // Connection Lines
        const linesGroup = new THREE.Group();
        linesGroupRef.current = linesGroup;
        globeGroup.add(linesGroup);
        const connectionLines: { line: THREE.Line, a: number, b: number, speed: number }[] = [];
        for (let i = 0; i < 50; i++) {
            const start = getRandomPointOnSphere(GLOBE_RADIUS + 0.02);
            const end = getRandomPointOnSphere(GLOBE_RADIUS + 0.02);
            const curve = new THREE.CatmullRomCurve3([start, new THREE.Vector3(0,0,0), end]);
            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: Math.random() * 0.5 });
            const line = new THREE.Line(geometry, material);
            connectionLines.push({ line, a: Math.random(), b: Math.random(), speed: Math.random() * 0.01 + 0.005 });
            linesGroup.add(line);
        }

        // Pulsing energy fields
        const pulses: { mesh: THREE.Mesh, speed: number }[] = [];
        for (let i = 0; i < 3; i++) {
            const pulseGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * (1.1 + i * 0.1), 32, 32);
            const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.2, side: THREE.BackSide });
            const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
            pulses.push({ mesh: pulseMesh, speed: 0.005 + i * 0.002 });
            scene.add(pulseMesh);
        }

        // Orbital rings
        for (let i = 0; i < 2; i++) {
            const ringGeometry = new THREE.TorusGeometry(GLOBE_RADIUS * (1.8 + i * 0.3), 0.01, 16, 100);
            const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
            ring.rotation.y = (Math.random() - 0.5) * 0.2;
            globeGroup.add(ring);
        }

        // Satellites
        const satellitesGroup = new THREE.Group();
        scene.add(satellitesGroup);
        const satellites: { mesh: THREE.Mesh, curve: THREE.EllipseCurve, offset: number }[] = [];
        for (let i = 0; i < 5; i++) {
            const radiusX = GLOBE_RADIUS * (1.5 + Math.random() * 1.5);
            const radiusY = GLOBE_RADIUS * (1.5 + Math.random() * 1.5);
            const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, 2 * Math.PI, false, 0);
            const points = curve.getPoints(100);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 });
            const orbit = new THREE.Line(geometry, material);
            orbit.rotation.x = Math.random() * Math.PI;
            orbit.rotation.y = Math.random() * Math.PI;
            satellitesGroup.add(orbit);

            const satGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const satMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const satellite = new THREE.Mesh(satGeometry, satMaterial);
            satellites.push({ mesh: satellite, curve, offset: Math.random() });
            orbit.add(satellite);
        }

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
        const clock = new THREE.Clock();
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            animationFrameId = requestAnimationFrame(animate);
            controls.update();

            if (isRotating) {
                globeGroup.rotation.y += 0.001;
                satellitesGroup.rotation.y += 0.0005;
            }

            // Animate lines
            connectionLines.forEach(item => {
                const opacity = 0.5 * (0.5 * Math.sin(elapsedTime * item.b + item.a * Math.PI) + 0.5);
                (item.line.material as THREE.LineBasicMaterial).opacity = opacity;
            });
            
            // Animate pulses
            pulses.forEach(pulse => {
                const scale = 1 + Math.sin(elapsedTime * pulse.speed) * 0.1;
                pulse.mesh.scale.set(scale, scale, scale);
                (pulse.mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - (scale - 1) / 0.1);
            });

            // Animate satellites
            satellites.forEach(sat => {
                const t = (elapsedTime * 0.1 + sat.offset) % 1;
                const point = sat.curve.getPoint(t);
                sat.mesh.position.set(point.x, point.y, 0);
            });


            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (currentMount && renderer.domElement.parentNode === currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, [isRotating]);

    useEffect(() => {
        if (globeMaterialRef.current) {
            globeMaterialRef.current.emissive.setHex(regionColors[activeRegion] || 0x00aaff);
        }
    }, [activeRegion, regionColors]);
    
    useEffect(() => {
        if (linesGroupRef.current) {
            linesGroupRef.current.visible = showLines;
        }
    }, [showLines]);

    const handleToggleRotation = () => setIsRotating(prev => !prev);
    const handleResetView = () => controlsRef.current?.reset();
    const handleGetStartedClick = () => document.getElementById('predictions')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <section className="relative h-screen min-h-[700px] flex flex-col bg-white dark:bg-gradient-to-b dark:from-[#05060a] dark:to-[#071024] text-gray-900 dark:text-white overflow-hidden">
            <div 
                ref={mountRef} 
                className="absolute top-0 left-0 w-full h-full z-0"
            />
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
                            {Object.keys(regionColors).map(track => (
                                <button 
                                    key={track}
                                    onClick={() => setActiveRegion(track)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeRegion === track ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
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
                            <button onClick={() => setShowLines(prev => !prev)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-lg" aria-label="Toggle Connection Lines">
                                {showLines ? '☍' : '☌'}
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
