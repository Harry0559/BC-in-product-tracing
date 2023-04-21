const { ethers } = require("hardhat");
const path = require("path");

async function main() {
    // This is just a convenience check
    if (network.name === "hardhat") {
        console.warn(
        "You are trying to deploy a contract to the Hardhat Network, which" +
            "gets automatically created and destroyed every time. Use the Hardhat" +
            " option '--network localhost'"
        );
    }

    const [deployer] = await ethers.getSigners();
    console.log("Deploying the contract with the account:", await deployer.getAddress());
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const TracingFactory = await ethers.getContractFactory("Tracing");
    const Tracing = await TracingFactory.deploy();
    await Tracing.deployed();

    console.log("Tracing contract address:", Tracing.address);

    saveFrontendFiles(Tracing);
}

function saveFrontendFiles(Tracing) {
    const fs = require("fs");
    const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
  
    fs.writeFileSync(
      path.join(contractsDir, "contract-address.json"),
      JSON.stringify({ Tracing: Tracing.address }, undefined, 2)
    );
  
    const TracingArtifact = artifacts.readArtifactSync("Tracing");
  
    fs.writeFileSync(
      path.join(contractsDir, "Tracing.json"),
      JSON.stringify(TracingArtifact, null, 2)
    );
  }

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });