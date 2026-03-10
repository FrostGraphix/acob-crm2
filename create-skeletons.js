const fs = require('fs');
const path = require('path');

const pages = [
    'TokenGenerate/CreditTokenPage',
    'TokenGenerate/ClearTamperTokenPage',
    'TokenGenerate/ClearCreditTokenPage',
    'TokenGenerate/SetMaxPowerTokenPage',
    'TokenRecord/CreditTokenRecordPage',
    'TokenRecord/ClearTamperTokenRecordPage',
    'TokenRecord/ClearCreditTokenRecordPage',
    'TokenRecord/SetMaxPowerTokenRecordPage',
    'RemoteOperation/MeterReadingPage',
    'RemoteOperation/MeterControlPage',
    'RemoteOperation/MeterTokenPage',
    'RemoteOperationTask/MeterReadingTaskPage',
    'RemoteOperationTask/MeterControlTaskPage',
    'RemoteOperationTask/MeterTokenTaskPage',
    'DataReport/LongNonpurchasePage',
    'DataReport/LowPurchasePage',
    'DataReport/ConsumptionStatisticsPage',
    'DataReport/IntervalDataPage',
    'Management/StationManagementPage',
    'Management/TariffManagementPage',
    'Management/MeterManagementPage',
    'Management/UserManagementPage',
    'Management/RoleManagementPage'
];

const basePath = path.join(__dirname, 'frontend/src/pages');

pages.forEach(p => {
    const fullPath = path.join(basePath, `${p}.tsx`);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const componentName = p.split('/').pop();
    const content = `import React from 'react';

export function ${componentName}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">${componentName.replace(/([A-Z])/g, ' $1').trim()}</h1>
      <div className="glass p-6 rounded-xl border border-odyssey-border">
        <p className="text-muted-foreground">Work in progress...</p>
      </div>
    </div>
  );
}
`;
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content);
    }
});
console.log('Skeleton pages created.');
