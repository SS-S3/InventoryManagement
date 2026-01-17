const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { spawn } = require('child_process');
const path = require('path');

const API_URL = 'http://localhost:3000';
let serverProcess;
let adminToken;
let itemId;
let projectId;
let allocationId;

const startServer = () => {
    return new Promise((resolve, reject) => {
        console.log('Starting server...');
        serverProcess = spawn('node', ['server.js'], { cwd: path.join(__dirname, '..'), stdio: 'pipe' });

        serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
            if (data.toString().includes('Server running')) {
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => console.error(`Server Error: ${data}`));
    });
};

const stopServer = () => {
    if (serverProcess) {
        serverProcess.kill();
        console.log('Server stopped.');
    }
};

const runTest = async () => {
    try {
        await startServer();

        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, { username: 'admin', password: 'admin123' });
        adminToken = loginRes.data.token;
        console.log('Logged in as Admin.');

        // 2. Create Test Item (Qty: 20)
        console.log('Creating Test Item...');
        const itemRes = await axios.post(`${API_URL}/items`, {
            name: 'TestItem_Auto',
            description: 'Temporary item for testing',
            cabinet: 'A1',
            quantity: 20,
            location_x: 0,
            location_y: 0
        }, { headers: { Authorization: adminToken } });
        itemId = itemRes.data.id;
        console.log(`Item Created (ID: ${itemId}, Qty: 20)`);

        // 3. Create Test Project
        console.log('Creating Test Project...');
        const projRes = await axios.post(`${API_URL}/projects`, {
            name: 'TestProject_Auto',
            description: 'Temp project'
        }, { headers: { Authorization: adminToken } });
        projectId = projRes.data.id;
        console.log(`Project Created (ID: ${projectId})`);

        // 4. Allocate 5 Items
        console.log('Allocating 5 items...');
        const allocRes = await axios.post(`${API_URL}/allocations`, {
            item_id: itemId,
            project_id: projectId,
            allocated_quantity: 5
        }, { headers: { Authorization: adminToken } });
        allocationId = allocRes.data.id;
        console.log(`Allocation Created (ID: ${allocationId})`);

        // Verify Item Quantity is now 15? 
        // Wait, current allocation implementation in server.js lines 398-406 DOES NOT deduct inventory automatically (it was marked as "Keeping simple").
        // BUT the user request implied "Remove allocations ... and settle borrowings".
        // If allocation didn't deduct, then removing it shouldn't add back?
        // Let's check server.js content again. 
        // Line 402: INSERT INTO allocations...
        // It does NOT update items table.
        // HMMM. If creating allocation doesn't reduce stock, then deleting it adding stock creates magical items.
        // I need to fix the CREATE allocation logic too if I want "Restore" to make sense.
        // Or "Allocation" means something else? Usually it means Reserved.
        // If the user wants "Remove allocations and settle", maybe they imply it SHOULD effect inventory.
        // Let's check items first.

        // 5. Verify Deduction (20 -> 15)
        let itemCheck = await axios.get(`${API_URL}/items`, { headers: { Authorization: adminToken } });
        let item = itemCheck.data.find(i => i.id === itemId);
        console.log(`Qty after Allocation (Expect 15): ${item.quantity}`);

        if (item.quantity !== 15) {
            throw new Error(`Expected Qty 15, got ${item.quantity}. Deduction failed.`);
        }

        // 6. Delete Allocation (My Fix)
        console.log('Deleting Allocation...');
        await axios.delete(`${API_URL}/allocations/${allocationId}`, { headers: { Authorization: adminToken } });
        console.log('Allocation Deleted.');

        // 7. Verify Restoration (15 -> 20)
        itemCheck = await axios.get(`${API_URL}/items`, { headers: { Authorization: adminToken } });
        item = itemCheck.data.find(i => i.id === itemId);
        console.log(`Final Item Qty (Expect 20): ${item.quantity}`);

        if (item.quantity === 20) {
            console.log('SUCCESS: Allocation logic verified (Deduct -> Restore).');
        } else {
            throw new Error(`Expected Qty 20, got ${item.quantity}. Restoration failed.`);
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    } finally {
        stopServer();
        process.exit(0);
    }
};

runTest();
