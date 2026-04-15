'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const CorrectIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GuessMapProps {
    onGuess: (lat: number, lng: number) => void;
    reveal?: {
        actual: [number, number];
        guessed: [number, number];
    } | null;
    disabled?: boolean;
}

function MapEvents({ onGuess, disabled }: { onGuess: (lat: number, lng: number) => void, disabled?: boolean }) {
    useMapEvents({
        click(e) {
            if (!disabled) {
                onGuess(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

export default function GuessMap({ onGuess, reveal, disabled }: GuessMapProps) {
    const [guess, setGuess] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (!reveal) {
            setGuess(null);
        } else {
            setGuess(reveal.guessed);
        }
    }, [reveal]);

    const handleMapClick = (lat: number, lng: number) => {
        setGuess([lat, lng]);
        onGuess(lat, lng);
    };

    const ethioBounds: L.LatLngBoundsExpression = [
        [3.4, 33.0], // Southwest
        [14.9, 47.9], // Northeast
    ];

    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-zinc-200 relative">
            <MapContainer
                center={[9.145, 40.489673]}
                zoom={6}
                className="w-full h-full"
                maxBounds={ethioBounds}
                minZoom={5}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents onGuess={handleMapClick} disabled={disabled} />

                {guess && (
                    <Marker position={guess} />
                )}

                {reveal && (
                    <>
                        <Marker position={reveal.actual} icon={CorrectIcon}>
                            <Popup>Actual Location</Popup>
                        </Marker>
                        <Polyline
                            positions={[reveal.actual, reveal.guessed]}
                            color="#3b82f6"
                            dashArray="10, 10"
                            weight={3}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}
