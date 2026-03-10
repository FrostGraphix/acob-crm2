
import { getDashboardData } from './src/services/dashboard-service';

async function verifyDashboardCorrect() {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    console.log('--- Dashboard Verification (Corrected) ---');
    try {
        const data = await getDashboardData(from, to, 'UMAISHA');
        console.log('✅ Dashboard Data Aggregated Successfully!');
        console.log('   Portfolio Revenue:', data.portfolioRevenue);
        console.log('   Portfolio Energy (kWh):', data.portfolioEnergyKwh);
        console.log('   Site Count:', data.sites.length);

        console.log('\n--- EMS Enhancements (Umaisha) ---');
        console.log('   Site Capacity:', data.selectedSiteMetadata?.pvCapacityKw, 'kWp');
        console.log('   Weather:', data.selectedSiteMetadata?.weather.condition, `${data.selectedSiteMetadata?.weather.temp}°C`);
        console.log('   Flow (PV -> Load):', data.flow?.inverterToLoadKw, 'kW');
        console.log('   Generation (PV Yield):', data.generation?.pvYield, 'kWh');
        console.log('   Hourly Profile points:', data.hourlyGeneration?.length);
    } catch (err: any) {
        console.error('❌ Dashboard Aggregation FAILED');
        console.error('   Message:', err.message);
    }
}

verifyDashboardCorrect();
