import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value?: string;
  items: Array<{ value: string; label: string }>;
  registerItem: (item: { value: string; label: string }) => void;
  onValueChange?: (value: string) => void;
  triggerClassName?: string;
  setTriggerClassName: (value?: string) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [items, setItems] = useState<Array<{ value: string; label: string }>>([]);
  const [triggerClassName, setTriggerClassName] = useState<string>();

  const contextValue = useMemo(
    () => ({
      value: value ?? defaultValue,
      onValueChange,
      items,
      registerItem: (item: { value: string; label: string }) =>
        setItems((prev) =>
          prev.some((i) => i.value === item.value) ? prev : [...prev, item],
        ),
      triggerClassName,
      setTriggerClassName,
    }),
    [value, defaultValue, onValueChange, items, triggerClassName],
  );

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>;
}

function useSelectContext() {
  const ctx = useContext<SelectContextValue | undefined>(SelectContext);
  if (!ctx) {
    throw new Error('Select components must be used within <Select>');
  }
  return ctx;
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const { items, value, onValueChange, triggerClassName, setTriggerClassName } =
    useSelectContext();

  useEffect(() => {
    setTriggerClassName(className);
  }, [className, setTriggerClassName]);

  return (
    <div className={cn('relative', className)} {...props}>
      <select
        className={cn(
          'w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500',
          triggerClassName,
        )}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {children ? <div className="sr-only">{children}</div> : null}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
        ▼
      </span>
    </div>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const { registerItem } = useSelectContext();
  useEffect(() => {
    registerItem({ value, label: String(children) });
  }, [value, children, registerItem]);
  return null;
}

export function SelectValue() {
  const { value, items } = useSelectContext();
  const selected = items.find((item) => item.value === value);
  return <span>{selected?.label ?? ''}</span>;
}
