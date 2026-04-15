'use client';

import { useEffect, useRef } from 'react';
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';

interface MapillaryViewerProps {
    imageId: string;
}

export default function MapillaryViewer({ imageId }: MapillaryViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Mapillary requires a client token. 
        // For the viewer, we can use a public token or the user's token.
        // I'll use a placeholder, but the user should ideally provide one.
        const token = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN;
        if (!token) {
            console.error('Missing NEXT_PUBLIC_MAPILLARY_TOKEN in .env.local');
            return;
        }

        const mly = new Viewer({
            accessToken: token,
            container: containerRef.current,
            imageId: imageId,
        });

        viewerRef.current = mly;

        return () => {
            if (viewerRef.current) {
                viewerRef.current.remove();
            }
        };
    }, [imageId]);

    return (
        <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-zinc-200" />
    );
}
