import React from 'react';
import { Outlet } from 'react-router-dom';
import { ConnectionPanel } from '../ConnectionPanel';

export const MainLayout: React.FC = () => {
    return (
        <div className="main-layout">
            <header>
                <ConnectionPanel />
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};
