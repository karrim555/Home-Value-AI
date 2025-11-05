import React, { useEffect } from 'react';
import { FeedItem } from '../types';
import { CloseIcon } from './Icons';

interface ModalProps {
    item: FeedItem;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ item, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <button 
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-[110]"
                onClick={onClose}
                aria-label="Close"
            >
                <CloseIcon className="w-8 h-8" />
            </button>
            <div 
                className="max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={e => e.stopPropagation()} // Prevent click inside from closing
            >
                {item.type === 'image' && (
                    <img 
                        src={item.contentUrl} 
                        alt={item.prompt} 
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                )}
                {item.type === 'video' && (
                    <video 
                        src={item.contentUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                )}
            </div>
        </div>
    );
};

export default Modal;
