import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

// Token Generate
import { CreditTokenPage } from './pages/TokenGenerate/CreditTokenPage';
import { ClearTamperTokenPage } from './pages/TokenGenerate/ClearTamperTokenPage';
import { ClearCreditTokenPage } from './pages/TokenGenerate/ClearCreditTokenPage';
import { SetMaxPowerTokenPage } from './pages/TokenGenerate/SetMaxPowerTokenPage';

// Token Record
import { CreditTokenRecordPage } from './pages/TokenRecord/CreditTokenRecordPage';
import { ClearTamperTokenRecordPage } from './pages/TokenRecord/ClearTamperTokenRecordPage';
import { ClearCreditTokenRecordPage } from './pages/TokenRecord/ClearCreditTokenRecordPage';
import { SetMaxPowerTokenRecordPage } from './pages/TokenRecord/SetMaxPowerTokenRecordPage';

// Remote Operation
import { MeterReadingPage } from './pages/RemoteOperation/MeterReadingPage';
import { MeterControlPage } from './pages/RemoteOperation/MeterControlPage';
import { MeterTokenPage } from './pages/RemoteOperation/MeterTokenPage';

// Remote Operation Task
import { MeterReadingTaskPage } from './pages/RemoteOperationTask/MeterReadingTaskPage';
import { MeterControlTaskPage } from './pages/RemoteOperationTask/MeterControlTaskPage';
import { MeterTokenTaskPage } from './pages/RemoteOperationTask/MeterTokenTaskPage';

// Data Report
import { LongNonpurchasePage } from './pages/DataReport/LongNonpurchasePage';
import { LowPurchasePage } from './pages/DataReport/LowPurchasePage';
import { ConsumptionStatisticsPage } from './pages/DataReport/ConsumptionStatisticsPage';
import { IntervalDataPage } from './pages/DataReport/IntervalDataPage';

// Management
import { StationManagementPage } from './pages/Management/StationManagementPage';
import { TariffManagementPage } from './pages/Management/TariffManagementPage';
import { MeterManagementPage } from './pages/Management/MeterManagementPage';
import { CustomerManagementPage } from './pages/Management/CustomerManagementPage';

import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public - Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected - App shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NotificationProvider>
                    <Layout />
                  </NotificationProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Token Generate */}
              <Route path="token-generate/credit" element={<CreditTokenPage />} />
              <Route path="token-generate/clear-tamper" element={<ClearTamperTokenPage />} />
              <Route path="token-generate/clear-credit" element={<ClearCreditTokenPage />} />
              <Route path="token-generate/max-power" element={<SetMaxPowerTokenPage />} />

              {/* Token Record */}
              <Route path="token-record/credit" element={<CreditTokenRecordPage />} />
              <Route path="token-record/clear-tamper" element={<ClearTamperTokenRecordPage />} />
              <Route path="token-record/clear-credit" element={<ClearCreditTokenRecordPage />} />
              <Route path="token-record/max-power" element={<SetMaxPowerTokenRecordPage />} />

              {/* Remote Operation */}
              <Route path="remote-operation/reading" element={<MeterReadingPage />} />
              <Route path="remote-operation/control" element={<MeterControlPage />} />
              <Route path="remote-operation/token" element={<MeterTokenPage />} />

              {/* Remote Operation Task */}
              <Route path="remote-operation-task/reading" element={<MeterReadingTaskPage />} />
              <Route path="remote-operation-task/control" element={<MeterControlTaskPage />} />
              <Route path="remote-operation-task/token" element={<MeterTokenTaskPage />} />

              {/* Data Report */}
              <Route path="data-report/account-long" element={<LongNonpurchasePage />} />
              <Route path="data-report/account-low" element={<LowPurchasePage />} />
              <Route path="data-report/consumption" element={<ConsumptionStatisticsPage />} />
              <Route path="data-report/meter-data" element={<IntervalDataPage />} />

              {/* Management */}
              <Route path="management/gateway" element={<StationManagementPage />} />
              <Route path="management/customer" element={<CustomerManagementPage />} />
              <Route path="management/tariff" element={<TariffManagementPage />} />
              <Route path="management/account" element={<MeterManagementPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
