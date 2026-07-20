import { motion } from 'framer-motion'

/**
 * Envuelve cualquier vista con animación de entrada/salida.
 * Compatible con AnimatePresence de React Router.
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
