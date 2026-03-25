// Using DiceBear API for consistent, high-quality avatars
// These are deterministic - same seed always generates same avatar

const male = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=George',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Logan',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=William',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
];

const female = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Abigail',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Scarlett',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Victoria',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna'
];

const company = [
    'https://api.dicebear.com/7.x/initials/svg?seed=TechCorp&backgroundColor=3b82f6',
    'https://api.dicebear.com/7.x/initials/svg?seed=InnovateLabs&backgroundColor=8b5cf6',
    'https://api.dicebear.com/7.x/initials/svg?seed=DataSystems&backgroundColor=06b6d4',
    'https://api.dicebear.com/7.x/initials/svg?seed=CloudWorks&backgroundColor=10b981',
    'https://api.dicebear.com/7.x/initials/svg?seed=DevStudio&backgroundColor=f59e0b',
    'https://api.dicebear.com/7.x/initials/svg?seed=CodeFactory&backgroundColor=ef4444',
    'https://api.dicebear.com/7.x/initials/svg?seed=ByteForge&backgroundColor=ec4899',
    'https://api.dicebear.com/7.x/initials/svg?seed=LogicHub&backgroundColor=6366f1',
    'https://api.dicebear.com/7.x/initials/svg?seed=AppNest&backgroundColor=14b8a6',
    'https://api.dicebear.com/7.x/initials/svg?seed=WebCraft&backgroundColor=f97316',
    'https://api.dicebear.com/7.x/initials/svg?seed=PixelPro&backgroundColor=a855f7',
    'https://api.dicebear.com/7.x/initials/svg?seed=NetSphere&backgroundColor=0ea5e9',
    'https://api.dicebear.com/7.x/initials/svg?seed=CoreTech&backgroundColor=22c55e',
    'https://api.dicebear.com/7.x/initials/svg?seed=SmartSoft&backgroundColor=eab308',
    'https://api.dicebear.com/7.x/initials/svg?seed=DigiFlow&backgroundColor=dc2626',
    'https://api.dicebear.com/7.x/initials/svg?seed=AlphaCode&backgroundColor=db2777',
    'https://api.dicebear.com/7.x/initials/svg?seed=BetaLabs&backgroundColor=4f46e5',
    'https://api.dicebear.com/7.x/initials/svg?seed=GammaWorks&backgroundColor=059669',
    'https://api.dicebear.com/7.x/initials/svg?seed=DeltaSys&backgroundColor=ea580c',
    'https://api.dicebear.com/7.x/initials/svg?seed=OmegaTech&backgroundColor=9333ea'
];

module.exports = { male, female, company };
