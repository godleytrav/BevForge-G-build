import { createContext, useContext } from 'react';
import type { CanvasMode } from './types';

export interface CanvasRuntimeContextValue {
  mode: CanvasMode;
  onConfigure: (nodeId: string) => void;
  onControl: (
    nodeId: string,
    action: string,
    value: string | number | boolean
  ) => void;
}

const noopConfigure = () => {};
const noopControl = () => {};

const CanvasRuntimeContext = createContext<CanvasRuntimeContextValue>({
  mode: 'draft',
  onConfigure: noopConfigure,
  onControl: noopControl,
});

export const CanvasRuntimeProvider = CanvasRuntimeContext.Provider;

export const useCanvasRuntime = (): CanvasRuntimeContextValue =>
  useContext(CanvasRuntimeContext);

