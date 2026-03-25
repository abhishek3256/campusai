import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, title, value, subtitle, onClick, iconColor, bgColor }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-xl ${bgColor || ''}`}
        >
            <div className="flex items-center justify-between">
                <div className={`p-4 rounded-lg ${iconColor || 'bg-blue-500/10'}`}>
                    <Icon className={`w-8 h-8 ${iconColor?.includes('blue') ? 'text-blue-500' :
                            iconColor?.includes('green') ? 'text-green-500' :
                                'text-purple-500'
                        }`} />
                </div>
                <div className="text-right">
                    <h3 className="text-4xl font-bold text-heading mb-1">{value}</h3>
                </div>
            </div>

            <div className="mt-4">
                <h4 className="text-heading font-semibold text-lg">{title}</h4>
                <p className="text-muted text-sm">{subtitle}</p>
            </div>

            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                <span>View Details</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </motion.div>
    );
};

export default StatCard;
