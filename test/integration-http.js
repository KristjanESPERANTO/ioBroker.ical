const path = require('path');
const { tests } = require('@iobroker/testing');

// Use a public, stable calendar for testing
const PUBLIC_TEST_CALENDAR = 'https://calendar.google.com/calendar/ical/en.german%23holiday%40group.v.calendar.google.com/public/basic.ics';

tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('HTTP Calendar Fetching with fetch API', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should successfully fetch calendar via HTTP using built-in fetch API', async function () {
                this.timeout(50000);
                
                console.log('Step 1: Fetching adapter object...');
                const obj = await harness.objects.getObjectAsync('system.adapter.ical.0');
                
                if (!obj) {
                    throw new Error('Adapter object not found');
                }
                console.log('Step 2: Adapter object loaded');

                console.log('Step 3: Configuring adapter with HTTP calendar URL...');
                
                Object.assign(obj.native, {
                    daysPreview: 30,
                    daysPast: 7,
                    calendars: [{
                        name: 'Google-Calendar-HTTP-Test',
                        url: PUBLIC_TEST_CALENDAR
                    }],
                    events: []
                });

                await harness.objects.setObjectAsync(obj._id, obj);
                console.log('Step 4: Configuration set with HTTP calendar URL');

                console.log('Step 5: Starting adapter...');
                await harness.startAdapterAndWait();
                console.log('Step 6: Adapter started');

                // Wait for calendar fetch and processing
                console.log('Waiting 8 seconds for HTTP fetch and processing...');
                await new Promise((res) => setTimeout(res, 8000));

                console.log('Step 7: Checking states...');
                const stateIds = await harness.dbConnection.getStateIDs('ical.0.*');
                console.log(`Found ${stateIds.length} states`);

                // Verify data states exist (proves HTTP fetch worked)
                const dataStates = stateIds.filter(id => id.includes('data.'));
                console.log(`Found ${dataStates.length} data states:`, dataStates);
                
                // Force kill adapter before stopping to avoid timeout
                try {
                    await harness.stopAdapter();
                    console.log('Adapter stopped cleanly');
                } catch (error) {
                    console.log('Adapter stop had issues (may be OK):', error.message);
                }

                if (dataStates.length > 0) {
                    console.log('SUCCESS: HTTP calendar fetching with fetch API works!');
                    console.log('   Data states were created, proving calendar was fetched via HTTP');
                } else {
                    throw new Error('No data states found - HTTP fetch may have failed');
                }
            });
        });
    }
});
