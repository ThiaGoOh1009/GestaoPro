import React from 'react';

export const StatusBadge = ({ status }) => (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block ${status === 'Ativo' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{status}</span>
);

export const ClientTableSkeleton = () => (
    <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-6 border-b border-gray-700/50">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="flex-1 ml-4 space-y-2"><div className="h-4 bg-gray-700 rounded w-3/4"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></div>
                <div className="h-4 bg-gray-700 rounded w-1/4 hidden md:block"></div>
                <div className="h-4 bg-gray-700 rounded w-24 hidden sm:block mx-6"></div>
                <div className="w-20 flex items-center justify-end space-x-3"><div className="w-5 h-5 bg-gray-700 rounded"></div><div className="w-5 h-5 bg-gray-700 rounded"></div></div>
            </div>
        ))}
    </div>
);

export const InputField = ({ label, id, name, required = false, ...props }) => {
    const isNumeric = props.type === 'number' || props.inputMode === 'numeric' || props.inputMode === 'decimal';
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Only select text on non-touch devices to avoid the "copy/paste" menu on mobile.
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isNumeric && !isTouchDevice) {
            e.target.select();
        }
    };
    
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input 
                id={id}
                name={name}
                required={required}
                onFocus={handleFocus}
                {...props} 
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition disabled:opacity-50" 
            />
        </div>
    );
};

export const Switch = ({ label, enabled, onChange, name }) => (
    <label className="flex items-center justify-between cursor-pointer bg-gray-700/60 p-4 rounded-lg hover:bg-gray-700 transition-colors">
        <span className="font-medium text-white">{label}</span>
        <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </div>
        <input type="checkbox" name={name} className="hidden" checked={enabled} onChange={onChange} />
    </label>
);