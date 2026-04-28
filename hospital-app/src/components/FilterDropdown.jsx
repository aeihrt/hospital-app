import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import '../styles/components/FilterDropdown.css';

function FilterDropdown({ value, options, onChange, ariaLabel, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const normalizedOptions = options.map((option) => {
        if (typeof option === 'string') {
            return { value: option, label: option };
        }

        return {
            value: option.value,
            label: option.label ?? option.value,
        };
    });

    const selectedOption = normalizedOptions.find((option) => option.value === value) || normalizedOptions[0];
    const selectedLabel = selectedOption?.label || '';

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setIsOpen(false);
    };

    return (
        <div ref={rootRef} className={`filter-dropdown ${className}`.trim()}>
            <button
                type="button"
                className="filter-dropdown-trigger"
                onClick={() => setIsOpen((previous) => !previous)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel || selectedLabel}
            >
                <span className="filter-dropdown-trigger-label">{selectedLabel}</span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="filter-dropdown-menu" role="listbox" aria-label={ariaLabel || selectedLabel}>
                    {normalizedOptions.map((option) => {
                        const isSelected = option.value === selectedOption?.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`filter-dropdown-option${isSelected ? ' filter-dropdown-option-active' : ''}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default FilterDropdown;