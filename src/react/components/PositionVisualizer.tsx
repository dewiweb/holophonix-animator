import React, { useEffect, useRef } from 'react';
import { Position } from '../../bindings';
import './PositionVisualizer.css';

interface PositionVisualizerProps {
    position?: Position;
}

export const PositionVisualizer: React.FC<PositionVisualizerProps> = ({ position }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDraggingRef = useRef(false);
    const size = 300;

    const drawGrid = (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = '#394b59';
        ctx.lineWidth = 1;

        // Draw grid lines
        for (let i = 0; i <= size; i += size / 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#48aff0';
        ctx.lineWidth = 2;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.stroke();
    };

    const drawPosition = (ctx: CanvasRenderingContext2D, pos: Position) => {
        const x = (pos.x + 1) * size / 2;
        const y = (1 - pos.y) * size / 2;
        
        // Draw position marker
        ctx.fillStyle = '#ffb366';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw z-axis indicator (size of circle)
        ctx.strokeStyle = '#ffb366';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6 + (pos.z + 1) * 6, 0, Math.PI * 2);
        ctx.stroke();

        // Draw coordinates text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`x: ${pos.x.toFixed(2)}`, 10, 10);
        ctx.fillText(`y: ${pos.y.toFixed(2)}`, 10, 25);
        ctx.fillText(`z: ${pos.z.toFixed(2)}`, 10, 40);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw grid
        drawGrid(ctx);

        // Draw position if available
        if (position) {
            drawPosition(ctx, position);
        }
    }, [position]);

    return (
        <div className="position-visualizer">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="position-canvas"
            />
        </div>
    );
};
