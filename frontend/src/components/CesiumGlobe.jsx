import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CesiumGlobe = ({ markers = [], onMarkerClick, flyTo }) => {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initCesium = async () => {
      try {
        const Cesium = await import('cesium');
        
        const token = process.env.REACT_APP_CESIUM_ION_TOKEN;
        if (token) {
          Cesium.Ion.defaultAccessToken = token;
        }

        window.CESIUM_BASE_URL = '/cesium/';

        if (!isMounted || !cesiumContainerRef.current) return;

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
            webgl: { alpha: true },
          },
          requestRenderMode: false,
          maximumRenderTimeChange: Infinity,
        });

        // Force resize to fill container
        viewer.canvas.style.width = '100%';
        viewer.canvas.style.height = '100%';
        viewer.canvas.style.position = 'absolute';
        viewer.canvas.style.top = '0';
        viewer.canvas.style.left = '0';
        
        viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1628');
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.showGroundAtmosphere = true;

        // Focus on Netherlands / Afsluitdijk
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(5.2, 52.8, 400000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
        });

        // Add markers
        markers.forEach((marker) => {
          const color = marker.status === 'critical' ? '#ef4444' :
                       marker.status === 'warning' ? '#eab308' :
                       marker.status === 'maintenance' ? '#a855f7' : '#22c55e';
          
          viewer.entities.add({
            id: marker.asset_id,
            name: marker.name,
            position: Cesium.Cartesian3.fromDegrees(marker.longitude, marker.latitude, 0),
            point: {
              pixelSize: 14,
              color: Cesium.Color.fromCssColorString(color),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
            },
            label: {
              text: marker.name,
              font: '13px Public Sans',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 500000),
            },
          });
        });

        // Click handler
        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const pickedObject = viewer.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id) {
            onMarkerClick?.(pickedObject.id.id);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        viewerRef.current = viewer;
        setIsLoading(false);

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
  }, [markers, onMarkerClick]);

  // Fly to asset
  useEffect(() => {
    if (flyTo && viewerRef.current) {
      import('cesium').then((Cesium) => {
        viewerRef.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(flyTo.longitude, flyTo.latitude, 50000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 2,
        });
      });
    }
  }, [flyTo]);

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
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        data-testid="cesium-container"
      />
    </>
  );
};

export default CesiumGlobe;
