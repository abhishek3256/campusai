import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, ChevronRight, ChevronLeft, RotateCcw, CheckCircle, Briefcase, Zap, Filter } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const InterviewPrepPage = () => {
    const [preps, setPreps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedPrep, setSelectedPrep] = useState(null);
    const [flashcardMode, setFlashcardMode] = useState(false);
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ jobTitle: '', companyName: '', jobDescription: '' });
    const [filter, setFilter] = useState('All');

    useEffect(() => { fetchPreps(); }, []);

    const fetchPreps = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/interview-prep');
            setPreps(res.data.data || []);
        } catch (err) { toast.error('Failed to load prep sessions'); }
        finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        if (!form.jobTitle) return toast.error('Enter a job title');
        try {
            setGenerating(true);
            const res = await api.post('/student/interview-prep/generate', form);
            setPreps(prev => [res.data.data, ...prev]);
            setShowForm(false);
            setForm({ jobTitle: '', companyName: '', jobDescription: '' });
            toast.success('Interview prep generated!');
            setSelectedPrep(res.data.data);
        } catch (err) { toast.error('Failed to generate prep'); }
        finally { setGenerating(false); }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/student/interview-prep/${id}`);
            setPreps(prev => prev.filter(p => p._id !== id));
            if (selectedPrep?._id === id) setSelectedPrep(null);
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const toggleComplete = async (prep) => {
        try {
            const res = await api.put(`/student/interview-prep/${prep._id}`, { isCompleted: !prep.isCompleted });
            setPreps(prev => prev.map(p => p._id === prep._id ? res.data.data : p));
            setSelectedPrep(res.data.data);
        } catch { toast.error('Failed to update'); }
    };

    const difficultyColor = { easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    
    const filteredCards = selectedPrep?.flashcards?.filter(c => filter === 'All' || c.category === filter) || [];
    const categories = ['All', ...new Set(selectedPrep?.flashcards?.map(c => c.category) || [])];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            Interview Prep
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">AI-generated flashcards for your next interview</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                        <Plus className="w-5 h-5" /> Generate New
                    </button>
                </div>

                {/* Generate Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500" /> Generate Interview Prep</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
                                        <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} placeholder="e.g. Software Engineer, Data Analyst" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                        <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="e.g. Google, TCS" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description (optional)</label>
                                        <textarea value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})} rows={3} placeholder="Paste the job description for more targeted questions..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={handleGenerate} disabled={generating} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                                        {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Zap className="w-4 h-4" /> Generate</>}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Prep Sessions List */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Saved Sessions ({preps.length})</h2>
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : preps.length === 0 ? (
                            <div className="text-center py-12 text-gray-400"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No prep sessions yet</p></div>
                        ) : preps.map(prep => (
                            <motion.div key={prep._id} onClick={() => { setSelectedPrep(prep); setFlashcardMode(false); setCurrentCard(0); setFlipped(false); }} whileHover={{ scale: 1.01 }}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedPrep?._id === prep._id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{prep.jobTitle}</p>
                                        {prep.companyName && <p className="text-sm text-gray-500 dark:text-gray-400">{prep.companyName}</p>}
                                        <p className="text-xs text-gray-400 mt-1">{prep.flashcards?.length || 0} cards • {new Date(prep.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        {prep.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        <button onClick={(e) => handleDelete(prep._id, e)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Flashcard Viewer */}
                    <div className="lg:col-span-2">
                        {!selectedPrep ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-16 text-center">
                                <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Prep Session</h3>
                                <p className="text-gray-500 dark:text-gray-400">Click on a session from the left, or generate a new one</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPrep.jobTitle}</h2>
                                        {selectedPrep.companyName && <p className="text-gray-500">{selectedPrep.companyName}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleComplete(selectedPrep)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedPrep.isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            <CheckCircle className="w-4 h-4" /> {selectedPrep.isCompleted ? 'Completed' : 'Mark Done'}
                                        </button>
                                        <button onClick={() => { setFlashcardMode(!flashcardMode); setCurrentCard(0); setFlipped(false); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                                            {flashcardMode ? 'List View' : '🃏 Flashcard Mode'}
                                        </button>
                                    </div>
                                </div>

                                {flashcardMode ? (
                                    <div className="p-8">
                                        {/* Category Filter */}
                                        <div className="flex gap-2 mb-6 flex-wrap">
                                            {categories.map(cat => (
                                                <button key={cat} onClick={() => { setFilter(cat); setCurrentCard(0); setFlipped(false); }}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                        {filteredCards.length > 0 ? (
                                            <>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{currentCard + 1} / {filteredCards.length}</div>
                                                <motion.div onClick={() => setFlipped(!flipped)} className="cursor-pointer" whileHover={{ scale: 1.01 }}>
                                                    <div className="relative min-h-48 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                        <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor[filteredCards[currentCard]?.difficulty] || ''}`}>{filteredCards[currentCard]?.difficulty}</span>
                                                        <span className="absolute top-4 left-4 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">{filteredCards[currentCard]?.category}</span>
                                                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3">{flipped ? '💡 Answer' : '❓ Question'}</p>
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{flipped ? filteredCards[currentCard]?.answer : filteredCards[currentCard]?.question}</p>
                                                        {!flipped && <p className="text-sm text-gray-400 mt-4">Click to reveal answer</p>}
                                                    </div>
                                                </motion.div>
                                                <div className="flex items-center justify-between mt-6">
                                                    <button disabled={currentCard === 0} onClick={() => { setCurrentCard(c => c - 1); setFlipped(false); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                        <ChevronLeft className="w-5 h-5" /> Prev
                                                    </button>
                                                    <button onClick={() => { setCurrentCard(0); setFlipped(false); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500"><RotateCcw className="w-5 h-5" /></button>
                                                    <button disabled={currentCard === filteredCards.length - 1} onClick={() => { setCurrentCard(c => c + 1); setFlipped(false); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                        Next <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : <p className="text-center text-gray-400 py-8">No cards in this category</p>}
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                                        {selectedPrep.flashcards?.map((card, idx) => (
                                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{card.category}</span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[card.difficulty]}`}>{card.difficulty}</span>
                                                </div>
                                                <p className="font-medium text-gray-900 dark:text-white mb-2">Q: {card.question}</p>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm">A: {card.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPrepPage;
