try {
    require('./models/Application');
    require('./models/Job');
    require('./controllers/applicationController');
    require('./controllers/companyController');
    require('./controllers/assessmentController');
    require('./controllers/notificationController');
    require('./routes/application');
    require('./routes/company');
    console.log('ALL MODULES OK');
} catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
}
