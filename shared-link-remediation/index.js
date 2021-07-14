const BoxSDK = require('box-node-sdk');
const ExcelJS = require('exceljs');
const moment = require('moment');

// Instantiate a Box service account connection
const boxConfig = require('./box_config.json');
const sdk = BoxSDK.getPreconfiguredInstance(boxConfig);
const client = sdk.getAppAuthClient('enterprise');

// Test mode set to true will not remediate the shared links
const TEST_MODE = true;

// Determines whether you would like to remove the shared link entirely or update it
const REMOVE_SHARED_LINK = false;

// When not removing the shared link, the following are used to determine the shared link update behavior
// SHARED_LINK_UPDATE_STRATEGY = change_access OR new_exp_date
const SHARED_LINK_UPDATE_STRATEGY = 'change_access';

// Used to set the new exp date. Now + 10 days
const SHARED_LINK_NEW_EXP_DATE_DURATION_IN_DAYS = 10;

// The maximum age allowed for a shared link
const SHARED_LINK_THRESHOLD_IN_DAYS = 90;

// File ID to the Shared Link report generated in the Admin Console
const SHARED_LINK_REPORT_FILE_ID = 'CHANGE_ME';

// Main function
async function getSharedLinks() {
    try {
        console.log('Getting shared links...');

        // Get the stream of the report and instantiate the workbook
        const excelFileStream = await client.files.getReadStream(SHARED_LINK_REPORT_FILE_ID);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.read(excelFileStream);

        // Loop through each workbook sheet. There only should be one.
        workbook.eachSheet(worksheet => {
            console.log('Found sheet: ', worksheet.name);

            // Loop through each row in the sheet
            worksheet.eachRow(async (row, rowNumber) => {
                // Skip the header row which iw rowNumber = 1
                if (rowNumber > 1) {
                    // Get the values for each row and parse the values we need
                    const rowValues = row.values;
                    const ownerLogin = rowValues[1];
                    const itemID = rowValues[2];
                    const itemName = rowValues[3];
                    const sharedLinkStatus = rowValues[5];
                    const expirationDateString = rowValues[9];
                    const permissions = rowValues[10];

                    // Check to see if the shared link status is Open. Otherwise, lets ignore it
                    if(sharedLinkStatus === 'Open') {
                        // Check to see if there is already an expiration date. If there is, we want to check for the age of the date
                        if (expirationDateString) {
                            // Get the date difference
                            const expirationDate = moment(expirationDateString, 'MMM D, YYYY');
                            const now = moment();
                            const dateDifference = expirationDate.diff(now, 'days');

                            // Check to see if the difference exceeds the Shared Link Date threshold
                            if(dateDifference > SHARED_LINK_THRESHOLD_IN_DAYS) {
                                console.log(`*** Found shared link that exceeds threshold with itemID: ${itemID}, itemName: ${itemName}, owner login: ${ownerLogin}, status: ${sharedLinkStatus}, exp: ${expirationDateString}, perms: ${permissions}`);
                                // Call the remediateSharedLink fcuntion
                                await remediateSharedLink(ownerLogin, itemName, itemID);
                            }
                        }
                        // Theres no exp date, so lets call the remediateSharedLink function
                        else {
                            console.log(`Found open shared link with no exp with itemID: ${itemID}, itemName: ${itemName}, owner login: ${ownerLogin}, status: ${sharedLinkStatus}, exp: ${expirationDateString}, perms: ${permissions}`);
                            await remediateSharedLink(ownerLogin, itemName, itemID);
                        }
                    }
                }
            })
        })
    }
    catch (err) {
        console.error('Failed to get shared links: ', err.message);
    }
}

async function remediateSharedLink(ownerLogin, itemName, itemID) {
    try{
        // Check to see if we're running in test mode. If TEST_MODE = true, we wont remove or update the shared link
        if(!TEST_MODE) {
            // Get the user object based on the login. The User ID is needed to dynamically change the user using the AS-USER header
            // ATTENTION: This call will throw an error if the ownerLogin is equal to a service account. ie: when the login looks like AutomationUser_123456_123ABC@boxdevedition.com
            const users = await client.enterprise.getUsers({ filter_term: ownerLogin, user_type: client.enterprise.userTypes.ALL, fields: 'id,login'});
            const user = users.entries[0];

            // Make sure we actually found a user make the calls on behalf
            if(user) {
                console.log(`Found user: ${user.login} and id: ${user.id}`);

                // Set the AS-USER header
                client.asUser(user.id);

                // Check if there is a period in the item name. If so, then we know its a file versus a folder shared link.
                let sharedLinkUpdateResponse;
                if(itemName.indexOf('.') > -1) {
                    // Check to see if we want to remove the shared link entirely. If not, we're going to update it
                    if(REMOVE_SHARED_LINK) {
                        // Remove the shared link
                        sharedLinkUpdateResponse = await client.files.update(itemID, {
                            shared_link: null
                        });
                    }
                    // Update the shared link instead of removing it entirely
                    else {
                        // Check to see if we want to change the Shared Link Access from Open to Company
                        if(SHARED_LINK_UPDATE_STRATEGY === 'change_access') {
                            // Update the shared link access
                            sharedLinkUpdateResponse = await client.files.update(itemID, {
                                shared_link: {
                                    access: 'company'
                                }
                            });
                        }
                        // Check to see if we want to update the Shared Link Exp Date
                        else if(SHARED_LINK_UPDATE_STRATEGY === 'new_exp_date') {
                            // Update the shared link exp date
                            sharedLinkUpdateResponse = await client.files.update(itemID, {
                                shared_link: {
                                    unshared_at: moment().add(SHARED_LINK_NEW_EXP_DATE_DURATION_IN_DAYS, 'days').toISOString()                            }
                            });
                        }
                    }
                }
                else {
                    // Check to see if we want to remove the shared link entirely. If not, we're going to update it
                    if(REMOVE_SHARED_LINK) {
                        // Remove the shared link
                        sharedLinkUpdateResponse = await client.folders.update(itemID, {
                            shared_link: null
                        });
                    }
                    // Update the shared link instead of removing it entirely
                    else {
                        // Check to see if we want to change the Shared Link Access from Open to Company
                        if(SHARED_LINK_UPDATE_STRATEGY === 'change_access') {
                            // Update the shared link access
                            sharedLinkUpdateResponse = await client.folders.update(itemID, {
                                shared_link: {
                                    access: 'company'
                                }
                            });
                        }
                        // Check to see if we want to update the Shared Link Exp Date
                        else if(SHARED_LINK_UPDATE_STRATEGY === 'new_exp_date') {
                            // Update the shared link exp date
                            sharedLinkUpdateResponse = await client.folders.update(itemID, {
                                shared_link: {
                                    unshared_at: moment().add(SHARED_LINK_NEW_EXP_DATE_DURATION_IN_DAYS, 'days').toISOString()                            }
                            });
                        }
                    }
                }
                // console.log('Successfully updated shared link: ', JSON.stringify(sharedLinkUpdateResponse, null, 2));
                console.log(`Successfully remediated open shared link with no exp with itemID: ${itemID}, itemName: ${itemName}, and owner: ${ownerLogin}`);

                // Switch back to the application service account
                client.asSelf();
            }
        }
    }
    catch (e) {
        console.error('Failed to remediate shared link: ', e.message);
    }


}

getSharedLinks();