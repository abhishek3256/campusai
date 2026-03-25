import { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Toggle = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
            {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
        <button onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

const NumField = ({ label, value, onChange, unit }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>
        <div className="flex items-center justify-end gap-2 w-36">
            <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center outline-none" />
            {unit ? <span className="text-xs text-gray-400 w-8">{unit}</span> : <span className="w-8" />}
        </div>
    </div>
);

export default function AdminSystemPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/admin/settings').then(r => setSettings(r.data.data)).catch(() => toast.error('Could not load settings')).finally(() => setLoading(false));
    }, []);

    const set = (section, key, val) => setSettings(s => ({ ...s, [section]: { ...s[section], [key]: val } }));

    const save = async () => {
        setSaving(true);
        try {
            await api.put('/admin/settings', settings);
            toast.success('Settings saved!');
        } catch { toast.error('Save failed'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!settings) return null;

    return (
        <div className="space-y-5 max-w-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Platform-wide configuration</p>
                </div>
                <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>

            {/* General */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">General</h3>
                <Toggle label="Maintenance Mode" desc="Block all users except admins" checked={settings.general?.maintenanceMode} onChange={v => set('general', 'maintenanceMode', v)} />
                <Toggle label="Allow Registration" desc="New users can sign up" checked={settings.general?.allowRegistration} onChange={v => set('general', 'allowRegistration', v)} />
                <div className="pt-3">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">Support Email</label>
                    <input value={settings.general?.supportEmail || ''} onChange={e => set('general', 'supportEmail', e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none text-gray-900 dark:text-white" />
                </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Feature Toggles</h3>
                <Toggle label="AI Features" desc="Career roadmap, interview prep, etc." checked={settings.features?.enableAIFeatures} onChange={v => set('features', 'enableAIFeatures', v)} />
                <Toggle label="Resume Verification" desc="Document upload and AI extraction" checked={settings.features?.enableResumeVerification} onChange={v => set('features', 'enableResumeVerification', v)} />
                <Toggle label="Job Recommendations" desc="AI-powered job matching" checked={settings.features?.enableJobRecommendations} onChange={v => set('features', 'enableJobRecommendations', v)} />
                <Toggle label="Interview Prep" desc="Mock interviews and feedback" checked={settings.features?.enableInterviewPrep} onChange={v => set('features', 'enableInterviewPrep', v)} />
                <Toggle label="Exam Module" desc="Online proctored exams" checked={settings.features?.enableExamModule} onChange={v => set('features', 'enableExamModule', v)} />
            </div>

            {/* Limits */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Limits</h3>
                <NumField label="Max Resume File Size" value={settings.limits?.maxResumeSize} onChange={v => set('limits', 'maxResumeSize', v)} unit="MB" />
                <NumField label="Max Applications per Student" value={settings.limits?.maxApplicationsPerStudent} onChange={v => set('limits', 'maxApplicationsPerStudent', v)} />
                <NumField label="Max Jobs per Company" value={settings.limits?.maxJobsPerCompany} onChange={v => set('limits', 'maxJobsPerCompany', v)} />
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Email Notifications</h3>
                <Toggle label="On New Registration" checked={settings.notifications?.emailOnNewRegistration} onChange={v => set('notifications', 'emailOnNewRegistration', v)} />
                <Toggle label="On Job Posted" checked={settings.notifications?.emailOnJobPosted} onChange={v => set('notifications', 'emailOnJobPosted', v)} />
                <Toggle label="On Application Received" checked={settings.notifications?.emailOnApplicationReceived} onChange={v => set('notifications', 'emailOnApplicationReceived', v)} />
            </div>
        </div>
    );
}
