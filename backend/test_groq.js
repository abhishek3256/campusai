const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { generateCompanyDescription } = require('./utils/aiServices');

(async () => {
    try {
        console.log('Testing generateCompanyDescription...');
        const result = await generateCompanyDescription({
            companyName: 'TestCorp',
            industry: 'Technology',
            title: 'Software Engineer'
        });
        console.log('Success:', result);
    } catch (e) {
        console.error('Error occurred:');
        console.error(e);
        if (e.response) {
            console.error(e.response.data);
        }
    }
})();
