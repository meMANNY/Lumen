'use client';

import ReactSelect from 'react-select'

interface SelectProps {
  label: string;
  value?: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  options: Record<string, any>[];
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  disabled,
}) => {
  return ( 
    <div className="z-[100]">
      <label
        className="block font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400"
      >
        {label}
      </label>
      <div className="mt-2">
      <ReactSelect
        isDisabled={disabled}
        value={value}
        onChange={onChange}
        isMulti
        options={options}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderColor: state.isFocused ? 'rgba(196,181,253,0.4)' : 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            minHeight: '44px',
            boxShadow: 'none',
            ':hover': { borderColor: 'rgba(196,181,253,0.4)' },
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: '#191c2a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: '#e2e8f0',
            cursor: 'pointer',
            ':active': { backgroundColor: 'rgba(255,255,255,0.1)' },
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }),
          multiValueLabel: (base) => ({ ...base, color: '#e2e8f0' }),
          multiValueRemove: (base) => ({
            ...base,
            color: '#94a3b8',
            ':hover': { backgroundColor: 'rgba(244,63,94,0.25)', color: '#fda4af' },
          }),
          input: (base) => ({ ...base, color: '#f1f5f9' }),
          placeholder: (base) => ({ ...base, color: '#64748b' }),
          noOptionsMessage: (base) => ({ ...base, color: '#64748b' }),
          dropdownIndicator: (base) => ({ ...base, color: '#64748b', ':hover': { color: '#e2e8f0' } }),
          clearIndicator: (base) => ({ ...base, color: '#64748b', ':hover': { color: '#e2e8f0' } }),
          indicatorSeparator: (base) => ({ ...base, backgroundColor: 'rgba(255,255,255,0.1)' }),
        }}
        classNames={{
          control: () => 'text-sm',
        }}
      />
      </div>
    </div>
   );
}
 
export default Select;