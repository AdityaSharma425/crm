const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const segmentRoutes = require('./routes/segments');
const campaignRoutes = require('./routes/campaigns');
const dashboardRoutes = require('./routes/dashboard');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes); 