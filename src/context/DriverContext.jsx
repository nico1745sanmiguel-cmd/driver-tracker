import { createContext, useContext } from 'react';
import { useDriverData } from '../hooks/useDriverData';

const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
    const data = useDriverData();
    return (
        <DriverContext.Provider value={data}>
            {children}
        </DriverContext.Provider>
    );
};

export const useDriver = () => {
    const context = useContext(DriverContext);
    if (!context) {
        throw new Error('useDriver must be used within a DriverProvider');
    }
    return context;
};
