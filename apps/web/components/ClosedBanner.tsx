'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isOpen, nextOpeningMsg } from '@/lib/utils';
import { Button } from './ui/Button';

export function ClosedBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = isOpen();

  useEffect(() => {
    if (!open && !dismissed) setShow(true);
  }, [open, dismissed]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-dark-100 border border-white/8 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-extrabold mb-2">Estamos cerrados</h2>
            <p className="text-white/50 text-sm mb-6">{nextOpeningMsg()}</p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setShow(false); setDismissed(true); }}
            >
              Ver el menú de todas formas
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
