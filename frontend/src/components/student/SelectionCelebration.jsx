import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, CheckCircle, Star, Sparkles } from 'lucide-react';

// Simple confetti component
const Confetti = ({ active }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!active) return;
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
        const newParticles = Array.from({ length: 70 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 1.5,
            rotation: Math.random() * 360
        }));
        setParticles(newParticles);
    }, [active]);

    if (!active || particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                    animate={{ y: '110vh', opacity: 0, rotate: p.rotation }}
                    transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
                    className="absolute"
                    style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        top: 0
                    }}
                />
            ))}
        </div>
    );
};

export default function SelectionCelebration({ isOpen, onClose, application }) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const company = application?.companyId?.companyName || 'the company';
    const job = application?.jobId?.title || 'the position';
    const offerContent = application?.offerLetter?.aiGeneratedContent ||
        application?.pipelineProgress?.stageResults?.find(s => s.stageName === 'Offer Letter')?.generatedLetter?.letterContent;

    const nextSteps = [
        '🎉 Accept your offer letter',
        '📋 Complete document verification',
        '📝 Receive your joining letter',
        '🏢 Report on your joining date',
        '💼 Begin your new career journey!'
    ];

    return (
        <>
            <Confetti active={showConfetti} />
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white rounded-3xl shadow-2xl max-w-lg w-full p-8 overflow-hidden"
                    >
                        {/* Background glow */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10">
                            {/* Emoji celebration */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.3, 1] }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-center mb-6"
                            >
                                <div className="text-7xl mb-2">🎉</div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center justify-center gap-1"
                                >
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                        >
                                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Title */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-center mb-6"
                            >
                                <h2 className="text-3xl font-bold mb-2">Congratulations! 🎊</h2>
                                <p className="text-white/80 text-lg">
                                    You have been <span className="text-green-400 font-bold">selected</span> for
                                </p>
                                <p className="text-xl font-semibold text-yellow-300 mt-1">
                                    {job}
                                </p>
                                <p className="text-white/70 mt-1">at <span className="font-semibold text-white">{company}</span></p>
                            </motion.div>

                            {/* Next steps */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6"
                            >
                                <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-yellow-400" /> Your Next Steps
                                </p>
                                <ul className="space-y-2">
                                    {nextSteps.map((step, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.7 + i * 0.1 }}
                                            className="text-sm text-white/90 flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                            {step}
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Offer letter download */}
                            {offerContent && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                    className="mb-4"
                                >
                                    <button
                                        onClick={() => {
                                            const win = window.open('', '_blank');
                                            win.document.write(`<pre style="font-family:Georgia,serif;padding:40px;max-width:800px;margin:auto;line-height:1.8;font-size:14px">${offerContent}</pre>`);
                                            win.document.title = 'Offer Letter';
                                        }}
                                        className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" /> View Offer Letter
                                    </button>
                                </motion.div>
                            )}

                            {/* Close button */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                onClick={onClose}
                                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-bold transition-all shadow-lg"
                            >
                                View My Journey 🚀
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        </>
    );
}
