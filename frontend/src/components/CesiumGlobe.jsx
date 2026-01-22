import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const CesiumGlobe = () => {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initCesium = async () => {
      try {
        // Dynamically import Cesium
        const Cesium = await import('cesium');
        
        // Set the access token
        const token = process.env.REACT_APP_CESIUM_ION_TOKEN;
        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

        // Set base URL for Cesium assets
        window.CESIUM_BASE_URL = '/cesium/';

        if (!isMounted || !cesiumContainerRef.current) return;

        // Create viewer with minimal UI
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          navigationInstructionsInitiallyVisible: false,
          scene3DOnly: true,
          skyBox: false,
          skyAtmosphere: new Cesium.SkyAtmosphere(),
          contextOptions: {
            webgl: {
              alpha: true,
            },
          },
        });

        // Make background transparent
        viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1628');

        // Enable atmosphere and lighting
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.showGroundAtmosphere = true;

        // Set initial camera position - Focus on Netherlands
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(5.2913, 52.1326, 800000), // Netherlands coordinates
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
        });

        // Add some sample entities for visualization
        // Rotterdam port area marker
        viewer.entities.add({
          name: 'Rotterdam Port',
          position: Cesium.Cartesian3.fromDegrees(4.4777, 51.9244, 0),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#0ea5e9'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
          label: {
            text: 'Rotterdam Port',
            font: '14px Public Sans',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
          },
        });

        // Maeslantkering (storm surge barrier)
        viewer.entities.add({
          name: 'Maeslantkering',
          position: Cesium.Cartesian3.fromDegrees(4.0539, 51.9547, 0),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#eab308'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
          label: {
            text: 'Maeslantkering',
            font: '14px Public Sans',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
          },
        });

        // Afsluitdijk
        viewer.entities.add({
          name: 'Afsluitdijk',
          position: Cesium.Cartesian3.fromDegrees(5.2536, 52.9583, 0),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#22c55e'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
          label: {
            text: 'Afsluitdijk',
            font: '14px Public Sans',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
          },
        });

        // Slow rotation animation
        const startTime = Date.now();
        const rotateGlobe = () => {
          if (!viewerRef.current || !isMounted) return;
          
          const elapsed = (Date.now() - startTime) / 1000;
          const heading = Cesium.Math.toRadians(elapsed * 2); // 2 degrees per second
          
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(5.2913 + elapsed * 0.5, 52.1326, 800000),
            orientation: {
              heading: heading,
              pitch: Cesium.Math.toRadians(-45),
              roll: 0,
            },
          });
        };

        viewerRef.current = viewer;
        setIsLoading(false);

        // Optional: Enable slow rotation (commented out to allow user interaction)
        // setInterval(rotateGlobe, 100);

      } catch (err) {
        console.error('Failed to initialize Cesium:', err);
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    initCesium();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
        <div className="text-center p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground font-mono text-sm">3D Globe Unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
              Initializing Globe...
            </p>
          </div>
        </div>
      )}
      <div 
        ref={cesiumContainerRef} 
        className="absolute inset-0"
        data-testid="cesium-container"
      />
    </>
  );
};

export default CesiumGlobe;
