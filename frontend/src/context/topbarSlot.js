import { createContext, useContext } from 'react';

// DOM node inside the app top bar that a page can portal its own header into.
export const TopbarSlotContext = createContext(null);
export const useTopbarSlot = () => useContext(TopbarSlotContext);