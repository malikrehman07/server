const { ethers } = require("ethers");
require("dotenv").config();

async function checkContract() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const abi = [
    "function campaignCount() view returns (uint256)",
    "function getCampaign(uint256 _campaignId) view returns (uint256, address, string, string, uint256, uint256, uint8)"
  ];
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

  try {
    const count = await contract.campaignCount();
    console.log("Total Campaigns on Contract:", count.toString());
    
    if (count >= 6n) {
      const c = await contract.getCampaign(6);
      console.log("Campaign 6 Data:", c);
    } else {
      console.log("Campaign 6 does not exist yet on contract.");
    }
  } catch (err) {
    console.error("Contract Error:", err.message);
  }
}

checkContract();
