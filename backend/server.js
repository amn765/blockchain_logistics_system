const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychain', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Hyperledger Fabric connection
let gateway;
let network;
let contract;

async function connectToFabric() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '../blockchain/organizations/peerOrganizations/manufacturer.supplychain.com/connection-manufacturer.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node
        gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        network = await gateway.getNetwork('supplychainchannel');

        // Get the contract from the network
        contract = network.getContract('supplychain');

        console.log('Connected to Fabric network');
    } catch (error) {
        console.error(`Failed to connect to Fabric network: ${error}`);
    }
}

// Initialize Fabric connection
connectToFabric();

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Supply Chain API is running' });
});

// Product routes
app.get('/api/products', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllProducts');
        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { id, name, description, owner } = req.body;
        await contract.submitTransaction('CreateProduct', id, name, description, owner);
        res.json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id/transfer', async (req, res) => {
    try {
        const { id } = req.params;
        const { newOwner } = req.body;
        await contract.submitTransaction('TransferProduct', id, newOwner);
        res.json({ message: 'Product transferred successfully' });
    } catch (error) {
        console.error('Error transferring product:', error);
        res.status(500).json({ error: 'Failed to transfer product' });
    }
});

// Transaction routes
app.post('/api/transactions', async (req, res) => {
    try {
        const { id, productId, from, to, amount, currency } = req.body;
        await contract.submitTransaction('CreateTransaction', id, productId, from, to, amount.toString(), currency);
        res.json({ message: 'Transaction created successfully' });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// Logistics routes
app.post('/api/logistics', async (req, res) => {
    try {
        const { id, productId, location, status, handler, notes } = req.body;
        await contract.submitTransaction('UpdateLogisticsRecord', id, productId, location, status, handler, notes);
        res.json({ message: 'Logistics record updated successfully' });
    } catch (error) {
        console.error('Error updating logistics:', error);
        res.status(500).json({ error: 'Failed to update logistics record' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (gateway) {
        await gateway.disconnect();
    }
    process.exit(0);
});
