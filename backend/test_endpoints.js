import admin from './api/admin.js';
import express from 'express';

const app = express();
app.use('/api/admin', admin);

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`Test server listening on port ${PORT}`);
  
  // Test endpoints
  setTimeout(async () => {
    try {
      // Test models endpoint
      const modelsRes = await fetch(`http://localhost:${PORT}/api/admin/models`);
      const models = await modelsRes.json();
      console.log('\n=== Models Endpoint ===');
      console.log(JSON.stringify(models, null, 2));
      
      // Test training history endpoint
      const historyRes = await fetch(`http://localhost:${PORT}/api/admin/monitoring/training-history`);
      const history = await historyRes.json();
      console.log('\n=== Training History Endpoint ===');
      console.log(JSON.stringify(history, null, 2));
      
      // Test resources endpoint
      const resourcesRes = await fetch(`http://localhost:${PORT}/api/admin/monitoring/resources`);
      const resources = await resourcesRes.json();
      console.log('\n=== Resources Endpoint ===');
      console.log(JSON.stringify(resources, null, 2));
      
      server.close();
      process.exit(0);
    } catch (error) {
      console.error('Test failed:', error);
      server.close();
      process.exit(1);
    }
  }, 100);
});
